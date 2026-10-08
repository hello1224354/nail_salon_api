import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { IsNull } from "typeorm";
import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../common/errors";
import { RegistrationEmailChallenge } from "./registration-email-challenge.entity";
import { User, UserRole } from "./users.entity";
import type { RegisterUserDto } from "./users.dto";
import * as userService from "./users.service";
import { maskEmail } from "./login-mfa.service";
import { sendPlainTextEmail } from "./email.service";

const challengeRepo = AppDataSource.getRepository(RegistrationEmailChallenge);
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

export async function requestRegistrationVerification(email: string) {
    const issued = await AppDataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const registrationRepo = manager.getRepository(RegistrationEmailChallenge);

        const existing = await userRepo.findOne({
            where: { email },
            lock: { mode: "pessimistic_read" },
        });

        if (existing) {
            throw new AppError(
                "Unable to create account with the supplied information",
                409,
                "REGISTRATION_UNAVAILABLE"
            );
        }

        await registrationRepo.update(
            { email, consumed_at: IsNull() },
            { consumed_at: new Date() }
        );

        const id = randomUUID();
        const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
        const challenge = registrationRepo.create({
            id,
            email,
            code_hash: hashCode(id, code),
            expires_at: new Date(Date.now() + OTP_TTL_MS),
            attempts_remaining: OTP_ATTEMPTS,
            consumed_at: null,
        });

        await registrationRepo.save(challenge);

        return { challenge, code };
    });

    try {
        await sendPlainTextEmail(
            email,
            "Mã xác minh email Serpente Nail Room",
            [
                `Mã OTP xác minh email của bạn là: ${issued.code}`,
                "",
                "Mã có hiệu lực trong 5 phút và chỉ dùng được một lần.",
                "Tài khoản chỉ được tạo sau khi mã này được xác minh.",
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
        maskedEmail: maskEmail(email),
        expiresAt: issued.challenge.expires_at,
    };
}

export async function registerVerifiedUser(data: RegisterUserDto, code: string) {
    const result = await AppDataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const registrationRepo = manager.getRepository(RegistrationEmailChallenge);

        const existing = await userRepo.findOne({
            where: { email: data.email },
            lock: { mode: "pessimistic_read" },
        });

        if (existing) {
            return { kind: "unavailable" as const };
        }

        const challenge = await registrationRepo.findOne({
            where: {
                email: data.email,
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
            return { kind: "invalid_code" as const };
        }

        const expected = hashCode(challenge.id, code);

        if (!hashesMatch(expected, challenge.code_hash)) {
            challenge.attempts_remaining -= 1;
            if (challenge.attempts_remaining <= 0) challenge.consumed_at = new Date();
            await registrationRepo.save(challenge);

            return { kind: "invalid_code" as const };
        }

        const user = await userService.createUser(data, UserRole.CUSTOMER, manager);
        const consumedAt = new Date();

        await registrationRepo.update(
            { email: data.email, consumed_at: IsNull() },
            { consumed_at: consumedAt }
        );

        return { kind: "ok" as const, user };
    });

    if (result.kind === "unavailable") {
        throw new AppError(
            "Unable to create account with the supplied information",
            409,
            "REGISTRATION_UNAVAILABLE"
        );
    }

    if (result.kind === "invalid_code") {
        throw new AppError("Invalid or expired verification code", 400, "INVALID_VERIFICATION_CODE");
    }

    return result.user;
}
