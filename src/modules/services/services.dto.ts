import { AppError } from "../../common/errors";

export interface CreateServiceDto {
    name: string;
    price: number;
    duration_minutes: number;
    is_active?: boolean;
}

export interface UpdateServiceDto {
    name?: string;
    price?: number;
    duration_minutes?: number;
    is_active?: boolean;
}

export function parseCreateServiceDto(body: unknown): CreateServiceDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (typeof data.name !== "string" || data.name.trim().length === 0) throw new AppError("Name must be a non-empty string", 400, "VALIDATION_ERROR");
    if (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price < 0) throw new AppError("Price must be a valid number", 400, "VALIDATION_ERROR");
    if (!Number.isInteger(data.duration_minutes) || (data.duration_minutes as number) <= 0) throw new AppError("Duration must be a valid number", 400, "VALIDATION_ERROR");
    if (data.is_active !== undefined && typeof data.is_active !== "boolean") throw new AppError("Is_active must be a boolean", 400, "VALIDATION_ERROR");

    return {
        name: data.name.trim(),
        price: data.price,
        duration_minutes: data.duration_minutes as number,
        is_active: data.is_active as boolean | undefined,
    };
}

export function parseUpdateServiceDto(body: unknown): UpdateServiceDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (data.name !== undefined && (typeof data.name !== "string" || data.name.trim().length === 0)) throw new AppError("Name must be a non-empty string", 400, "VALIDATION_ERROR");
    if (data.price !== undefined && (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price < 0)) throw new AppError("Price must be a valid number", 400, "VALIDATION_ERROR");
    if (data.duration_minutes !== undefined && (!Number.isInteger(data.duration_minutes) || (data.duration_minutes as number) <= 0)) throw new AppError("Duration must be a valid number", 400, "VALIDATION_ERROR");
    if (data.is_active !== undefined && typeof data.is_active !== "boolean") throw new AppError("Is_active must be a boolean", 400, "VALIDATION_ERROR");

    const result: UpdateServiceDto = {};

    if (data.name !== undefined) result.name = (data.name as string).trim();
    if (data.price !== undefined) result.price = data.price as number;
    if (data.duration_minutes !== undefined) result.duration_minutes = data.duration_minutes as number;
    if (data.is_active !== undefined) result.is_active = data.is_active as boolean;

    if (Object.keys(result).length === 0) throw new AppError("At least one field must be provided", 400, "VALIDATION_ERROR");

    return result;
}