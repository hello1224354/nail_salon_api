import { AppError } from "../../common/errors";
import { parseVietnamesePhone } from "../users/users.dto";

export type CreateWalkInDto = {
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    services: Array<{ service_id: string; actual_price: number }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validActualPrice(value: unknown): value is number {
    return typeof value === "number" &&
        Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
}

export function parseCreateWalkInDto(body: unknown): CreateWalkInDto {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Invalid walk-in request", 400, "VALIDATION_ERROR");
    }
    const data = body as Record<string, unknown>;
    if ("staff_id" in data || "branch_id" in data || "user_id" in data) {
        throw new AppError("Walk-in staff and branch are taken from the signed-in employee", 403, "FORBIDDEN");
    }
    if (typeof data.customer_name !== "string" || !data.customer_name.trim() ||
        data.customer_name.trim().length > 255) {
        throw new AppError("Customer name must be 1–255 characters", 400, "VALIDATION_ERROR");
    }
    const phone = data.customer_phone;
    const customer_phone = phone === undefined || phone === null || phone === ""
        ? null : parseVietnamesePhone(phone, "Customer_phone");
    const email = data.customer_email;
    const customer_email = email === undefined || email === null || email === ""
        ? null : typeof email === "string" && EMAIL.test(email.trim()) && email.trim().length <= 255
            ? email.trim().toLowerCase()
            : (() => { throw new AppError("Invalid customer email", 400, "VALIDATION_ERROR"); })();

    if (!Array.isArray(data.services) || data.services.length === 0 || data.services.length > 40) {
        throw new AppError("Select between 1 and 40 services", 400, "VALIDATION_ERROR");
    }
    const services = data.services.map(item => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new AppError("Invalid service entry", 400, "VALIDATION_ERROR");
        }
        const row = item as Record<string, unknown>;
        if (typeof row.service_id !== "string" || !UUID.test(row.service_id) || !validActualPrice(row.actual_price)) {
            throw new AppError("Each service needs an ID and a valid actual price", 400, "VALIDATION_ERROR");
        }
        return { service_id: row.service_id, actual_price: row.actual_price };
    });
    if (new Set(services.map(s => s.service_id)).size !== services.length) {
        throw new AppError("Duplicate services are not allowed", 400, "VALIDATION_ERROR");
    }
    return { customer_name: data.customer_name.trim(), customer_phone, customer_email, services };
}
