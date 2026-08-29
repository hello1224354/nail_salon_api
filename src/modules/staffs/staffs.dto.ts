import { AppError } from "../../common/errors";

export interface CreateStaffDto {
    name: string;
    phone?: string | null;
    branch_id: number;
    is_active?: boolean;
}

export interface UpdateStaffDto {
    name?: string;
    phone?: string | null;
    branch_id?: number;
    is_active?: boolean;
}

export function parseCreateStaffDto(body: unknown): CreateStaffDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (typeof data.name !== "string" || data.name.trim().length === 0) throw new AppError("Name must be a non-empty string", 400, "VALIDATION_ERROR");
    if (data.phone !== undefined && data.phone !== null && typeof data.phone !== "string") throw new AppError("Phone must be a string or null", 400, "VALIDATION_ERROR");
    if (!Number.isInteger(data.branch_id) || (data.branch_id as number) <= 0) throw new AppError("Branch_id must be a positive integer", 400, "VALIDATION_ERROR");
    if (data.is_active !== undefined && typeof data.is_active !== "boolean") throw new AppError("Is_active must be a boolean", 400, "VALIDATION_ERROR");

    return {
        name: data.name.trim(),
        phone: data.phone as string | null | undefined,
        branch_id: data.branch_id as number,
        is_active: data.is_active as boolean | undefined,
    };
}

export function parseUpdateStaffDto(body: unknown): UpdateStaffDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (data.name !== undefined && (typeof data.name !== "string" || data.name.trim().length === 0)) throw new AppError("Name must be a non-empty string", 400, "VALIDATION_ERROR");
    if (data.phone !== undefined && data.phone !== null && typeof data.phone !== "string") throw new AppError("Phone must be a string or null", 400, "VALIDATION_ERROR");
    if (data.branch_id !== undefined && (!Number.isInteger(data.branch_id) || (data.branch_id as number) <= 0)) throw new AppError("Branch_id must be a positive integer", 400, "VALIDATION_ERROR");
    if (data.is_active !== undefined && typeof data.is_active !== "boolean") throw new AppError("Is_active must be a boolean", 400, "VALIDATION_ERROR");

    const result: UpdateStaffDto = {};

    if (data.name !== undefined) result.name = (data.name as string).trim();
    if (data.phone !== undefined) result.phone = data.phone as string | null;
    if (data.branch_id !== undefined) result.branch_id = data.branch_id as number;
    if (data.is_active !== undefined) result.is_active = data.is_active as boolean;

    if (Object.keys(result).length === 0) throw new AppError("At least one field must be provided", 400, "VALIDATION_ERROR");

    return result;
}
