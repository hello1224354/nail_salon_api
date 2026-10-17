import { AppError } from "../../common/errors";

/** A session identifier is only a random UUID v4, never contact information. */
export function parseVisitSessionId(value: unknown): string {
    if (typeof value !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        throw new AppError("Invalid visit session", 400, "VALIDATION_ERROR");
    }
    return value.toLowerCase();
}
