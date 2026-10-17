import test from "node:test";
import assert from "node:assert/strict";
import { monthWindow } from "../src/modules/appointments/admin-month-summary";

test("October month boundaries include first instant but exclude next month", () => {
    const { start, end } = monthWindow("2026-10");
    assert.equal(start.toISOString(), "2026-09-30T17:00:00.000Z");
    assert.equal(end.toISOString(), "2026-10-31T17:00:00.000Z");
});

test("December rolls over to January", () => {
    const { end } = monthWindow("2026-12");
    assert.equal(end.toISOString(), "2026-12-31T17:00:00.000Z");
});

test("invalid months are refused", () => {
    for (const value of ["2026-00", "2026-13", "abc", "2026-1", "9999-12"]) {
        assert.throws(() => monthWindow(value));
    }
});
