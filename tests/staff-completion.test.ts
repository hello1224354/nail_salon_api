import assert from "node:assert/strict";
import test from "node:test";
import { hasAllStaffPrices, isGroupComplete } from "../src/modules/appointments/staff-completion";

const a = "staff-a", b = "staff-b";
const s1 = "service-one", s2 = "service-two";

test("a worker cannot finish with only another worker's prices", () => {
    assert.equal(hasAllStaffPrices(a, [s1, s2], [{ staff_id: a, service_id: s1 }, { staff_id: b, service_id: s2 }]), false);
    assert.equal(hasAllStaffPrices(a, [s1, s2], [{ staff_id: a, service_id: s1 }, { staff_id: a, service_id: s2 }]), true);
});

test("one worker's completion does not close a group", () => {
    const assignments = [{ completed_at: new Date() }, { completed_at: null }];
    assert.equal(isGroupComplete(assignments), false);
    assignments[1].completed_at = new Date();
    assert.equal(isGroupComplete(assignments), true);
});

test("single-worker booking completes immediately but zero staff never completes", () => {
    assert.equal(isGroupComplete([{ completed_at: new Date() }]), true);
    assert.equal(isGroupComplete([]), false);
    assert.equal(hasAllStaffPrices(a, [], []), false);
});
