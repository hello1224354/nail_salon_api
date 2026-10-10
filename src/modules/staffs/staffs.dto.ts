import { AppError } from "../../common/errors";
import { parseEmail, parseRegisterUserDto, parseVietnamesePhone } from "../users/users.dto";
import { assertValidWorkingHours, DEFAULT_WORK_START, DEFAULT_WORK_END } from "./staff-working-hours";

export interface CreateStaffDto {
    full_name: string;
    phone: string;
    email: string;
    password: string;
    branch_id: number;
    work_start_time: string;
    work_end_time: string;
}

export interface UpdateStaffDto {
    branch_id?: number;
    full_name?: string;
    phone?: string;
    email?: string;
    password?: string;
    work_start_time?: string;
    work_end_time?: string;
}

export interface GetStaffsQueryDto {
    branch_id?: number;
}

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
    const branchId = data.branch_id === undefined ? undefined : parsePositiveIntegerQuery(data.branch_id, "Branch_id", 1);

    return {
        branch_id: branchId,
    };
}

export function parseCreateStaffDto(body: unknown): CreateStaffDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    const userData = parseRegisterUserDto({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
    });
    const phone = parseVietnamesePhone(data.phone);

    if (!Number.isInteger(data.branch_id) || (data.branch_id as number) <= 0 || (data.branch_id as number) > 2_147_483_647) throw new AppError("Branch_id must be an integer between 1 and 2147483647", 400, "VALIDATION_ERROR");

    const workStart = data.work_start_time === undefined ? DEFAULT_WORK_START : data.work_start_time;
    const workEnd = data.work_end_time === undefined ? DEFAULT_WORK_END : data.work_end_time;
    if (typeof workStart !== "string" || typeof workEnd !== "string") throw new AppError("Working hours must be strings", 400, "INVALID_STAFF_WORK_HOURS");
    assertValidWorkingHours(workStart, workEnd);

    return {
        work_start_time: workStart,
        work_end_time: workEnd,
        full_name: userData.full_name,
        phone,
        email: userData.email,
        password: userData.password,
        branch_id: data.branch_id as number,
    };
}

export function parseUpdateStaffDto(body: unknown): UpdateStaffDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (data.branch_id !== undefined && (!Number.isInteger(data.branch_id) || (data.branch_id as number) <= 0 || (data.branch_id as number) > 2_147_483_647)) throw new AppError("Branch_id must be an integer between 1 and 2147483647", 400, "VALIDATION_ERROR");

    const result: UpdateStaffDto = {};

    if (data.branch_id !== undefined) result.branch_id = data.branch_id as number;
    if (data.work_start_time !== undefined) {
        if (typeof data.work_start_time !== "string") throw new AppError("Invalid work start time", 400, "INVALID_STAFF_WORK_HOURS");
        result.work_start_time = data.work_start_time;
    }
    if (data.work_end_time !== undefined) {
        if (typeof data.work_end_time !== "string") throw new AppError("Invalid work end time", 400, "INVALID_STAFF_WORK_HOURS");
        result.work_end_time = data.work_end_time;
    }
    if (result.work_start_time !== undefined && result.work_end_time !== undefined) {
        assertValidWorkingHours(result.work_start_time, result.work_end_time);
    }
    if (data.full_name !== undefined) {
        if (typeof data.full_name !== "string" || !data.full_name.trim() || data.full_name.trim().length > 255) {
            throw new AppError("Full_name must be between 1 and 255 characters", 400, "VALIDATION_ERROR");
        }
        result.full_name = data.full_name.trim();
    }
    if (data.phone !== undefined) result.phone = parseVietnamesePhone(data.phone);
    if (data.email !== undefined) result.email = parseEmail(data.email);
    if (data.password !== undefined) {
        if (typeof data.password !== "string" || data.password.length < 8 || Buffer.byteLength(data.password, "utf8") > 72) {
            throw new AppError("Password must be 8 to 72 bytes", 400, "VALIDATION_ERROR");
        }
        result.password = data.password;
    }

    if (Object.keys(result).length === 0) throw new AppError("At least one field must be provided", 400, "VALIDATION_ERROR");

    return result;
}
