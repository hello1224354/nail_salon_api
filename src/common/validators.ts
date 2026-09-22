import { AppError } from "./errors";

export function parseUuidParam(value: unknown, fieldName: string): string {
    if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        throw new AppError(`${fieldName} must be a valid UUID`, 400, "VALIDATION_ERROR");
    }

    return value;
}

export function parsePositiveIntParam(value: unknown, fieldName: string): number {
    if (typeof value !== "string" || !/^\d+$/.test(value)) throw new AppError(`${fieldName} must be a positive integer`, 400, "VALIDATION_ERROR");

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 2_147_483_647) throw new AppError(`${fieldName} must be an integer between 1 and 2147483647`, 400, "VALIDATION_ERROR");

    return parsed;
}