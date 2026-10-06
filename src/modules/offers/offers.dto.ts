import { AppError } from "../../common/errors";

export interface CreateOfferDto {
    name: string;
    details: string;
    start_date: string;
    end_date: string;
    image: string;
    sort_order?: number;
}

export interface UpdateOfferDto {
    name?: string;
    details?: string;
    start_date?: string;
    end_date?: string;
    image?: string;
    sort_order?: number;
}

export interface GetOffersQueryDto {
    page: number;
    limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_INT = 2_147_483_647;

function parsePositiveIntegerQuery(value: unknown, fieldName: string, defaultValue: number): number {
    if (value === undefined) return defaultValue;

    if (typeof value !== "string" || !/^\d+$/.test(value)) {
        throw new AppError(`${fieldName} must be a positive integer`, 400, "VALIDATION_ERROR");
    }

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed < 1) {
        throw new AppError(`${fieldName} must be a positive safe integer`, 400, "VALIDATION_ERROR");
    }

    return parsed;
}

function parseRequiredString(value: unknown, fieldName: string, maxLength: number, allowMultiline = false) {
    if (typeof value !== "string") {
        throw new AppError(`${fieldName} must be a string`, 400, "VALIDATION_ERROR");
    }

    const trimmed = value.trim();

    if (trimmed.length === 0 || trimmed.length > maxLength) {
        throw new AppError(
            `${fieldName} must be between 1 and ${maxLength} characters`,
            400,
            "VALIDATION_ERROR"
        );
    }

    if (!allowMultiline && /[\r\n]/.test(trimmed)) {
        throw new AppError(`${fieldName} must be a single line`, 400, "VALIDATION_ERROR");
    }

    return trimmed;
}

function parseDate(value: unknown, fieldName: string): string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new AppError(`${fieldName} must use YYYY-MM-DD format`, 400, "VALIDATION_ERROR");
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        throw new AppError(`${fieldName} must be a valid calendar date`, 400, "VALIDATION_ERROR");
    }

    return value;
}

function parseSortOrder(value: unknown): number {
    if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > MAX_INT) {
        throw new AppError(
            `Sort_order must be an integer between 0 and ${MAX_INT}`,
            400,
            "VALIDATION_ERROR"
        );
    }

    return value as number;
}

export function parseGetOffersQuery(query: unknown): GetOffersQueryDto {
    if (query === null || typeof query !== "object" || Array.isArray(query)) {
        throw new AppError("Query must be an object", 400, "VALIDATION_ERROR");
    }

    const data = query as Record<string, unknown>;
    const page = parsePositiveIntegerQuery(data.page, "Page", DEFAULT_PAGE);
    const limit = parsePositiveIntegerQuery(data.limit, "Limit", DEFAULT_LIMIT);

    if (limit > MAX_LIMIT) {
        throw new AppError(`Limit must not exceed ${MAX_LIMIT}`, 400, "VALIDATION_ERROR");
    }

    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) {
        throw new AppError("Pagination offset is too large", 400, "VALIDATION_ERROR");
    }

    return { page, limit };
}

export function parseCreateOfferDto(body: unknown): CreateOfferDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    }

    const data = body as Record<string, unknown>;
    const startDate = parseDate(data.start_date, "Start_date");
    const endDate = parseDate(data.end_date, "End_date");

    if (endDate < startDate) {
        throw new AppError("End_date must be on or after start_date", 400, "VALIDATION_ERROR");
    }

    return {
        name: parseRequiredString(data.name, "Name", 255),
        details: parseRequiredString(data.details, "Details", 2000, true),
        start_date: startDate,
        end_date: endDate,
        image: parseRequiredString(data.image, "Image", 500),
        sort_order: data.sort_order === undefined ? 0 : parseSortOrder(data.sort_order),
    };
}

export function parseUpdateOfferDto(body: unknown): UpdateOfferDto {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Request body must be an object", 400, "VALIDATION_ERROR");
    }

    const data = body as Record<string, unknown>;
    const result: UpdateOfferDto = {};

    if (data.name !== undefined) result.name = parseRequiredString(data.name, "Name", 255);
    if (data.details !== undefined) result.details = parseRequiredString(data.details, "Details", 2000, true);
    if (data.start_date !== undefined) result.start_date = parseDate(data.start_date, "Start_date");
    if (data.end_date !== undefined) result.end_date = parseDate(data.end_date, "End_date");
    if (data.image !== undefined) result.image = parseRequiredString(data.image, "Image", 500);
    if (data.sort_order !== undefined) result.sort_order = parseSortOrder(data.sort_order);

    if (
        result.start_date !== undefined &&
        result.end_date !== undefined &&
        result.end_date < result.start_date
    ) {
        throw new AppError("End_date must be on or after start_date", 400, "VALIDATION_ERROR");
    }

    if (Object.keys(result).length === 0) {
        throw new AppError("At least one field must be provided", 400, "VALIDATION_ERROR");
    }

    return result;
}
