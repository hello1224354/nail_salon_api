import { AppError } from "../../common/errors";

export interface CreateBranchDto {
    name: string;
    address: string;
}

export interface UpdateBranchDto {
    name?: string;
    address?: string;
}

export interface GetBranchesQueryDto {
    page: number;
    limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 100;
const MAX_PAGE = 1000;

function parsePositiveIntegerQuery(value: unknown, fieldName: string, defaultValue: number): number {
    if (value === undefined) return defaultValue;

    if (typeof value !== "string" || !/^\d+$/.test(value)) throw new AppError(`${fieldName} must be a positive integer`, 400, "VALIDATION_ERROR");

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed < 1) throw new AppError(`${fieldName} must be a positive safe integer`, 400, "VALIDATION_ERROR");

    return parsed;
}

export function parseGetBranchesQuery(query: unknown): GetBranchesQueryDto {
    if (query === null || typeof query !== "object" || Array.isArray(query)) throw new AppError("Query must be an object", 400, "VALIDATION_ERROR");

    const data = query as Record<string, unknown>;

    const page = parsePositiveIntegerQuery(data.page, "Page", DEFAULT_PAGE);
    const limit = parsePositiveIntegerQuery(data.limit, "Limit", DEFAULT_LIMIT);

    if (limit > MAX_LIMIT) throw new AppError(`Limit must not exceed ${MAX_LIMIT}`, 400, "VALIDATION_ERROR");
    if (page > MAX_PAGE) throw new AppError(`Page must not exceed ${MAX_PAGE}`, 400, "VALIDATION_ERROR");

    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) throw new AppError("Pagination offset is too large", 400, "VALIDATION_ERROR");

    return {
        page,
        limit,
    };
}

export function parseCreateBranchDto(body: unknown): CreateBranchDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (typeof data.name !== "string" || data.name.trim().length === 0 || data.name.trim().length > 255) throw new AppError("Name must be between 1 and 255 characters", 400, "VALIDATION_ERROR");

    if (typeof data.address !== "string" || data.address.trim().length === 0 || data.address.trim().length > 255) throw new AppError("Address must be between 1 and 255 characters", 400, "VALIDATION_ERROR");

    return {
        name: data.name.trim(),
        address: data.address.trim(),
    };
}

export function parseUpdateBranchDto(body: unknown): UpdateBranchDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (data.name !== undefined && (typeof data.name !== "string" || data.name.trim().length === 0 || data.name.trim().length > 255)) throw new AppError("Name must be between 1 and 255 characters", 400, "VALIDATION_ERROR");

    if (data.address !== undefined && (typeof data.address !== "string" || data.address.trim().length === 0 || data.address.trim().length > 255)) throw new AppError("Address must be between 1 and 255 characters", 400, "VALIDATION_ERROR");

    const result: UpdateBranchDto = {};

    if (data.name !== undefined) result.name = (data.name as string).trim();
    if (data.address !== undefined) result.address = (data.address as string).trim();

    if (Object.keys(result).length === 0) throw new AppError("At least one field must be provided", 400, "VALIDATION_ERROR");

    return result;
}
