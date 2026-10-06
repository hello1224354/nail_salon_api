import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { IsNull } from "typeorm";
import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../common/errors";
import { LoginMfaChallenge } from "./login-mfa-challenge.entity";
import { User } from "./users.entity";
import { isEmailDeliveryConfigured, sendPlainTextEmail } from "./email.service";

const challengeRepo = AppDataSource.getRepository(LoginMfaChallenge);
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
            "Mã xác nhận đăng nhập quản trị Serpente Nail Room",
            [
                `Mã OTP đăng nhập quản trị của bạn là: ${code}`,
                "",
                "Mã có hiệu lực trong 5 phút và chỉ dùng được một lần.",
                "Nếu bạn không thực hiện đăng nhập này, hãy đổi mật khẩu ngay.",
            ].join("\n")
        );
    } catch (error) {
        challenge.consumed_at = new Date();
        await challengeRepo.save(challenge);
        throw error;
    }

    return {
        challengeId: challenge.id,
        expiresAt: challenge.expires_at,
        maskedEmail: maskEmail(user.email),
    };
}

export async function verifyLoginMfaChallenge(challengeId: string, code: string) {
    const challenge = await challengeRepo.findOneBy({ id: challengeId });

    if (
        !challenge ||
        challenge.consumed_at ||
        challenge.expires_at.getTime() <= Date.now() ||
        challenge.attempts_remaining <= 0
    ) {
        throw new AppError("Invalid or expired MFA code", 401, "INVALID_MFA_CODE");
    }

    const expected = hashCode(challenge.id, code);

    if (!hashesMatch(expected, challenge.code_hash)) {
        challenge.attempts_remaining -= 1;
        if (challenge.attempts_remaining <= 0) challenge.consumed_at = new Date();
        await challengeRepo.save(challenge);

        throw new AppError("Invalid or expired MFA code", 401, "INVALID_MFA_CODE");
    }

    const user = await userRepo.findOneBy({ id: challenge.user_id });

    if (!user || !user.is_active) {
        challenge.consumed_at = new Date();
        await challengeRepo.save(challenge);
        throw new AppError("Invalid or expired MFA code", 401, "INVALID_MFA_CODE");
    }

    challenge.consumed_at = new Date();
    await challengeRepo.save(challenge);

    return user;
}
