import assert from "node:assert/strict";
import test from "node:test";
import { calculateAppointmentCharge } from "../src/modules/appointments/appointment-charge";

const massage = { service_id: "massage", duration_minutes: 15, price: 120_000 };
const extra = { service_id: "extra", duration_minutes: 0, price: 0 };

test("legacy 2-guest completed booking: missing prices use snapshots", () => {
    assert.equal(calculateAppointmentCharge({
        party_size: 2, appointment_services: [massage, extra],
        actual_prices: [
            { service_id: "massage", actual_price: 12 },
            { service_id: "extra", actual_price: 12 },
        ],
    }), 120_024);
});

test("every missing price defaults to booking reference for each guest", () => {
    assert.equal(calculateAppointmentCharge({
        party_size: 3, appointment_services: [massage],
    }), 360_000);
});

test("explicit zero replaces reference, not treated as missing", () => {
    assert.equal(calculateAppointmentCharge({
        party_size: 2, appointment_services: [massage],
        actual_prices: [{ service_id: "massage", actual_price: 0 }],
    }), 120_000);
});

test("two staff overrides and additional service count only once each", () => {
    assert.equal(calculateAppointmentCharge({
        party_size: 2, appointment_services: [massage, extra],
        actual_prices: [
            { service_id: "massage", actual_price: 80_000 },
            { service_id: "massage", actual_price: 90_000 },
            { service_id: "extra", actual_price: 25_000 },
        ],
    }), 195_000);
});

test("orphan price rows do not add revenue", () => {
    assert.equal(calculateAppointmentCharge({
        party_size: 1, appointment_services: [massage],
        actual_prices: [{ service_id: "unknown", actual_price: 20_000 }],
    }), 120_000);
});
