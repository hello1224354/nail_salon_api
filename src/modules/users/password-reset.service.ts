import bcrypt from "bcryptjs";
import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { IsNull } from "typeorm";
import { RefreshSession } from "./refresh-session.entity";
import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../common/errors";
import { PasswordResetChallenge } from "./password-reset-challenge.entity";
import { User } from "./users.entity";
import { sendPlainTextEmail } from "./email.service";

const challengeRepo = AppDataSource.getRepository(PasswordResetChallenge);

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

export async function requestPasswordReset(email: string) {
    const issued = await AppDataSource.transaction(async (manager) => {
        const transactionUserRepo = manager.getRepository(User);
        const transactionChallengeRepo = manager.getRepository(PasswordResetChallenge);

        const user = await transactionUserRepo.findOne({
            where: { email },
            lock: { mode: "pessimistic_write" },
        });

        if (!user || !user.email) {
            return null;
        }

        await transactionChallengeRepo.update(
            { user_id: user.id, consumed_at: IsNull() },
            { consumed_at: new Date() }
        );

        const id = randomUUID();
        const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
        const challenge = transactionChallengeRepo.create({
            id,
            user_id: user.id,
            code_hash: hashCode(id, code),
            expires_at: new Date(Date.now() + OTP_TTL_MS),
            attempts_remaining: OTP_ATTEMPTS,
            consumed_at: null,
        });

        await transactionChallengeRepo.save(challenge);

        return {
            challenge,
            email: user.email,
            code,
        };
    });

    if (!issued) {
        return;
    }

    try {
        await sendPlainTextEmail(
            issued.email,
            "Mã đặt lại mật khẩu Serpente Nail Room",
            [
                `Mã OTP đặt lại mật khẩu của bạn là: ${issued.code}`,
                "",
                "Mã có hiệu lực trong 5 phút và chỉ dùng được một lần.",
                "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.",
            ].join("\n")
        );
    } catch (error) {
        await challengeRepo.update(
            { id: issued.challenge.id },
            { consumed_at: new Date() }
        );
        console.error("Failed to deliver password reset email", error);
    }
}

export async function resetPassword(email: string, code: string, newPassword: string) {
    const nextPasswordHash = await bcrypt.hash(newPassword, 12);

    const result = await AppDataSource.transaction(async (manager) => {
        const transactionUserRepo = manager.getRepository(User);
        const transactionChallengeRepo = manager.getRepository(PasswordResetChallenge);
        const transactionRefreshSessionRepo = manager.getRepository(RefreshSession);

        const user = await transactionUserRepo.findOne({
            where: { email },
            lock: { mode: "pessimistic_write" },
        });

        if (!user) {
            return { ok: false as const };
        }

        const challenge = await transactionChallengeRepo.findOne({
            where: {
                user_id: user.id,
                consumed_at: IsNull(),
            },
            order: {
                created_at: "DESC",
            },
            lock: { mode: "pessimistic_write" },
        });

        if (!challenge || challenge.expires_at.getTime() <= Date.now() || challenge.attempts_remaining <= 0) {
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
        user.password_hash = nextPasswordHash;
        user.token_version += 1;

        await transactionChallengeRepo.save(challenge);
        await transactionUserRepo.save(user);
        await transactionRefreshSessionRepo.update(
            { user_id: user.id, revoked_at: IsNull() },
            { revoked_at: new Date() }
        );

        return { ok: true as const, user };
    });

    if (!result.ok) {
        throw new AppError("Invalid or expired reset code", 400, "INVALID_RESET_CODE");
    }

    return result.user;
}
