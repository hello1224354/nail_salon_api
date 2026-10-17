import assert from "node:assert/strict";
import test from "node:test";
import { parseUpdateAppointmentDto } from "../src/modules/appointments/appointments.dto";

const a = "550e8400-e29b-41d4-a716-446655440000";
const b = "550e8400-e29b-41d4-a716-446655440001";

test("preserves null slot before manually assigned second guest", () => {
    const parsed = parseUpdateAppointmentDto({ staff_ids: [null, b] });
    assert.deepEqual(parsed.staff_ids, [null, b]);
});

test("rejects assigning the same employee twice in one group", () => {
    assert.throws(() => parseUpdateAppointmentDto({ staff_ids: [a, a] }));
});

test("allows two different pinned employees", () => {
    assert.deepEqual(parseUpdateAppointmentDto({ staff_ids: [a, b] }).staff_ids, [a, b]);
});

test("rejects changing appointment status and assigned employees together", () => {
    assert.throws(() => parseUpdateAppointmentDto({ status: "confirmed", staff_ids: [null, b] }));
});

test("rejects supplying both legacy staff_id and group staff_ids", () => {
    assert.throws(() => parseUpdateAppointmentDto({ staff_id: a, staff_ids: [b] }));
});
