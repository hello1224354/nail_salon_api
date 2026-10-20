import assert from "node:assert/strict";
import { test } from "node:test";
import { canCompleteWorkAtTime, canStartWorkAtTime } from "../src/modules/appointments/appointment-work-time-policy";

const scheduled = Date.parse("2026-10-21T15:00:00+07:00");
const early = scheduled - 30 * 60_000;

test("early start requires explicit customer/staff readiness confirmation", () => {
    assert.equal(canStartWorkAtTime(early, scheduled, false), false);
    assert.equal(canStartWorkAtTime(early, scheduled, true), true);
});

test("scheduled start and later remain permitted without special confirmation", () => {
    assert.equal(canStartWorkAtTime(scheduled, scheduled, false), true);
    assert.equal(canStartWorkAtTime(scheduled + 1, scheduled, false), true);
});

test("early completion requires evidence that this worker already started", () => {
    assert.equal(canCompleteWorkAtTime(early, scheduled, null), false);
    assert.equal(canCompleteWorkAtTime(early, scheduled, new Date(early - 60_000)), true);
});

test("existing on-time completion behavior is preserved", () => {
    assert.equal(canCompleteWorkAtTime(scheduled, scheduled, null), true);
});
