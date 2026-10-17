import { AppError } from "../../common/errors";
import { monthWindow } from "../appointments/admin-month-summary";

export type WalkInListQuery = {
    month?: string;
    branch_id?: number;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
};

export function parseWalkInListQuery(query: unknown): WalkInListQuery {
    if (!query || typeof query !== "object" || Array.isArray(query)) {
        throw new AppError("Invalid query", 400, "VALIDATION_ERROR");
    }
    const data = query as Record<string, unknown>;
    const integer = (field: string, fallback: number, max: number): number => {
        const value = data[field];
        if (value === undefined) return fallback;
        if (typeof value !== "string" || !/^[1-9][0-9]*$/.test(value) ||
            !Number.isSafeInteger(Number(value)) || Number(value) > max) {
            throw new AppError("Invalid " + field, 400, "VALIDATION_ERROR");
        }
        return Number(value);
    };
    const month = data.month;
    if (month !== undefined && typeof month !== "string") {
        throw new AppError("Invalid month", 400, "VALIDATION_ERROR");
    }
    if (typeof month === "string") monthWindow(month);
    const parseInstant = (field: string): Date | undefined => {
        const raw = data[field];
        if (raw === undefined) return undefined;
        if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(raw)) {
            throw new AppError("Invalid " + field, 400, "VALIDATION_ERROR");
        }
        const d = new Date(raw);
        if (!Number.isFinite(d.getTime())) throw new AppError("Invalid " + field, 400, "VALIDATION_ERROR");
        return d;
    };
    const from = parseInstant("from");
    const to = parseInstant("to");
    if (from && to && from >= to) {
        throw new AppError("From must be earlier than to", 400, "VALIDATION_ERROR");
    }
    return {
        month: month as string | undefined,
        branch_id: data.branch_id === undefined ? undefined : integer("branch_id", 1, 2147483647),
        from, to,
        page: integer("page", 1, 100000),
        limit: integer("limit", 50, 100),
    };
}
