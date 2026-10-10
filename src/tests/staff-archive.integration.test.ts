/** Real-MySQL regression: archiving a staff member must retain booking snapshots. */
import "reflect-metadata";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { AppDataSource } from "../config/database";
import { AppError } from "../common/errors";
import { Branch } from "../modules/branches/branches.entity";
import { Service } from "../modules/services/service.entity";
import { Staff } from "../modules/staffs/staffs.entity";
import { deleteStaff, getAllStaffs, getAllStaffsForAdmin } from "../modules/staffs/staffs.service";
import { User, UserRole } from "../modules/users/users.entity";
import { loginUser } from "../modules/users/users.service";
import { AppointmentStaffAssignment } from "../modules/appointments/appointment-staff-assignment.entity";
import { AppointmentStatus } from "../modules/appointments/appointments.entity";
import { createAppointment, updateAppointment, getAvailability } from "../modules/appointments/appointments.service";

function ensureIsolatedDatabase() {
    assert.equal(process.env.RUN_BOOKING_INTEGRATION_TESTS, "1");
    assert.match(process.env.DB_NAME ?? "", /_integration_test$/);
    assert.ok(["localhost", "127.0.0.1"].includes(process.env.DB_HOST ?? ""));
    assert.equal(process.env.DB_SYNCHRONIZE, "false");
}

function dateFiveDaysOutAtTenInVietnam() {
    const d = new Date(Date.now() + 5 * 86_400_000);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 3, 0, 0));
}

before(async () => {
    ensureIsolatedDatabase();
    await AppDataSource.initialize();
    assert.equal(await AppDataSource.showMigrations(), false);
});

after(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
});

test("archive keeps historical assignments but removes login and booking availability", async () => {
    const branches = AppDataSource.getRepository(Branch);
    const users = AppDataSource.getRepository(User);
    const staffRepo = AppDataSource.getRepository(Staff);
    const serviceRepo = AppDataSource.getRepository(Service);

    const branch = await branches.save(branches.create({
        name: "QA archive " + randomUUID(),
        address: "CI isolation only",
        phone: null,
        opening_hours: null,
    }));
    const service = await serviceRepo.save(serviceRepo.create({
        branch_id: branch.id,
        name: "Archive service",
        display_name: "Archive service",
        duration_minutes: 30,
        price: 100000,
        price_min: 100000,
        price_max: 100000,
        category: null,
        subcategory: null,
        description: null,
        booking_enabled: true,
    }));
    const staffUser = await users.save(users.create({
        full_name: "QA Archive STAFF",
        email: "qa-staff-" + randomUUID() + "@example.invalid",
        phone: null,
        password_hash: "!no-real-credentials!",
        role: UserRole.STAFF,
        token_version: 0,
    }));
    const customer = await users.save(users.create({
        full_name: "QA Archive Customer",
        email: "qa-customer-" + randomUUID() + "@example.invalid",
        phone: null,
        password_hash: "!no-real-credentials!",
        role: UserRole.CUSTOMER,
        token_version: 0,
    }));
    const admin = await users.save(users.create({
        full_name: "QA Archive Admin",
        email: "qa-admin-" + randomUUID() + "@example.invalid",
        phone: null,
        password_hash: "!no-real-credentials!",
        role: UserRole.ADMIN,
        token_version: 0,
    }));
    await staffRepo.save(staffRepo.create({
        user_id: staffUser.id,
        branch_id: branch.id,
        work_start_time: "09:00",
        work_end_time: "20:30",
    }));

    const start = dateFiveDaysOutAtTenInVietnam();
    const booking = await createAppointment(customer.id, UserRole.CUSTOMER, {
        service_ids: [service.id],
        start_time: start,
        party_size: 1,
        customer_phone: "+84900000000",
    });
    const assignments = AppDataSource.getRepository(AppointmentStaffAssignment);
    assert.equal((await assignments.findBy({ appointment_id: booking.id })).length, 1);

    await assert.rejects(() => deleteStaff(staffUser.id), (err: unknown) =>
        err instanceof AppError && err.code === "STAFF_HAS_UPCOMING_BOOKINGS" && err.statusCode === 409);
    assert.equal((await users.findOneByOrFail({ id: staffUser.id })).is_active, true);

    await updateAppointment(booking.id, admin.id, UserRole.ADMIN, {
        status: AppointmentStatus.CANCELLED,
    });

    const archived = await deleteStaff(staffUser.id);
    assert.equal(archived?.user_id, staffUser.id);
    assert.equal(archived?.user.is_active, false);
    const persisted = await users.findOneByOrFail({ id: staffUser.id });
    assert.equal(persisted.is_active, false);
    assert.equal(persisted.token_version, 1);
    assert.equal(await deleteStaff(staffUser.id), null, "idempotent archive returns not found");

    const listed = await getAllStaffs({ branch_id: branch.id });
    const adminListed = await getAllStaffsForAdmin({ branch_id: branch.id });
    assert.equal(listed.length, 0);
    assert.equal(adminListed.length, 0);

    const snapshots = await assignments.findBy({ appointment_id: booking.id });
    assert.equal(snapshots.length, 1);
    assert.equal(snapshots[0].staff_id, staffUser.id);
    assert.equal(snapshots[0].staff_full_name, staffUser.full_name);

    const available = await getAvailability({
        date: new Date(start.getTime() - 10 * 60 * 60 * 1000),
        service_ids: [service.id],
        party_size: 1,
    });
    assert.equal(available.slots.length, 0);
    assert.equal(available.max_party_size, 0);

    await assert.rejects(() => loginUser({
        email: staffUser.email!,
        password: "irrelevant",
        remember_me: false,
    }), (err: unknown) => err instanceof AppError && err.code === "INVALID_CREDENTIALS");
});
