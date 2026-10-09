import { AppError } from "../../common/errors";

export const DEFAULT_WORK_START = "09:00";
export const DEFAULT_WORK_END = "20:30";
const OPEN_MINUTE = 9 * 60;
const CLOSE_MINUTE = 20 * 60 + 30;

export function minutesSinceMidnight(value: string): number {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
    if (!match) throw new AppError("Working hours must be in HH:mm format", 400, "INVALID_STAFF_WORK_HOURS");
    return Number(match[1]) * 60 + Number(match[2]);
}

export function assertValidWorkingHours(start: string, end: string): void {
    const first = minutesSinceMidnight(start);
    const last = minutesSinceMidnight(end);
    if (first < OPEN_MINUTE || last > CLOSE_MINUTE || first >= last ||
        first % 15 !== 0 || last % 15 !== 0) {
        throw new AppError("Working hours must be 15-minute aligned, within 09:00–20:30, and start before end", 400, "INVALID_STAFF_WORK_HOURS");
    }
}

/** [start, end) must fit entirely into this employee's recurring daily shift (Vietnam time). */
export function isWithinStaffWorkingHours(
    staff: { work_start_time: string; work_end_time: string },
    startMinute: number,
    endMinute: number,
): boolean {
    return startMinute >= minutesSinceMidnight(staff.work_start_time) &&
        endMinute <= minutesSinceMidnight(staff.work_end_time) &&
        endMinute > startMinute;
}
