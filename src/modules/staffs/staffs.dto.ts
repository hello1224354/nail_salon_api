import { AppError } from "../../common/errors";
import { parseRegisterUserDto } from "../users/users.dto";

export interface CreateStaffDto {
    full_name: string;
    phone: string;
    email: string | null;
    password: string;
    branch_id: number;
}

export interface UpdateStaffDto {
    branch_id?: number;
}

export interface GetStaffsQueryDto {
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

export function parseGetStaffsQuery(query: unknown): GetStaffsQueryDto {
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

export function parseCreateStaffDto(body: unknown): CreateStaffDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    const userData = parseRegisterUserDto({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        password: data.password,
    });

    if (!Number.isInteger(data.branch_id) || (data.branch_id as number) <= 0) throw new AppError("Branch_id must be a positive integer", 400, "VALIDATION_ERROR");

    return {
        full_name: userData.full_name,
        phone: userData.phone,
        email: userData.email,
        password: userData.password,
        branch_id: data.branch_id as number,
    };
}

export function parseUpdateStaffDto(body: unknown): UpdateStaffDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (data.branch_id !== undefined && (!Number.isInteger(data.branch_id) || (data.branch_id as number) <= 0)) throw new AppError("Branch_id must be a positive integer", 400, "VALIDATION_ERROR");

    const result: UpdateStaffDto = {};

    if (data.branch_id !== undefined) result.branch_id = data.branch_id as number;

    if (Object.keys(result).length === 0) throw new AppError("At least one field must be provided", 400, "VALIDATION_ERROR");

    return result;
}
