import { AppError } from "../../common/errors";

/** Inclusive beginning/exclusive ending of a Vietnamese calendar month. */
export function monthWindow(month: string): { start: Date; end: Date } {
    if (!/^\\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        throw new AppError("Month must use YYYY-MM format", 400, "VALIDATION_ERROR");
    }
    const [year, number] = month.split("-").map(Number);
    if (year < 1000 || year > 9998) {
        throw new AppError("Month year is out of range", 400, "VALIDATION_ERROR");
    }
    const start = new Date(Date.UTC(year, number - 1, 1) - 7 * 60 * 60 * 1000);
    const end = new Date(Date.UTC(year, number, 1) - 7 * 60 * 60 * 1000);
    return { start, end };
}
