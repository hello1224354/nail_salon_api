/**
 * REAL MySQL integration tests against the production booking service.
 *
 * Only run with an ephemeral, local DB named *_integration_test:
 * RUN_BOOKING_INTEGRATION_TESTS=1 DB_NAME=nail_salon_integration_test ...
 *
 * CI provisions MySQL 8, applies the actual TypeORM migrations, then runs these
 * tests. Never connect this runner to a production or shared database.
 */
import "reflect-metadata";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { AppDataSource } from "../config/database";
import { AppError } from "../common/errors";
import { Appointment, AppointmentStatus } from "../modules/appointments/appointments.entity";
import { createAppointment, getAvailability, getAppointment, getAllAppointments, updateAppointment } from "../modules/appointments/appointments.service";
import { AppointmentStaffAssignment } from "../modules/appointments/appointment-staff-assignment.entity";
import { StaffBookingSlot } from "../modules/appointments/staff-booking-slots.entity";
import { Branch } from "../modules/branches/branches.entity";
import { Service } from "../modules/services/service.entity";
import { Staff } from "../modules/staffs/staffs.entity";
import { updateStaff } from "../modules/staffs/staffs.service";
import { User, UserRole } from "../modules/users/users.entity";

const PARTICIPANTS = 16;
const DURATION_MINUTES = 30;
const SLOT_MS = 15 * 60 * 1000;

type Fixture = {
    branch: Branch;
    service: Service;
    staffUsers: User[];
    customers: User[];
};

function assertIsolatedTestDatabase() {
    assert.equal(
        process.env.RUN_BOOKING_INTEGRATION_TESTS,
        "1",
        "Explicit opt-in RUN_BOOKING_INTEGRATION_TESTS=1 is required",
    );
    assert.match(
        process.env.DB_NAME ?? "",
        /_integration_test$/,
        "The test database name must end with _integration_test",
    );
    assert.ok(
        ["127.0.0.1", "localhost"].includes(process.env.DB_HOST ?? ""),
        "Integration tests only run against local MySQL; never Railway/production",
    );
    assert.equal(process.env.DB_SYNCHRONIZE, "false", "Use production migrations, never synchronize");
}

function startInVietnamAt(hour: number) {
    // Five days from now and at a fixed Asia/Ho_Chi_Minh calendar clock hour.
    // All tests fall within the customer's [3 hours, 14 days] booking window.
    const date = new Date(Date.now() + 5 * 86_400_000);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour - 7, 0, 0));
}

function makeUser(role: UserRole, label: string): User {
    return AppDataSource.getRepository(User).create({
        id: randomUUID(),
        full_name: `Integration ${label}`,
        email: `booking-test-${randomUUID()}@example.invalid`,
        phone: null,
        password_hash: "!integration-test-only-never-login!",
        role,
        token_version: 0,
    });
}

async function seedFixture(label: string, staffCount: number, customerCount: number): Promise<Fixture> {
    const branch = await AppDataSource.getRepository(Branch).save({
        name: `Integration ${label} ${randomUUID()}`,
        address: "Ephemeral CI MySQL database",
        phone: null,
        opening_hours: null,
    });
    const service = await AppDataSource.getRepository(Service).save({
        branch_id: branch.id,
        name: `Test Service ${label}`,
        display_name: `Test Service ${label}`,
        category: null,
        subcategory: null,
        description: null,
        price: 100_000,
        price_min: 100_000,
        price_max: 100_000,
        duration_minutes: DURATION_MINUTES,
        booking_enabled: true,
    });
    const users = AppDataSource.getRepository(User);
    const staffUsers = await users.save(
        Array.from({ length: staffCount }, (_, i) => makeUser(UserRole.STAFF, `${label}-staff-${i}`)),
    );
    const customers = await users.save(
        Array.from({ length: customerCount }, (_, i) => makeUser(UserRole.CUSTOMER, `${label}-customer-${i}`)),
    );
    await AppDataSource.getRepository(Staff).save(
        staffUsers.map((staff) => ({ user_id: staff.id, branch_id: branch.id })),
    );
    return { branch, service, staffUsers, customers };
}

function bookingAt(service: Service, startTime: Date, partySize: number) {
    return {
        service_ids: [service.id],
        start_time: startTime,
        party_size: partySize,
        customer_phone: "+84900000000",
    };
}

async function appointmentsFor(fixture: Fixture, startTime: Date) {
    return AppDataSource.getRepository(Appointment).findBy({
        branch_id: fixture.branch.id,
        start_time: startTime,
    });
}

async function slotsFor(fixture: Fixture) {
    return AppDataSource.getRepository(StaffBookingSlot).findBy({
        staff_id: (await import("typeorm")).In(fixture.staffUsers.map((staff) => staff.id)),
    });
}

function assertExpectedFailures(results: PromiseSettledResult<Appointment>[]) {
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    for (const result of failed) {
        assert.ok(
            result.reason instanceof AppError,
            `Unexpected database error: ${String(result.reason)}`,
        );
        assert.equal(result.reason.code, "SLOT_UNAVAILABLE");
        assert.equal(result.reason.statusCode, 409);
    }
}

before(async () => {
    assertIsolatedTestDatabase();
    await AppDataSource.initialize();
    assert.equal(await AppDataSource.showMigrations(), false, "Run actual TypeORM migrations first");
    await AppDataSource.query("SET SESSION innodb_lock_wait_timeout = 10");
});

after(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
});

test("16 distinct customers cannot double-book one staff / one time interval", async () => {
    const fixture = await seedFixture("one-staff-race", 1, PARTICIPANTS);
    const startTime = startInVietnamAt(10);
    const initialSlots = await getAvailability({
        date: new Date(startTime.getTime() - 10 * 60 * 60 * 1000),
        service_ids: [fixture.service.id],
        party_size: 1,
    });
    assert.ok(initialSlots.slots.some((slot) => slot.getTime() === startTime.getTime()));

    const settled = await Promise.allSettled(
        fixture.customers.map((customer) =>
            createAppointment(customer.id, UserRole.CUSTOMER, bookingAt(fixture.service, startTime, 1)),
        ),
    );
    assertExpectedFailures(settled);
    const accepted = settled.filter((r): r is PromiseFulfilledResult<Appointment> => r.status === "fulfilled");

    assert.equal(accepted.length, 1, "Exactly one booking must win for one staff");
    assert.equal(settled.length - accepted.length, PARTICIPANTS - 1);
    const appointments = await appointmentsFor(fixture, startTime);
    assert.equal(appointments.length, 1, "No duplicate or partially committed appointments");
    assert.equal(appointments[0].id, accepted[0].value.id);
    assert.equal(appointments[0].status, AppointmentStatus.PENDING);

    const reservations = await slotsFor(fixture);
    assert.equal(reservations.length, 2, "30-minute booking must reserve exactly two 15-minute slots");
    assert.deepEqual(
        reservations.map((s) => s.slot_start.getTime()).sort(),
        [startTime.getTime(), startTime.getTime() + SLOT_MS],
    );
    console.log(`PASS: 1 winner, ${PARTICIPANTS - 1} conflicts, 2 unique slots (real MySQL)`);
});

test("concurrent group bookings commit either both staff assignments or none", async () => {
    const fixture = await seedFixture("group-race", 2, PARTICIPANTS);
    const startTime = startInVietnamAt(11);
    const settled = await Promise.allSettled(
        fixture.customers.map((customer) =>
            createAppointment(customer.id, UserRole.CUSTOMER, bookingAt(fixture.service, startTime, 2)),
        ),
    );
    assertExpectedFailures(settled);
    const accepted = settled.filter((r): r is PromiseFulfilledResult<Appointment> => r.status === "fulfilled");
    assert.equal(accepted.length, 1, "Only one two-person group may reserve both staff");

    const appointments = await appointmentsFor(fixture, startTime);
    assert.equal(appointments.length, 1, "One group is exactly one appointment");
    assert.equal(appointments[0].id, accepted[0].value.id);
    assert.equal(appointments[0].party_size, 2);
    assert.equal(appointments[0].status, AppointmentStatus.PENDING);
    const assignments = await AppDataSource.getRepository(AppointmentStaffAssignment).findBy({
        appointment_id: appointments[0].id,
    });
    assert.equal(assignments.length, 2, "One appointment has two assigned employees");
    assert.equal(new Set(assignments.map(a => a.staff_id)).size, 2);
    const reservations = await slotsFor(fixture);
    assert.equal(reservations.length, 4, "Two staff each hold two 15-minute slots");
    console.log(`PASS: 1 group of 2 committed, ${PARTICIPANTS - 1} rejected, 4 unique slots`);
});

test("failed partial group allocation rolls back the already reserved free staff slots", async () => {
    const fixture = await seedFixture("group-rollback", 2, 1);
    const startTime = startInVietnamAt(12);
    const staffRepo = AppDataSource.getRepository(Staff);
    // Ensure the free candidate is considered first: staff list sorts by created_at.
    await staffRepo.update({ user_id: fixture.staffUsers[0].id }, { created_at: new Date("2020-01-01T00:00:00.000Z") });
    await staffRepo.update({ user_id: fixture.staffUsers[1].id }, { created_at: new Date("2021-01-01T00:00:00.000Z") });

    const slots = AppDataSource.getRepository(StaffBookingSlot);
    // Reserve the second staff only. Its conflict happens after the first was reserved
    // inside the booking transaction; rolling back must remove the first reservation.
    await slots.save({
        staff_id: fixture.staffUsers[1].id,
        slot_start: startTime,
    });
    await assert.rejects(
        createAppointment(fixture.customers[0].id, UserRole.CUSTOMER, bookingAt(fixture.service, startTime, 2)),
        (error: unknown) => error instanceof AppError && error.code === "SLOT_UNAVAILABLE",
    );
    assert.equal((await appointmentsFor(fixture, startTime)).length, 0);
    const remaining = await slotsFor(fixture);
    assert.equal(remaining.length, 1, "Only the pre-existing blocked slot should remain");
    assert.equal(remaining[0].staff_id, fixture.staffUsers[1].id);

    // The rollback left free staff genuinely free, not falsely blocked by an orphan slot.
    const solo = await createAppointment(
        fixture.customers[0].id, UserRole.CUSTOMER, bookingAt(fixture.service, startTime, 1),
    );
    assert.equal(solo.staff_id, fixture.staffUsers[0].id);
    assert.equal((await appointmentsFor(fixture, startTime)).length, 1);
    console.log("PASS: failed group left no partial booking or orphan staff reservation");
});

test("adjacent intervals [start, end) remain bookable without a staff buffer", async () => {
    const fixture = await seedFixture("adjacent", 1, 2);
    const firstStart = startInVietnamAt(13);
    const nextStart = new Date(firstStart.getTime() + DURATION_MINUTES * 60 * 1000);
    const first = await createAppointment(
        fixture.customers[0].id, UserRole.CUSTOMER, bookingAt(fixture.service, firstStart, 1),
    );
    const second = await createAppointment(
        fixture.customers[1].id, UserRole.CUSTOMER, bookingAt(fixture.service, nextStart, 1),
    );
    assert.equal(first.staff_id, second.staff_id);
    assert.equal((await slotsFor(fixture)).length, 4);
    console.log("PASS: adjacent appointments reserve four disjoint 15-minute slots");
});


test("part-time 13:00–20:00 shifts change availability and reject out-of-shift group bookings", async () => {
    const fixture = await seedFixture("part-time-hours", 3, 2);
    const staffRepo = AppDataSource.getRepository(Staff);
    for (const staff of fixture.staffUsers.slice(1)) {
        await staffRepo.update({ user_id: staff.id }, { work_start_time: "13:00", work_end_time: "20:00" });
    }

    const at10 = startInVietnamAt(10);
    const at13 = startInVietnamAt(13);
    const at20 = startInVietnamAt(20);
    const day = new Date(at10.getTime() - 10 * 60 * 60 * 1000);
    const availability = await getAvailability({ date: day, service_ids: [fixture.service.id], party_size: 2 });
    assert.equal(availability.slots.some(slot => slot.getTime() === at10.getTime()), false, "Only the full-day employee is working at 10");
    assert.equal(availability.slots.some(slot => slot.getTime() === at13.getTime()), true, "Two part-time employees start at 13");
    assert.equal(availability.slots.some(slot => slot.getTime() === at20.getTime()), false, "Part-time shifts end exactly at 20");

    await assert.rejects(
        () => createAppointment(fixture.customers[0].id, UserRole.CUSTOMER, bookingAt(fixture.service, at10, 2)),
        (error: unknown) => error instanceof AppError && error.code === "SLOT_UNAVAILABLE",
    );
    const booked = await createAppointment(
        fixture.customers[0].id, UserRole.CUSTOMER, bookingAt(fixture.service, at13, 2),
    );
    assert.ok(booked.booking_group_id);
    assert.equal((await appointmentsFor(fixture, at13)).length, 1);

    await assert.rejects(
        () => updateStaff(booked.staff_id, { work_start_time: "14:00", work_end_time: "20:00" }),
        (error: unknown) => error instanceof AppError && error.code === "STAFF_SCHEDULE_CONFLICT",
        "Editing staff hours must not invalidate existing future bookings",
    );
});

test("ADMIN edit with no chosen staff automatically reassigns the entire group and its slots", async () => {
    const fixture = await seedFixture("group-admin-auto", 3, 1);
    const firstStart = startInVietnamAt(13);
    const nextStart = new Date(firstStart.getTime() + 60 * 60_000);
    const booking = await createAppointment(fixture.customers[0].id, UserRole.CUSTOMER,
        bookingAt(fixture.service, firstStart, 2));
    const assignments = AppDataSource.getRepository(AppointmentStaffAssignment);
    assert.equal(await assignments.countBy({ appointment_id: booking.id }), 2);
    assert.equal((await appointmentsFor(fixture, firstStart)).length, 1);

    const edited = await updateAppointment(booking.id, fixture.customers[0].id, UserRole.ADMIN, {
        start_time: nextStart,
    });
    assert.ok(edited);
    assert.equal(edited!.id, booking.id);
    assert.equal(edited!.party_size, 2);
    assert.equal(await assignments.countBy({ appointment_id: booking.id }), 2);
    assert.equal((await appointmentsFor(fixture, firstStart)).length, 0);
    assert.equal((await appointmentsFor(fixture, nextStart)).length, 1);
    const slots = await slotsFor(fixture);
    assert.equal(slots.length, 4);
    assert.ok(slots.every(slot => slot.slot_start.getTime() >= nextStart.getTime()));

    const visibleToCustomer = await getAppointment(booking.id, fixture.customers[0].id, UserRole.CUSTOMER);
    assert.ok(visibleToCustomer);
    assert.equal(visibleToCustomer!.staff_assignments.length, 2);
    assert.equal(visibleToCustomer!.start_time.getTime(), nextStart.getTime());
    const customerList = await getAllAppointments(fixture.customers[0].id, UserRole.CUSTOMER, {
        page: 1, limit: 10,
    });
    assert.equal(customerList.total, 1, "Group counts as one customer appointment");
    assert.equal(customerList.appointments.length, 1);
    assert.equal(customerList.appointments[0].staff_assignments.length, 2);
    const adminList = await getAllAppointments(fixture.customers[0].id, UserRole.ADMIN, {
        page: 1, limit: 10, branch_id: fixture.branch.id,
    });
    assert.equal(adminList.total, 1, "Group counts as one admin appointment");
    const otherStaff = (await assignments.findBy({ appointment_id: booking.id }))[1].staff_id;
    const staffList = await getAllAppointments(otherStaff, UserRole.STAFF, { page: 1, limit: 10 });
    assert.equal(staffList.total, 1, "Any employee assigned to group can see same appointment");

    const cancelled = await updateAppointment(booking.id, fixture.customers[0].id, UserRole.ADMIN, {
        status: AppointmentStatus.CANCELLED,
    });
    assert.equal(cancelled!.status, AppointmentStatus.CANCELLED);
    assert.equal((await slotsFor(fixture)).length, 0, "Cancel frees all staff slots in the group");
    assert.equal(await assignments.countBy({ appointment_id: booking.id }), 2,
        "History retains every employee assignment");
});

test("ADMIN explicitly selected staff is included, while conflicting reassignment rolls back", async () => {
    const fixture = await seedFixture("group-admin-staff", 3, 2);
    const start = startInVietnamAt(14);
    const booking = await createAppointment(fixture.customers[0].id, UserRole.CUSTOMER,
        bookingAt(fixture.service, start, 2));
    const assignments = AppDataSource.getRepository(AppointmentStaffAssignment);
    const originallyAssigned = await assignments.findBy({ appointment_id: booking.id });
    const alternative = fixture.staffUsers.find(user => !originallyAssigned.some(a => a.staff_id === user.id));
    assert.ok(alternative);
    const updated = await updateAppointment(booking.id, fixture.customers[0].id, UserRole.ADMIN, {
        staff_id: alternative!.id,
    });
    assert.ok(updated);
    const updatedAssignments = await assignments.findBy({ appointment_id: booking.id });
    assert.equal(updatedAssignments.length, 2);
    assert.ok(updatedAssignments.some(a => a.staff_id === alternative!.id));
    assert.equal((await appointmentsFor(fixture, start)).length, 1);

    const blocking = await createAppointment(fixture.customers[1].id, UserRole.CUSTOMER,
        bookingAt(fixture.service, new Date(start.getTime() + DURATION_MINUTES * 60_000), 1));
    const before = await assignments.findBy({ appointment_id: booking.id });
    await assert.rejects(
        () => updateAppointment(booking.id, fixture.customers[0].id, UserRole.ADMIN, {
            start_time: blocking.start_time,
            staff_id: blocking.staff_id,
        }),
        (err: unknown) => err instanceof AppError && err.code === "SLOT_UNAVAILABLE",
    );
    const after = await assignments.findBy({ appointment_id: booking.id });
    assert.deepEqual(after.map(a => a.staff_id).sort(), before.map(a => a.staff_id).sort());
    assert.equal((await slotsFor(fixture)).length, 6, "Failed update did not lose reservations");
});
