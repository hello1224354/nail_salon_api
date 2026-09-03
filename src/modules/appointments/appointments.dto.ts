import { AppError } from "../../common/errors";
import { AppointmentStatus } from "./appointments.entity";

export interface CreateAppointmentDto {
    customer_id: string;
    staff_id?: string | null;
    service_ids: string[];
    start_time: Date;
}

export interface UpdateAppointmentDto {
    staff_id?: string | null;
    service_ids?: string[];
    start_time?: Date;
    status?: AppointmentStatus;
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function parseCreateAppointmentDto(body: unknown): CreateAppointmentDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (typeof data.customer_id !== "string" || !isUuid(data.customer_id)) throw new AppError("Customer_id must be a valid UUID", 400, "VALIDATION_ERROR");

    if (data.staff_id !== undefined && data.staff_id !== null && (typeof data.staff_id !== "string" || !isUuid(data.staff_id))) throw new AppError("Staff_id must be a valid UUID or null", 400, "VALIDATION_ERROR");

    if (!Array.isArray(data.service_ids)) throw new AppError("Service_ids must be an array", 400, "VALIDATION_ERROR");

    if (data.service_ids.length === 0) throw new AppError("At least one service must be provided", 400, "VALIDATION_ERROR");

    if (!data.service_ids.every((id) => typeof id === "string" && isUuid(id))) throw new AppError("Every service_id must be a valid UUID", 400, "VALIDATION_ERROR");

    if (new Set(data.service_ids).size !== data.service_ids.length) throw new AppError("Service_ids must not contain duplicates", 400, "VALIDATION_ERROR");

    if (typeof data.start_time !== "string" || data.start_time.trim().length === 0) throw new AppError("Start_time must be a non-empty string", 400, "VALIDATION_ERROR");

    const startTime = new Date(data.start_time);

    if (Number.isNaN(startTime.getTime())) throw new AppError("Start_time must be a valid date", 400, "VALIDATION_ERROR");

    return {
        customer_id: data.customer_id,
        staff_id: data.staff_id as string | null | undefined,
        service_ids: data.service_ids as string[],
        start_time: startTime,
    };
}

export function parseUpdateAppointmentDto(body: unknown): UpdateAppointmentDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (data.staff_id === undefined && data.service_ids === undefined && data.start_time === undefined && data.status === undefined) throw new AppError("At least one field must be provided", 400, "VALIDATION_ERROR");

    if (data.staff_id !== undefined && data.staff_id !== null && (typeof data.staff_id !== "string" || !isUuid(data.staff_id))) throw new AppError("Staff_id must be a valid UUID or null", 400, "VALIDATION_ERROR");

    if (data.service_ids !== undefined && !Array.isArray(data.service_ids)) throw new AppError("Service_ids must be an array", 400, "VALIDATION_ERROR");

    if (Array.isArray(data.service_ids) && data.service_ids.length === 0) throw new AppError("At least one service must be provided", 400, "VALIDATION_ERROR");

    if (Array.isArray(data.service_ids) && !data.service_ids.every((id) => typeof id === "string" && isUuid(id))) throw new AppError("Every service_id must be a valid UUID", 400, "VALIDATION_ERROR");

    if (Array.isArray(data.service_ids) && new Set(data.service_ids).size !== data.service_ids.length) throw new AppError("Service_ids must not contain duplicates", 400, "VALIDATION_ERROR");

    if (data.start_time !== undefined && (typeof data.start_time !== "string" || data.start_time.trim().length === 0)) throw new AppError("Start_time must be a non-empty string", 400, "VALIDATION_ERROR");

    const startTime = data.start_time !== undefined ? new Date(data.start_time as string) : undefined;

    if (startTime !== undefined && Number.isNaN(startTime.getTime())) throw new AppError("Start_time must be a valid date", 400, "VALIDATION_ERROR");

    if (data.status !== undefined && typeof data.status !== "string") throw new AppError("Status must be a string", 400, "VALIDATION_ERROR");

    const status = typeof data.status === "string" ? data.status.toUpperCase() : undefined;

    if (status !== undefined && !(status in AppointmentStatus)) throw new AppError("Status must be pending, confirmed, completed, or cancelled", 400, "VALIDATION_ERROR");

    return {
        staff_id: data.staff_id as string | null | undefined,
        service_ids: data.service_ids as string[] | undefined,
        start_time: startTime,
        status: status === undefined ? undefined : AppointmentStatus[status as keyof typeof AppointmentStatus],
    };
}