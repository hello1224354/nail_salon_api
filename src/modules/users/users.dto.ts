import { AppError } from "../../common/errors";

export interface RegisterUserDto {
    full_name: string;
    email: string;
    password: string;
}

export interface LoginUserDto {
    email: string;
    password: string;
    remember_me: boolean;
}

export interface ChangePasswordDto {
    current_password: string;
    new_password: string;
    code: string;
}

export interface RegistrationVerificationRequestDto {
    email: string;
}

export interface DeleteMeDto {
    current_password: string;
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

export function parseVietnamesePhone(value: unknown, fieldName = "Phone"): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new AppError(`${fieldName} must be a non-empty string`, 400, "VALIDATION_ERROR");
    }

    const compact = value.replace(/[\s.-]/g, "");
    const phone = compact.startsWith("+84")
        ? compact
        : compact.startsWith("84")
          ? `+${compact}`
          : compact.startsWith("0")
            ? `+84${compact.slice(1)}`
            : compact;

    if (!/^\+84\d{9}$/.test(phone)) {
        throw new AppError(`${fieldName} must be a valid Vietnamese phone number`, 400, "VALIDATION_ERROR");
    }

    return phone;
}

export function parseEmail(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > 255) {
        throw new AppError("Email must be between 1 and 255 characters", 400, "VALIDATION_ERROR");
    }

    const email = value.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError("Email must be valid", 400, "VALIDATION_ERROR");
    }

    return email;
}

function parseOtpCode(value: unknown, fieldName = "Code") {
    if (typeof value !== "string" || !/^\d{6}$/.test(value)) {
        throw new AppError(`${fieldName} must be a 6-digit OTP`, 400, "VALIDATION_ERROR");
    }

    return value;
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

export function parseRegistrationVerificationRequestDto(body: unknown): RegistrationVerificationRequestDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    }

    const data = body as Record<string, unknown>;

    return {
        email: parseEmail(data.email),
    };
}

export function parseRegistrationVerificationCode(body: unknown) {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    }

    return parseOtpCode((body as Record<string, unknown>).code);
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

    return {
        full_name: data.full_name.trim(),
        email: parseEmail(data.email),
        password: parsePassword(data.password, "Password"),
    };
}

export function parseLoginUserDto(body: unknown): LoginUserDto {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    }

    const data = body as Record<string, unknown>;

    if (typeof data.password !== "string" || data.password.length === 0) {
        throw new AppError("Password must be a non-empty string", 400, "VALIDATION_ERROR");
    }

    if (Buffer.byteLength(data.password, "utf8") > 72) {
        throw new AppError("Password is too long", 400, "VALIDATION_ERROR");
    }

    if (data.remember_me !== undefined && typeof data.remember_me !== "boolean") {
        throw new AppError("Remember_me must be a boolean", 400, "VALIDATION_ERROR");
    }

    return {
        email: parseEmail(data.email),
        password: data.password,
        remember_me: data.remember_me ?? true,
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
        code: parseOtpCode(data.code),
    };
}

export function parseDeleteMeDto(body: unknown): DeleteMeDto {
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

    return {
        current_password: data.current_password,
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

    return {
        email: parseEmail(data.email),
        code: parseOtpCode(data.code),
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

    return {
        challenge_id: data.challenge_id,
        code: parseOtpCode(data.code),
    };
}
