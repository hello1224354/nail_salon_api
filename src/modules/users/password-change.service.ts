import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { EntityManager, IsNull } from "typeorm";
import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../common/errors";
import { PasswordChangeChallenge } from "./password-change-challenge.entity";
import { User } from "./users.entity";
import { maskEmail } from "./login-mfa.service";
import { sendPlainTextEmail } from "./email.service";

const challengeRepo = AppDataSource.getRepository(PasswordChangeChallenge);
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

export async function requestPasswordChangeCode(userId: string) {
    const issued = await AppDataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const passwordChangeRepo = manager.getRepository(PasswordChangeChallenge);

        const user = await userRepo.findOne({
            where: { id: userId },
            lock: { mode: "pessimistic_write" },
        });

        if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
        if (!user.email) throw new AppError("Account email is required", 400, "EMAIL_REQUIRED");

        await passwordChangeRepo.update(
            { user_id: user.id, consumed_at: IsNull() },
            { consumed_at: new Date() }
        );

        const id = randomUUID();
        const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
        const challenge = passwordChangeRepo.create({
            id,
            user_id: user.id,
            code_hash: hashCode(id, code),
            expires_at: new Date(Date.now() + OTP_TTL_MS),
            attempts_remaining: OTP_ATTEMPTS,
            consumed_at: null,
        });

        await passwordChangeRepo.save(challenge);

        return {
            challenge,
            email: user.email,
            code,
        };
    });

    try {
        await sendPlainTextEmail(
            issued.email,
            "Mã xác nhận đổi mật khẩu Serpente Nail Room",
            [
                `Mã OTP đổi mật khẩu của bạn là: ${issued.code}`,
                "",
                "Mã có hiệu lực trong 5 phút và chỉ dùng được một lần.",
                "Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này.",
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
        maskedEmail: maskEmail(issued.email),
        expiresAt: issued.challenge.expires_at,
    };
}

export async function consumePasswordChangeCode(
    manager: EntityManager,
    userId: string,
    code: string
) {
    const passwordChangeRepo = manager.getRepository(PasswordChangeChallenge);

    const challenge = await passwordChangeRepo.findOne({
        where: {
            user_id: userId,
            consumed_at: IsNull(),
        },
        order: { created_at: "DESC" },
        lock: { mode: "pessimistic_write" },
    });

    if (
        !challenge ||
        challenge.expires_at.getTime() <= Date.now() ||
        challenge.attempts_remaining <= 0
    ) {
        return false;
    }

    const expected = hashCode(challenge.id, code);

    if (!hashesMatch(expected, challenge.code_hash)) {
        challenge.attempts_remaining -= 1;
        if (challenge.attempts_remaining <= 0) challenge.consumed_at = new Date();
        await passwordChangeRepo.save(challenge);
        return false;
    }

    await passwordChangeRepo.update(
        { user_id: userId, consumed_at: IsNull() },
        { consumed_at: new Date() }
    );

    return true;
}
