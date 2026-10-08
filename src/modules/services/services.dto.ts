import { AppError } from "../../common/errors";

export interface CreateServiceDto {
    branch_id: number;
    name: string;
    price: number;
    duration_minutes: number | null;
    booking_enabled: boolean;
    category: string | null;
    subcategory: string | null;
    description: string | null;
}

export interface UpdateServiceDto {
    name?: string;
    price?: number;
    duration_minutes?: number | null;
    booking_enabled?: boolean;
    category?: string | null;
    subcategory?: string | null;
    description?: string | null;
}

export interface GetServicesQueryDto {
    branch_id?: number;
    page: number;
    limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 100;
const MAX_PAGE = 1000;
const MAX_INT = 2_147_483_647;

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
    const branchId = data.branch_id === undefined ? undefined : parsePositiveIntegerQuery(data.branch_id, "Branch_id", 1);

    const page = parsePositiveIntegerQuery(data.page, "Page", DEFAULT_PAGE);
    const limit = parsePositiveIntegerQuery(data.limit, "Limit", DEFAULT_LIMIT);

    if (limit > MAX_LIMIT) throw new AppError(`Limit must not exceed ${MAX_LIMIT}`, 400, "VALIDATION_ERROR");
    if (page > MAX_PAGE) throw new AppError(`Page must not exceed ${MAX_PAGE}`, 400, "VALIDATION_ERROR");

    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) throw new AppError("Pagination offset is too large", 400, "VALIDATION_ERROR");

    return {
        branch_id: branchId,
        page,
        limit,
    };
}

function optionalText(value: unknown, key: string, max = 255): string | null {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string" || value.trim().length > max) {
        throw new AppError(`${key} must be a string with at most ${max} characters`, 400, "VALIDATION_ERROR");
    }
    return value.trim() || null;
}

function durationValue(value: unknown): number | null {
    if (value === null || value === "") return null;
    if (!Number.isInteger(value) || (value as number) <= 0 || (value as number) > MAX_INT) {
        throw new AppError("Duration_minutes must be a positive integer or null", 400, "VALIDATION_ERROR");
    }
    return value as number;
}

export function parseCreateServiceDto(body: unknown): CreateServiceDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    const data = body as Record<string, unknown>;

    if (!Number.isInteger(data.branch_id) || (data.branch_id as number) <= 0 || (data.branch_id as number) > MAX_INT) throw new AppError("Invalid branch_id", 400, "VALIDATION_ERROR");
    if (typeof data.name !== "string" || !data.name.trim() || data.name.trim().length > 255) throw new AppError("Name must be between 1 and 255 characters", 400, "VALIDATION_ERROR");
    if (!Number.isInteger(data.price) || (data.price as number) < 0 || (data.price as number) > MAX_INT) throw new AppError("Invalid price", 400, "VALIDATION_ERROR");
    const duration = data.duration_minutes === undefined ? null : durationValue(data.duration_minutes);
    if (data.booking_enabled !== undefined && typeof data.booking_enabled !== "boolean") throw new AppError("Booking_enabled must be boolean", 400, "VALIDATION_ERROR");
    const enabled = data.booking_enabled === undefined ? duration !== null : data.booking_enabled;
    if (enabled && duration === null) throw new AppError("Bookable service requires duration", 400, "VALIDATION_ERROR");

    return {
        branch_id: data.branch_id as number,
        name: data.name.trim(),
        price: data.price as number,
        duration_minutes: duration,
        booking_enabled: enabled,
        category: optionalText(data.category, "Category"),
        subcategory: optionalText(data.subcategory, "Subcategory"),
        description: optionalText(data.description, "Description", 2000),
    };
}

export function parseUpdateServiceDto(body: unknown): UpdateServiceDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    const data = body as Record<string, unknown>;
    const result: UpdateServiceDto = {};
    if (data.name !== undefined) {
        if (typeof data.name !== "string" || !data.name.trim() || data.name.trim().length > 255) throw new AppError("Invalid name", 400, "VALIDATION_ERROR");
        result.name = data.name.trim();
    }
    if (data.price !== undefined) {
        if (!Number.isInteger(data.price) || (data.price as number) < 0 || (data.price as number) > MAX_INT) throw new AppError("Invalid price", 400, "VALIDATION_ERROR");
        result.price = data.price as number;
    }
    if (data.duration_minutes !== undefined) result.duration_minutes = durationValue(data.duration_minutes);
    if (data.booking_enabled !== undefined) {
        if (typeof data.booking_enabled !== "boolean") throw new AppError("Booking_enabled must be boolean", 400, "VALIDATION_ERROR");
        result.booking_enabled = data.booking_enabled;
    }
    if (data.category !== undefined) result.category = optionalText(data.category, "Category");
    if (data.subcategory !== undefined) result.subcategory = optionalText(data.subcategory, "Subcategory");
    if (data.description !== undefined) result.description = optionalText(data.description, "Description", 2000);
    if (!Object.keys(result).length) throw new AppError("At least one field must be provided", 400, "VALIDATION_ERROR");
    return result;
}
