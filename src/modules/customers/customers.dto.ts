import { AppError } from "../../common/errors";

export interface CreateCustomerDto {
    name: string;
    phone: string;
    email?: string | null;
}

export interface UpdateCustomerDto {
    name?: string;
    phone?: string;
    email?: string | null;
}

export function parseCreateCustomerDto(body: unknown): CreateCustomerDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (typeof data.name !== "string" || data.name.trim().length === 0) throw new AppError("Name must be a non-empty string", 400, "VALIDATION_ERROR");
    if (typeof data.phone !== "string" || data.phone.trim().length === 0) throw new AppError("Phone must be a non-empty string", 400, "VALIDATION_ERROR");
    if (data.email !== undefined && data.email !== null && (typeof data.email !== "string" || data.email.trim().length === 0)) throw new AppError("Email must be a non-empty string or null", 400, "VALIDATION_ERROR");

    return {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email === null ? null : typeof data.email === "string" ? data.email.trim() : undefined,
    };
}

export function parseUpdateCustomerDto(body: unknown): UpdateCustomerDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (data.name !== undefined && (typeof data.name !== "string" || data.name.trim().length === 0)) throw new AppError("Name must be a non-empty string", 400, "VALIDATION_ERROR");
    if (data.phone !== undefined && (typeof data.phone !== "string" || data.phone.trim().length === 0)) throw new AppError("Phone must be a non-empty string", 400, "VALIDATION_ERROR");
    if (data.email !== undefined && data.email !== null && (typeof data.email !== "string" || data.email.trim().length === 0)) throw new AppError("Email must be a non-empty string or null", 400, "VALIDATION_ERROR");

    const result: UpdateCustomerDto = {};

    if (data.name !== undefined) result.name = (data.name as string).trim();
    if (data.phone !== undefined) result.phone = (data.phone as string).trim();
    if (data.email !== undefined) result.email = data.email === null ? null : (data.email as string).trim();

    if (Object.keys(result).length === 0) throw new AppError("At least one field must be provided", 400, "VALIDATION_ERROR");

    return result;
}