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

export interface GetServicesQueryDto {
    page: number;
    limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 100;

function parsePositiveIntegerQuery(value: unknown, fieldName: string, defaultValue: number): number {
    if (value === undefined) return defaultValue;

    if (typeof value !== "string" || !/^\d+$/.test(value)) throw new AppError(`${fieldName} must be a positive integer`, 400, "VALIDATION_ERROR");

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed < 1) throw new AppError(`${fieldName} must be a positive safe integer`, 400, "VALIDATION_ERROR");

    return parsed;
}

export function parseGetServicesQuery(query: unknown): GetServicesQueryDto {
    if (query === null || typeof query !== "object" || Array.isArray(query)) throw new AppError("Query must be an object", 400, "VALIDATION_ERROR");

    const data = query as Record<string, unknown>;

    const page = parsePositiveIntegerQuery(data.page, "Page", DEFAULT_PAGE);
    const limit = parsePositiveIntegerQuery(data.limit, "Limit", DEFAULT_LIMIT);

    if (limit > MAX_LIMIT) throw new AppError(`Limit must not exceed ${MAX_LIMIT}`, 400, "VALIDATION_ERROR");

    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) throw new AppError("Pagination offset is too large", 400, "VALIDATION_ERROR");

    return {
        page,
        limit,
    };
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