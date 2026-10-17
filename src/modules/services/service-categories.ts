import { AppError } from "../../common/errors";

/**
 * The six existing public catalogue groups, shared by API validation and
 * the Admin category picker. Adding a new category is an intentional change,
 * not arbitrary free-form user input.
 */
export const SERVICE_CATEGORIES = [
    "Chăm sóc cơ bản",
    "Combo",
    "Dịch vụ khác",
    "Nail art & trang trí",
    "Phụ thu sơn nền",
    "Sơn nền cao cấp",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export function parseServiceCategory(value: unknown): ServiceCategory {
    if (typeof value !== "string" || !SERVICE_CATEGORIES.includes(value as ServiceCategory)) {
        throw new AppError("Category must be selected from the existing service groups", 400, "VALIDATION_ERROR");
    }
    return value as ServiceCategory;
}
