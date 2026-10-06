import { AppError } from "../../common/errors";

export interface RegisterUserDto {
    full_name: string;
    phone: string;
    email: string | null;
    password: string;
}

export interface LoginUserDto {
    phone: string;
    password: string;
}

export interface ChangePasswordDto {
    current_password: string;
    new_password: string;
}

export interface ForgotPasswordDto {
    email: string;
}

export interface ResetPasswordDto {
    email: string;
    code: string;
    new_password: string;
}

export interface VerifyLoginMfaDto {
    challenge_id: string;
    code: string;
}

function normalizePhone(value: string): string {
    const phone = value.replace(/[\s.-]/g, "");

    if (phone.startsWith("+84")) return phone;
    if (phone.startsWith("84")) return `+${phone}`;
    if (phone.startsWith("0")) return `+84${phone.slice(1)}`;

    return phone;
}

function parseEmail(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > 255) {
        throw new AppError("Email must be between 1 and 255 characters", 400, "VALIDATION_ERROR");
    }

    const email = value.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError("Email must be valid", 400, "VALIDATION_ERROR");
    }

    return email;
}

function parsePassword(value: unknown, fieldName: string) {
    if (typeof value !== "string") {
        throw new AppError(`${fieldName} must be a string`, 400, "VALIDATION_ERROR");
    }

    if (value.length < 8) {
        throw new AppError(`${fieldName} must be at least 8 characters`, 400, "VALIDATION_ERROR");
    }

    if (Buffer.byteLength(value, "utf8") > 72) {
        throw new AppError(`${fieldName} is too long`, 400, "VALIDATION_ERROR");
    }

    return value;
}

export function parseRegisterUserDto(body: unknown): RegisterUserDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    }

    const data = body as Record<string, unknown>;

    if (
        typeof data.full_name !== "string" ||
        data.full_name.trim().length === 0 ||
        data.full_name.trim().length > 255
    ) {
        throw new AppError("Full_name must be between 1 and 255 characters", 400, "VALIDATION_ERROR");
    }

    if (typeof data.phone !== "string" || data.phone.trim().length === 0) {
        throw new AppError("Phone must be a non-empty string", 400, "VALIDATION_ERROR");
    }

    const phone = normalizePhone(data.phone);

    if (!/^\+84\d{9}$/.test(phone)) {
        throw new AppError("Phone must be a valid Vietnamese phone number", 400, "VALIDATION_ERROR");
    }

    let email: string | null = null;

    if (data.email !== undefined && data.email !== null) {
        email = parseEmail(data.email);
    }

    return {
        full_name: data.full_name.trim(),
        phone,
        email,
        password: parsePassword(data.password, "Password"),
    };
}

export function parseLoginUserDto(body: unknown): LoginUserDto {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    }

    const data = body as Record<string, unknown>;

    if (typeof data.phone !== "string" || data.phone.trim().length === 0) {
        throw new AppError("Phone must be a non-empty string", 400, "VALIDATION_ERROR");
    }

    const phone = normalizePhone(data.phone);

    if (!/^\+84\d{9}$/.test(phone)) {
        throw new AppError("Phone must be a valid Vietnamese phone number", 400, "VALIDATION_ERROR");
    }

    if (typeof data.password !== "string" || data.password.length === 0) {
        throw new AppError("Password must be a non-empty string", 400, "VALIDATION_ERROR");
    }

    if (Buffer.byteLength(data.password, "utf8") > 72) {
        throw new AppError("Password is too long", 400, "VALIDATION_ERROR");
    }

    return {
        phone,
        password: data.password,
    };
}

export function parseChangePasswordDto(body: unknown): ChangePasswordDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    }

    const data = body as Record<string, unknown>;

    if (typeof data.current_password !== "string" || data.current_password.length === 0) {
        throw new AppError("Current_password must be a non-empty string", 400, "VALIDATION_ERROR");
    }

    if (Buffer.byteLength(data.current_password, "utf8") > 72) {
        throw new AppError("Current_password is too long", 400, "VALIDATION_ERROR");
    }

    const newPassword = parsePassword(data.new_password, "New_password");

    if (data.current_password === newPassword) {
        throw new AppError("New password must be different", 400, "VALIDATION_ERROR");
    }

    return {
        current_password: data.current_password,
        new_password: newPassword,
    };
}

export function parseForgotPasswordDto(body: unknown): ForgotPasswordDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    }

    const data = body as Record<string, unknown>;

    return {
        email: parseEmail(data.email),
    };
}

export function parseResetPasswordDto(body: unknown): ResetPasswordDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    }

    const data = body as Record<string, unknown>;

    if (typeof data.code !== "string" || !/^\d{6}$/.test(data.code)) {
        throw new AppError("Code must be a 6-digit OTP", 400, "VALIDATION_ERROR");
    }

    return {
        email: parseEmail(data.email),
        code: data.code,
        new_password: parsePassword(data.new_password, "New_password"),
    };
}

export function parseVerifyLoginMfaDto(body: unknown): VerifyLoginMfaDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    }

    const data = body as Record<string, unknown>;

    if (
        typeof data.challenge_id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.challenge_id)
    ) {
        throw new AppError("Challenge_id must be a valid UUID", 400, "VALIDATION_ERROR");
    }

    if (typeof data.code !== "string" || !/^\d{6}$/.test(data.code)) {
        throw new AppError("Code must be a 6-digit OTP", 400, "VALIDATION_ERROR");
    }

    return {
        challenge_id: data.challenge_id,
        code: data.code,
    };
}
