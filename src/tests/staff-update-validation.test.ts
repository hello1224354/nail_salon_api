import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../common/errors";
import { parseUpdateStaffDto } from "../modules/staffs/staffs.dto";

test("admin may update an existing staff password while resubmitting a valid unchanged email", () => {
    const data = parseUpdateStaffDto({
        full_name: "QA-TEST STAFF 01",
        branch_id: 1,
        phone: "+84901005001",
        email: "qa-test-staff-01-20261010@example.com",
        work_start_time: "09:00",
        work_end_time: "20:30",
        password: "Test-New-Password-2026!",
    });
    assert.equal(data.email, "qa-test-staff-01-20261010@example.com");
    assert.equal(data.password, "Test-New-Password-2026!");
    assert.equal(data.phone, "+84901005001");
});

test("staff edit accepts valid common email addresses and normalizes email casing", () => {
    assert.equal(parseUpdateStaffDto({ email: "Test.Staff+One@Example.COM" }).email,
        "test.staff+one@example.com");
    assert.equal(parseUpdateStaffDto({ password: "Secure1234" }).password, "Secure1234");
});

test("staff edit rejects invalid emails and unsafe passwords", () => {
    for (const email of ["", "not-an-email", "a@", "@example.com", "a@example", "a b@example.com", "\\invalid@example.com"]) {
        assert.throws(() => parseUpdateStaffDto({ email }),
            (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR");
    }
    for (const password of ["short", "a".repeat(73)]) {
        assert.throws(() => parseUpdateStaffDto({ password }),
            (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR");
    }
});
