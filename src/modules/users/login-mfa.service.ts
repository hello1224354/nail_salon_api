import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { IsNull } from "typeorm";
import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../common/errors";
import { LoginMfaChallenge } from "./login-mfa-challenge.entity";
import { User } from "./users.entity";
import { isEmailDeliveryConfigured, sendPlainTextEmail } from "./email.service";

const challengeRepo = AppDataSource.getRepository(LoginMfaChallenge);

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_ATTEMPTS = 5;

function hashCode(challengeId: string, code: string) {
    return createHmac("sha256", env.JWT_SECRET)
        .update(`${challengeId}:${code}`)
        .digest("hex");
}

function hashesMatch(actualHex: string, expectedHex: string) {
    const actual = Buffer.from(actualHex, "hex");
    const expected = Buffer.from(expectedHex, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function maskEmail(email: string) {
    const [local, domain] = email.split("@");
    if (!local || !domain) return "***";

    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

export async function createLoginMfaChallenge(user: User) {
    if (!user.email) {
        throw new AppError("Admin account requires an email address for MFA", 403, "MFA_EMAIL_REQUIRED");
    }

    if (!isEmailDeliveryConfigured()) {
        throw new AppError("Admin MFA email delivery is not configured", 503, "MFA_NOT_CONFIGURED");
    }

    const id = randomUUID();
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    const issued = await AppDataSource.transaction(async (manager) => {
        const transactionUserRepo = manager.getRepository(User);
        const transactionChallengeRepo = manager.getRepository(LoginMfaChallenge);

        const lockedUser = await transactionUserRepo.findOne({
            where: { id: user.id },
            lock: { mode: "pessimistic_write" },
        });

        if (!lockedUser || !lockedUser.email) {
            throw new AppError("Admin account requires an email address for MFA", 403, "MFA_EMAIL_REQUIRED");
        }

        await transactionChallengeRepo.update(
            { user_id: lockedUser.id, consumed_at: IsNull() },
            { consumed_at: new Date() }
        );

        const challenge = transactionChallengeRepo.create({
            id,
            user_id: lockedUser.id,
            code_hash: hashCode(id, code),
            expires_at: expiresAt,
            attempts_remaining: OTP_ATTEMPTS,
            consumed_at: null,
        });

        await transactionChallengeRepo.save(challenge);

        return {
            challenge,
            email: lockedUser.email,
        };
    });

    try {
        await sendPlainTextEmail(
            issued.email,
            "Mã xác nhận đăng nhập quản trị Serpente Nail Room",
            [
                `Mã OTP đăng nhập quản trị của bạn là: ${code}`,
                "",
                "Mã có hiệu lực trong 5 phút và chỉ dùng được một lần.",
                "Nếu bạn không thực hiện đăng nhập này, hãy đổi mật khẩu ngay.",
            ].join("\n")
        );
    } catch (error) {
        await challengeRepo.update(
            { id: issued.challenge.id },
            { consumed_at: new Date() }
        );
        throw error;
    }

    return {
        challengeId: issued.challenge.id,
        expiresAt: issued.challenge.expires_at,
        maskedEmail: maskEmail(issued.email),
    };
}

export async function verifyLoginMfaChallenge(challengeId: string, code: string) {
    const challengeHint = await challengeRepo.findOneBy({ id: challengeId });

    if (!challengeHint) {
        throw new AppError("Invalid or expired MFA code", 401, "INVALID_MFA_CODE");
    }

    const result = await AppDataSource.transaction(async (manager) => {
        const transactionChallengeRepo = manager.getRepository(LoginMfaChallenge);
        const transactionUserRepo = manager.getRepository(User);

        const user = await transactionUserRepo.findOne({
            where: { id: challengeHint.user_id },
            lock: { mode: "pessimistic_read" },
        });

        const challenge = await transactionChallengeRepo.findOne({
            where: { id: challengeId },
            lock: { mode: "pessimistic_write" },
        });

        if (
            !user ||
            !challenge ||
            challenge.user_id !== user.id ||
            challenge.consumed_at ||
            challenge.expires_at.getTime() <= Date.now() ||
            challenge.attempts_remaining <= 0
        ) {
            return { ok: false as const };
        }

        const expected = hashCode(challenge.id, code);

        if (!hashesMatch(expected, challenge.code_hash)) {
            challenge.attempts_remaining -= 1;
            if (challenge.attempts_remaining <= 0) challenge.consumed_at = new Date();
            await transactionChallengeRepo.save(challenge);

            return { ok: false as const };
        }

        challenge.consumed_at = new Date();
        await transactionChallengeRepo.save(challenge);

        return { ok: true as const, user };
    });

    if (!result.ok) {
        throw new AppError("Invalid or expired MFA code", 401, "INVALID_MFA_CODE");
    }

    return result.user;
}
