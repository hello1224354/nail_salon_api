import { createHash, randomBytes } from "crypto";
import { IsNull } from "typeorm";
import { AppDataSource } from "../../config/database";
import { TrustedLoginDevice } from "./trusted-login-device.entity";
import { User } from "./users.entity";
import { matchesTrustedLoginDevice } from "./trusted-login-device.logic";

const repo = AppDataSource.getRepository(TrustedLoginDevice);

function hashToken(value: string) {
    return createHash("sha256").update(value).digest("hex");
}

export async function isTrustedLoginDevice(
    user: User,
    proof: string | null,
    userAgentHash: string | null,
): Promise<boolean> {
    if (!proof || !/^[A-Za-z0-9_-]{43}$/.test(proof)) return false;

    const record = await repo.findOneBy({ token_hash: hashToken(proof) });

    return matchesTrustedLoginDevice(record, user, userAgentHash, Date.now());
}

/** Call only after an email OTP is verified AND an authenticated session exists. */
export async function issueTrustedLoginDevice(
    user: User,
    userAgentHash: string | null,
    previousProof: string | null,
    expiresAt: Date,
) {
    const secret = randomBytes(32).toString("base64url");
    const now = new Date();

    // A new successful OTP can replace this browser's old trust proof, without
    // touching any other browser's trust or modifying the user's login sessions.
    await AppDataSource.transaction(async (manager) => {
        if (previousProof && /^[A-Za-z0-9_-]{43}$/.test(previousProof)) {
            await manager.getRepository(TrustedLoginDevice).update(
                { token_hash: hashToken(previousProof), revoked_at: IsNull() },
                { revoked_at: now }
            );
        }

        await manager.getRepository(TrustedLoginDevice).save({
            user_id: user.id,
            token_hash: hashToken(secret),
            token_version: user.token_version,
            user_agent_hash: userAgentHash,
            expires_at: expiresAt,
            revoked_at: null,
        });
    });

    return secret;
}

export async function revokeUserTrustedDevices(userId: string) {
    await repo.update({ user_id: userId, revoked_at: IsNull() }, { revoked_at: new Date() });
}

