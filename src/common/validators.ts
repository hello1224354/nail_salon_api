import { AppError } from "./errors";

export function parseUuidParam(value: unknown, fieldName: string): string {
    if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        throw new AppError(`${fieldName} must be a valid UUID`, 400, "VALIDATION_ERROR");
    }

    return value;
}