import bcrypt from "bcryptjs";
import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { IsNull } from "typeorm";
import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../common/errors";
import { PasswordResetChallenge } from "./password-reset-challenge.entity";
import { User } from "./users.entity";
import { sendPlainTextEmail } from "./email.service";
import { revokeAllUserSessions } from "./auth-session.service";

const challengeRepo = AppDataSource.getRepository(PasswordResetChallenge);
const userRepo = AppDataSource.getRepository(User);

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
    const user = await userRepo.findOneBy({ email });

    if (!user || !user.email) {
        return;
    }

    await challengeRepo.update(
        { user_id: user.id, consumed_at: IsNull() },
        { consumed_at: new Date() }
    );

    const id = randomUUID();
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const challenge = challengeRepo.create({
        id,
        user_id: user.id,
        code_hash: hashCode(id, code),
        expires_at: new Date(Date.now() + OTP_TTL_MS),
        attempts_remaining: OTP_ATTEMPTS,
        consumed_at: null,
    });

    await challengeRepo.save(challenge);

    try {
        await sendPlainTextEmail(
            user.email,
            "Mã đặt lại mật khẩu Serpente Nail Room",
            [
                `Mã OTP đặt lại mật khẩu của bạn là: ${code}`,
                "",
                "Mã có hiệu lực trong 5 phút và chỉ dùng được một lần.",
                "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.",
            ].join("\n")
        );
    } catch (error) {
        challenge.consumed_at = new Date();
        await challengeRepo.save(challenge);
        console.error("Failed to deliver password reset email", error);
    }
}

export async function resetPassword(email: string, code: string, newPassword: string) {
    const user = await userRepo.findOneBy({ email });

    if (!user) {
        throw new AppError("Invalid or expired reset code", 400, "INVALID_RESET_CODE");
    }

    const challenge = await challengeRepo.findOne({
        where: {
            user_id: user.id,
            consumed_at: IsNull(),
        },
        order: {
            created_at: "DESC",
        },
    });

    if (!challenge || challenge.expires_at.getTime() <= Date.now() || challenge.attempts_remaining <= 0) {
        throw new AppError("Invalid or expired reset code", 400, "INVALID_RESET_CODE");
    }

    const expected = hashCode(challenge.id, code);

    if (!hashesMatch(expected, challenge.code_hash)) {
        challenge.attempts_remaining -= 1;
        if (challenge.attempts_remaining <= 0) challenge.consumed_at = new Date();
        await challengeRepo.save(challenge);

        throw new AppError("Invalid or expired reset code", 400, "INVALID_RESET_CODE");
    }

    challenge.consumed_at = new Date();
    user.password_hash = await bcrypt.hash(newPassword, 12);
    user.token_version += 1;

    await AppDataSource.transaction(async (manager) => {
        await manager.getRepository(PasswordResetChallenge).save(challenge);
        await manager.getRepository(User).save(user);
    });

    await revokeAllUserSessions(user.id);

    return user;
}
