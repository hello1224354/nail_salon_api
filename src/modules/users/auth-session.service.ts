import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import jwt, { VerifyOptions } from "jsonwebtoken";
import { IsNull } from "typeorm";
import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../common/errors";
import { RefreshSession } from "./refresh-session.entity";
import { User } from "./users.entity";

const refreshSessionRepo = AppDataSource.getRepository(RefreshSession);
const userRepo = AppDataSource.getRepository(User);

const ACCESS_TOKEN_ISSUER = "nail-salon-api";
const ACCESS_TOKEN_AUDIENCE = "nail-salon-web";
const REFRESH_TOKEN_BYTES = 32;

type SessionFingerprint = {
    ipHash: string | null;
    userAgentHash: string | null;
};

function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

function tokenHashMatches(token: string, expectedHash: string) {
    const actual = Buffer.from(hashToken(token), "hex");
    const expected = Buffer.from(expectedHash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function buildRefreshToken(sessionId: string) {
    const secret = randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
    return `${sessionId}.${secret}`;
}

function getSessionId(refreshToken: string) {
    const [sessionId, secret, extra] = refreshToken.split(".");
    if (!sessionId || !secret || extra !== undefined) return null;
    if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
    return sessionId;
}

export function signAccessToken(user: User) {
    return jwt.sign(
        {
            type: "access",
            role: user.role,
            ver: user.token_version,
        },
        env.JWT_SECRET,
        {
            algorithm: "HS256",
            audience: ACCESS_TOKEN_AUDIENCE,
            issuer: ACCESS_TOKEN_ISSUER,
            subject: user.id,
            jwtid: randomUUID(),
            expiresIn: env.JWT_EXPIRES_IN_SECONDS,
        }
    );
}

export function getAccessTokenVerifyOptions(): VerifyOptions {
    return {
        algorithms: ["HS256"],
        audience: ACCESS_TOKEN_AUDIENCE,
        issuer: ACCESS_TOKEN_ISSUER,
    };
}

export async function createLoginSession(user: User, fingerprint: SessionFingerprint, persistent = true) {
    return await AppDataSource.transaction(async (manager) => {
        const transactionUserRepo = manager.getRepository(User);
        const transactionSessionRepo = manager.getRepository(RefreshSession);

        const currentUser = await transactionUserRepo.findOne({
            where: { id: user.id },
            lock: { mode: "pessimistic_read" },
        });

        if (!currentUser || !currentUser.is_active || currentUser.token_version !== user.token_version) {
            throw new AppError(
                "Authentication state changed. Please sign in again",
                401,
                "AUTHENTICATION_RESTART_REQUIRED"
            );
        }

        const id = randomUUID();
        const familyId = randomUUID();
        const refreshToken = buildRefreshToken(id);
        const expiresAt = new Date(Date.now() + env.REFRESH_SESSION_DAYS * 24 * 60 * 60 * 1000);

        const session = transactionSessionRepo.create({
            id,
            user_id: currentUser.id,
            family_id: familyId,
            token_hash: hashToken(refreshToken),
            expires_at: expiresAt,
            revoked_at: null,
            replaced_by: null,
            ip_hash: fingerprint.ipHash,
            user_agent_hash: fingerprint.userAgentHash,
            persistent,
        });

        await transactionSessionRepo.save(session);

        return {
            accessToken: signAccessToken(currentUser),
            refreshToken,
            refreshExpiresAt: expiresAt,
            persistent,
        };
    });
}

export async function refreshSession(refreshToken: string, fingerprint: SessionFingerprint) {
    const sessionId = getSessionId(refreshToken);
    if (!sessionId) throw new AppError("Invalid refresh session", 401, "INVALID_REFRESH_SESSION");

    const sessionHint = await refreshSessionRepo.findOneBy({ id: sessionId });
    if (!sessionHint || !tokenHashMatches(refreshToken, sessionHint.token_hash)) {
        throw new AppError("Invalid refresh session", 401, "INVALID_REFRESH_SESSION");
    }

    const result = await AppDataSource.transaction(async (manager) => {
        const sessionRepo = manager.getRepository(RefreshSession);
        const transactionUserRepo = manager.getRepository(User);

        const user = await transactionUserRepo.findOne({
            where: { id: sessionHint.user_id },
            lock: { mode: "pessimistic_write" },
        });

        const session = await sessionRepo.findOne({
            where: { id: sessionId },
            lock: { mode: "pessimistic_write" },
        });

        if (!session || !tokenHashMatches(refreshToken, session.token_hash)) {
            return {
                kind: "error" as const,
                code: "INVALID_REFRESH_SESSION",
                message: "Invalid refresh session",
                status: 401,
            };
        }

        if (session.revoked_at) {
            if (session.replaced_by) {
                const rotationAgeMs = Date.now() - session.revoked_at.getTime();
                const sameFingerprint =
                    session.ip_hash === fingerprint.ipHash &&
                    session.user_agent_hash === fingerprint.userAgentHash;

                if (sameFingerprint && rotationAgeMs >= 0 && rotationAgeMs <= 5_000) {
                    return {
                        kind: "error" as const,
                        code: "REFRESH_RACE",
                        message: "Refresh session was just rotated",
                        status: 409,
                    };
                }

                await sessionRepo.update(
                    { family_id: session.family_id, revoked_at: IsNull() },
                    { revoked_at: new Date() }
                );

                return {
                    kind: "error" as const,
                    code: "REFRESH_TOKEN_REUSE",
                    message: "Refresh token reuse detected",
                    status: 401,
                };
            }

            return {
                kind: "error" as const,
                code: "INVALID_REFRESH_SESSION",
                message: "Refresh session is revoked",
                status: 401,
            };
        }

        if (session.expires_at.getTime() <= Date.now()) {
            session.revoked_at = new Date();
            await sessionRepo.save(session);

            return {
                kind: "error" as const,
                code: "INVALID_REFRESH_SESSION",
                message: "Refresh session expired",
                status: 401,
            };
        }

        if (!user || !user.is_active || user.id !== session.user_id) {
            await sessionRepo.update(
                { family_id: session.family_id, revoked_at: IsNull() },
                { revoked_at: new Date() }
            );

            return {
                kind: "error" as const,
                code: "INVALID_REFRESH_SESSION",
                message: "Refresh session is no longer valid",
                status: 401,
            };
        }

        const newSessionId = randomUUID();
        const newRefreshToken = buildRefreshToken(newSessionId);
        const replacement = sessionRepo.create({
            id: newSessionId,
            user_id: user.id,
            family_id: session.family_id,
            token_hash: hashToken(newRefreshToken),
            expires_at: session.expires_at,
            revoked_at: null,
            replaced_by: null,
            ip_hash: fingerprint.ipHash,
            user_agent_hash: fingerprint.userAgentHash,
            persistent: session.persistent,
        });

        session.revoked_at = new Date();
        session.replaced_by = replacement.id;

        await sessionRepo.save(replacement);
        await sessionRepo.save(session);

        return {
            kind: "ok" as const,
            user,
            accessToken: signAccessToken(user),
            refreshToken: newRefreshToken,
            refreshExpiresAt: replacement.expires_at,
            familyId: replacement.family_id,
            persistent: replacement.persistent,
        };
    });

    if (result.kind === "error") {
        throw new AppError(result.message, result.status, result.code);
    }

    return result;
}

export async function revokeRefreshSession(refreshToken: string) {
    const sessionId = getSessionId(refreshToken);
    if (!sessionId) return null;

    const sessionHint = await refreshSessionRepo.findOneBy({ id: sessionId });
    if (!sessionHint || !tokenHashMatches(refreshToken, sessionHint.token_hash)) return null;

    return await AppDataSource.transaction(async (manager) => {
        const sessionRepo = manager.getRepository(RefreshSession);
        const transactionUserRepo = manager.getRepository(User);

        await transactionUserRepo.findOne({
            where: { id: sessionHint.user_id },
            lock: { mode: "pessimistic_write" },
        });

        const session = await sessionRepo.findOne({
            where: { id: sessionId },
            lock: { mode: "pessimistic_write" },
        });

        if (!session || !tokenHashMatches(refreshToken, session.token_hash)) return null;

        await sessionRepo.update(
            { family_id: session.family_id, revoked_at: IsNull() },
            { revoked_at: new Date() }
        );

        return session;
    });
}

export async function revokeAllUserSessions(userId: string) {
    await refreshSessionRepo.update(
        { user_id: userId, revoked_at: IsNull() },
        { revoked_at: new Date() }
    );
}

export async function getSessionUser(refreshToken: string) {
    const sessionId = getSessionId(refreshToken);
    if (!sessionId) return null;

    const session = await refreshSessionRepo.findOneBy({ id: sessionId });
    if (!session || !tokenHashMatches(refreshToken, session.token_hash)) return null;

    return await userRepo.findOneBy({ id: session.user_id });
}
