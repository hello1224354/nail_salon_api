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

function normalizePhone(value: string): string {
    const phone = value.replace(/[\s.-]/g, "");

    if (phone.startsWith("+84")) return phone;

    if (phone.startsWith("84")) return `+${phone}`;

    if (phone.startsWith("0")) return `+84${phone.slice(1)}`;

    return phone;
}

export function parseRegisterUserDto(body: unknown): RegisterUserDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (typeof data.full_name !== "string" || data.full_name.trim().length === 0 || data.full_name.trim().length > 255) throw new AppError("Full_name must be between 1 and 255 characters", 400, "VALIDATION_ERROR");

    if (typeof data.phone !== "string" || data.phone.trim().length === 0) throw new AppError("Phone must be a non-empty string", 400, "VALIDATION_ERROR");

    const fullName = data.full_name.trim();

    const phone = normalizePhone(data.phone);

    if (!/^\+84\d{9}$/.test(phone)) throw new AppError("Phone must be a valid Vietnamese phone number", 400, "VALIDATION_ERROR");

    let email: string | null = null;

    if (data.email !== undefined && data.email !== null) {
        if (typeof data.email !== "string" || data.email.trim().length === 0 || data.email.trim().length > 255) throw new AppError("Email must be between 1 and 255 characters", 400, "VALIDATION_ERROR");

        email = data.email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("Email must be valid", 400, "VALIDATION_ERROR");
    }

    if (typeof data.password !== "string") throw new AppError("Password must be a string", 400, "VALIDATION_ERROR");

    if (data.password.length < 8) throw new AppError("Password must be at least 8 characters", 400, "VALIDATION_ERROR");

    return {
        full_name: fullName,
        phone,
        email,
        password: data.password,
    };
}

export function parseLoginUserDto(body: unknown): LoginUserDto {
    if (typeof body !== "object" || body === null || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (typeof data.phone !== "string" || data.phone.trim().length === 0) throw new AppError("Phone must be a non-empty string", 400, "VALIDATION_ERROR");

    const phone = normalizePhone(data.phone);

    if (!/^\+84\d{9}$/.test(phone)) throw new AppError("Phone must be a valid Vietnamese phone number", 400, "VALIDATION_ERROR");

    if (typeof data.password !== "string" || data.password.length === 0) throw new AppError("Password must be a non-empty string", 400, "VALIDATION_ERROR");

    return {
        phone,
        password: data.password,
    };
}