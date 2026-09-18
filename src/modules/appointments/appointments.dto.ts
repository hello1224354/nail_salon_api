import { AppError } from "../../common/errors";
import { AppointmentStatus } from "./appointments.entity";

export interface CreateAppointmentDto {
    user_id?: string;
    staff_id: string;
    service_ids: string[];
    start_time: Date;
}

export interface UpdateAppointmentDto {
    staff_id?: string;
    service_ids?: string[];
    start_time?: Date;
    status?: AppointmentStatus;
}

export interface GetAppointmentsQueryDto {
    staff_id?: string;
    status?: AppointmentStatus;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 100;

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function hasTimezone(value: string): boolean {
    return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value.trim());
}

function isValidIsoDateTime(value: string): boolean {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-](\d{2}):(\d{2}))$/i);

    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = match[6] === undefined ? 0 : Number(match[6]);
    const timezone = match[8];
    const offsetHour = match[9] === undefined ? 0 : Number(match[9]);
    const offsetMinute = match[10] === undefined ? 0 : Number(match[10]);

    if (month < 1 || month > 12) return false;
    if (hour < 0 || hour > 23) return false;
    if (minute < 0 || minute > 59) return false;
    if (second < 0 || second > 59) return false;

    const isLeapYear = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);

    const daysInMonth = [
        31,
        isLeapYear ? 29 : 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];

    if (day < 1 || day > daysInMonth[month - 1]) return false;

    if (timezone.toUpperCase() !== "Z") {
        if (offsetHour > 14) return false;
        if (offsetMinute > 59) return false;
        if (offsetHour === 14 && offsetMinute !== 0) return false;
    }

    return !Number.isNaN(new Date(value.trim()).getTime());
}

function parseDateTime(value: unknown, fieldName: string): Date {
    if (typeof value !== "string" || value.trim().length === 0) throw new AppError(`${fieldName} must be a non-empty string`, 400, "VALIDATION_ERROR");

    if (!hasTimezone(value)) throw new AppError(`${fieldName} must include a timezone`, 400, "VALIDATION_ERROR");

    if (!isValidIsoDateTime(value)) throw new AppError(`${fieldName} must be a valid ISO datetime`, 400, "VALIDATION_ERROR");

    return new Date(value.trim());
}

function parsePositiveIntegerQuery(value: unknown, fieldName: string, defaultValue: number): number {
    if (value === undefined) return defaultValue;

    if (typeof value !== "string" || !/^\d+$/.test(value)) throw new AppError(`${fieldName} must be a positive integer`, 400, "VALIDATION_ERROR");

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed < 1) throw new AppError(`${fieldName} must be a positive safe integer`, 400, "VALIDATION_ERROR");

    return parsed;
}

export function parseGetAppointmentsQuery(query: unknown): GetAppointmentsQueryDto {
    if (query === null || typeof query !== "object" || Array.isArray(query)) throw new AppError("Query must be an object", 400, "VALIDATION_ERROR");

    const data = query as Record<string, unknown>;

    if (data.staff_id !== undefined && (typeof data.staff_id !== "string" || !isUuid(data.staff_id))) throw new AppError("Staff_id must be a valid UUID", 400, "VALIDATION_ERROR");

    if (data.status !== undefined && typeof data.status !== "string") throw new AppError("Status must be a string", 400, "VALIDATION_ERROR");

    const status = typeof data.status === "string" ? data.status.toUpperCase() : undefined;

    if (status !== undefined && !(status in AppointmentStatus)) throw new AppError("Status must be pending, confirmed, in_progress, completed, or cancelled", 400, "VALIDATION_ERROR");

    const from = data.from === undefined ? undefined : parseDateTime(data.from, "From");
    const to = data.to === undefined ? undefined : parseDateTime(data.to, "To");

    if (from !== undefined && to !== undefined && from.getTime() >= to.getTime()) throw new AppError("From must be earlier than to", 400, "VALIDATION_ERROR");

    const page = parsePositiveIntegerQuery(data.page, "Page", DEFAULT_PAGE);
    const limit = parsePositiveIntegerQuery(data.limit, "Limit", DEFAULT_LIMIT);

    if (limit > MAX_LIMIT) throw new AppError(`Limit must not exceed ${MAX_LIMIT}`, 400, "VALIDATION_ERROR");

    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) throw new AppError("Pagination offset is too large", 400, "VALIDATION_ERROR");

    return {
        staff_id: data.staff_id as string | undefined,
        status: status === undefined ? undefined : AppointmentStatus[status as keyof typeof AppointmentStatus],
        from,
        to,
        page,
        limit,
    };
}

export function parseCreateAppointmentDto(body: unknown): CreateAppointmentDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    if (data.user_id !== undefined && (typeof data.user_id !== "string" || !isUuid(data.user_id))) throw new AppError("User_id must be a valid UUID", 400, "VALIDATION_ERROR");

    if (typeof data.staff_id !== "string" || !isUuid(data.staff_id)) throw new AppError("Staff_id must be a valid UUID", 400, "VALIDATION_ERROR");

    if (!Array.isArray(data.service_ids)) throw new AppError("Service_ids must be an array", 400, "VALIDATION_ERROR");

    if (data.service_ids.length === 0) throw new AppError("At least one service must be provided", 400, "VALIDATION_ERROR");

    if (!data.service_ids.every((id) => typeof id === "string" && isUuid(id))) throw new AppError("Every service_id must be a valid UUID", 400, "VALIDATION_ERROR");

    if (new Set(data.service_ids).size !== data.service_ids.length) throw new AppError("Service_ids must not contain duplicates", 400, "VALIDATION_ERROR");

    const startTime = parseDateTime(data.start_time, "Start_time");

    if (startTime.getTime() <= Date.now()) throw new AppError("Start_time must be in the future", 400, "VALIDATION_ERROR");

    return {
        user_id: data.user_id as string | undefined,
        staff_id: data.staff_id,
        service_ids: data.service_ids as string[],
        start_time: startTime,
    };
}

export function parseUpdateAppointmentDto(body: unknown): UpdateAppointmentDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");

    const data = body as Record<string, unknown>;

    const hasScheduleChanges = data.staff_id !== undefined || data.service_ids !== undefined || data.start_time !== undefined;

    if (data.status !== undefined && hasScheduleChanges) throw new AppError("Status cannot be updated together with appointment details", 400, "VALIDATION_ERROR");

    if (data.staff_id === undefined && data.service_ids === undefined && data.start_time === undefined && data.status === undefined) throw new AppError("At least one field must be provided", 400, "VALIDATION_ERROR");

    if (data.staff_id !== undefined && (typeof data.staff_id !== "string" || !isUuid(data.staff_id))) throw new AppError("Staff_id must be a valid UUID", 400, "VALIDATION_ERROR");

    if (data.service_ids !== undefined && !Array.isArray(data.service_ids)) throw new AppError("Service_ids must be an array", 400, "VALIDATION_ERROR");

    if (Array.isArray(data.service_ids) && data.service_ids.length === 0) throw new AppError("At least one service must be provided", 400, "VALIDATION_ERROR");

    if (Array.isArray(data.service_ids) && !data.service_ids.every((id) => typeof id === "string" && isUuid(id))) throw new AppError("Every service_id must be a valid UUID", 400, "VALIDATION_ERROR");

    if (Array.isArray(data.service_ids) && new Set(data.service_ids).size !== data.service_ids.length) throw new AppError("Service_ids must not contain duplicates", 400, "VALIDATION_ERROR");

    const startTime = data.start_time === undefined ? undefined : parseDateTime(data.start_time, "Start_time");

    if (startTime !== undefined && startTime.getTime() <= Date.now()) throw new AppError("Start_time must be in the future", 400, "VALIDATION_ERROR");

    if (data.status !== undefined && typeof data.status !== "string") throw new AppError("Status must be a string", 400, "VALIDATION_ERROR");

    const status = typeof data.status === "string" ? data.status.toUpperCase() : undefined;

    if (status !== undefined && !(status in AppointmentStatus)) throw new AppError("Status must be pending, confirmed, in_progress, completed, or cancelled", 400, "VALIDATION_ERROR");

    return {
        staff_id: data.staff_id as string | undefined,
        service_ids: data.service_ids as string[] | undefined,
        start_time: startTime,
        status: status === undefined ? undefined : AppointmentStatus[status as keyof typeof AppointmentStatus],
    };
}
