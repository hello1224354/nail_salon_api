import { AppError } from "../../common/errors";

export interface RegisterUserDto {
    email: string;
    password: string;
}

export interface LoginUserDto {
    email: string;
    password: string;
}

export function parseRegisterUserDto(body: unknown): RegisterUserDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (data.email === undefined || typeof data.email !== "string" || data.email.trim().length === 0) throw new AppError("Email must be a non-empty string", 400, "VALIDATION_ERROR");

    const email = data.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("Email must be valid", 400, "VALIDATION_ERROR");

    if (typeof data.password !== "string") throw new AppError("Password must be a string", 400, "VALIDATION_ERROR");

    if (data.password.length < 8) throw new AppError("Password must be at least 8 characters", 400, "VALIDATION_ERROR");

    return {
        email,
        password: data.password,
    };
}

export function parseLoginUserDto(body: unknown): LoginUserDto {
    if (typeof body !== "object" || body === null || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (typeof data.email !== "string" || data.email.trim().length === 0) throw new AppError("Email must be a non-empty string", 400, "VALIDATION_ERROR");

    const email = data.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new AppError("Email must be valid", 400, "VALIDATION_ERROR");

    if (typeof data.password !== "string" || data.password.length === 0) throw new AppError("Password must be a non-empty string", 400, "VALIDATION_ERROR");

    return {
        email,
        password: data.password,
    };
}