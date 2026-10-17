import { AppError } from "../../common/errors";

/** Group labels are managed in the database, not hard-coded in the API. */
export type ServiceCategory = string;

export function parseServiceCategory(value: unknown): ServiceCategory {
    if (typeof value !== "string" || value.length === 0 || value.length > 255 ||
        !value.trim() || value !== value.trim()) {
        throw new AppError("Select an existing service group", 400, "VALIDATION_ERROR");
    }
    return value;
}

export function parseNewServiceGroup(value: unknown): string {
    if (typeof value !== "string" || value.trim().length < 2 ||
        value.trim().length > 80 || /[\x00-\x1f\x7f]/.test(value) ||
        value.trim().toLocaleLowerCase("vi-VN") === "tất cả") {
        throw new AppError("Group name must be 2–80 characters", 400, "VALIDATION_ERROR");
    }
    return value.trim();
}
