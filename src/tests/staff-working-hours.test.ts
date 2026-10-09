import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../common/errors";
import {
    DEFAULT_WORK_START, DEFAULT_WORK_END, assertValidWorkingHours,
    isWithinStaffWorkingHours, minutesSinceMidnight,
} from "../modules/staffs/staff-working-hours";

test("default hours preserve current full-day booking window", () => {
    assert.equal(DEFAULT_WORK_START, "09:00");
    assert.equal(DEFAULT_WORK_END, "20:30");
    assert.doesNotThrow(() => assertValidWorkingHours(DEFAULT_WORK_START, DEFAULT_WORK_END));
});

test("part-time shift 13:00–20:00 allows only appointments entirely inside its interval", () => {
    const partTime = { work_start_time: "13:00", work_end_time: "20:00" };
    assertValidWorkingHours(partTime.work_start_time, partTime.work_end_time);
    assert.equal(isWithinStaffWorkingHours(partTime, 12 * 60 + 45, 13 * 60 + 15), false);
    assert.equal(isWithinStaffWorkingHours(partTime, 13 * 60, 14 * 60), true);
    assert.equal(isWithinStaffWorkingHours(partTime, 19 * 60 + 30, 20 * 60), true);
    assert.equal(isWithinStaffWorkingHours(partTime, 19 * 60 + 30, 20 * 60 + 15), false);
});

test("reject invalid shifts, non-15-minute boundaries, outside opening hours or overnight", () => {
    for (const [start, end] of [
        ["08:00", "20:00"], ["13:10", "20:00"], ["13:00", "20:45"],
        ["20:00", "13:00"], ["13:00", "13:00"], ["25:00", "26:00"],
    ]) {
        assert.throws(
            () => assertValidWorkingHours(start, end),
            (error: unknown) => error instanceof AppError && error.code === "INVALID_STAFF_WORK_HOURS",
        );
    }
    assert.equal(minutesSinceMidnight("13:00"), 780);
});
