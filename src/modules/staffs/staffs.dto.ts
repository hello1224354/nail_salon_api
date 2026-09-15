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
