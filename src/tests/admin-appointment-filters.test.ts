import assert from "node:assert/strict";
import test from "node:test";
import { parseGetAppointmentsQuery } from "../modules/appointments/appointments.dto";

test("accepts and normalizes the eight-character booking reference displayed to customers", () => {
    const query = parseGetAppointmentsQuery({ booking_code: " 9DCB7830 ", page: "1", limit: "20" });
    assert.equal(query.booking_code, "9dcb7830");
    assert.equal(query.page, 1);
    assert.equal(query.limit, 20);
});

test("supports partial reference entry without searching nonhexadecimal characters", () => {
    assert.equal(parseGetAppointmentsQuery({ booking_code: "9dcb" }).booking_code, "9dcb");
    for (const invalid of ["", "9DCB78309", "9DCB-830", "G9DCB783", "%%%%%%%%", 123]) {
        assert.throws(
            () => parseGetAppointmentsQuery({ booking_code: invalid }),
            /Booking_code must be 1 to 8 hexadecimal characters/,
        );
    }
});

test("accepts an inclusive Vietnam calendar date interval expressed as exclusive API upper bound", () => {
    const start = new Date("2026-10-09T00:00:00+07:00").toISOString();
    const until = new Date(new Date("2026-10-11T00:00:00+07:00").getTime() + 86400000).toISOString();
    const query = parseGetAppointmentsQuery({ from: start, to: until, booking_code: "9DCB7830" });
    assert.equal(query.from?.toISOString(), "2026-10-08T17:00:00.000Z");
    assert.equal(query.to?.toISOString(), "2026-10-11T17:00:00.000Z");
    assert.equal(query.booking_code, "9dcb7830");
});

test("rejects an appointment date range whose end is before the start", () => {
    assert.throws(
        () => parseGetAppointmentsQuery({
            from: "2026-10-11T17:00:00.000Z",
            to: "2026-10-08T17:00:00.000Z",
        }),
        /From must be earlier than to/,
    );
});
