/**
 * Run only against disposable local MySQL after production migrations.
 */
import "reflect-metadata";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { AppDataSource } from "../config/database";
import { AppError } from "../common/errors";
import { User, UserRole } from "../modules/users/users.entity";
import { Branch } from "../modules/branches/branches.entity";
import { Staff } from "../modules/staffs/staffs.entity";
import { Service } from "../modules/services/service.entity";
import { AppointmentStatus } from "../modules/appointments/appointments.entity";
import { createAppointment, getAdminTodaySummary, getAppointment, updateAppointment } from "../modules/appointments/appointments.service";
import { setActualPriceForStaff } from "../modules/appointments/appointments.prices";
import { parseCreateWalkInDto } from "../modules/walk-ins/walk-ins.dto";
import { createWalkIn, listWalkIns } from "../modules/walk-ins/walk-ins.service";

function assertIsolated() {
    assert.equal(process.env.RUN_BOOKING_INTEGRATION_TESTS, "1");
    assert.match(process.env.DB_NAME ?? "", /_integration_test$/);
    assert.ok(["localhost", "127.0.0.1"].includes(process.env.DB_HOST ?? ""));
    assert.equal(process.env.DB_SYNCHRONIZE, "false");
}

async function seed() {
    const branch = await AppDataSource.getRepository(Branch).save({
        name: "Integration Walk-ins " + randomUUID(),
        address: "Isolated DB", phone: null, opening_hours: null,
    });
    const service = await AppDataSource.getRepository(Service).save({
        branch_id: branch.id, name: "QA service", display_name: "QA service",
        category: null, subcategory: null, description: null,
        price: 100000, price_min: 100000, price_max: 100000,
        duration_minutes: 15, booking_enabled: true,
    });
    const userRepo = AppDataSource.getRepository(User);
    async function user(role: UserRole) {
        return userRepo.save(userRepo.create({
            id: randomUUID(), full_name: "QA " + role,
            email: randomUUID() + "@example.invalid", phone: null,
            password_hash: "!integration-only!", role, token_version: 0,
        }));
    }
    const staff1 = await user(UserRole.STAFF);
    const staff2 = await user(UserRole.STAFF);
    const customer = await user(UserRole.CUSTOMER);
    const admin = await user(UserRole.ADMIN);
    await AppDataSource.getRepository(Staff).save([
        { user_id: staff1.id, branch_id: branch.id },
        { user_id: staff2.id, branch_id: branch.id },
    ]);
    return { branch, service, staff1, staff2, customer, admin };
}

function futureStart() {
    const now = new Date(Date.now() + 5 * 86400000);
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 3));
}

before(async () => {
    assertIsolated();
    await AppDataSource.initialize();
    assert.equal(await AppDataSource.showMigrations(), false);
});
after(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
});

test("name-only walk-in gets authenticated staff, branch and actual revenue", async () => {
    const { branch, service, staff1, staff2, customer, admin } = await seed();
    const visit = await createWalkIn(staff1.id, parseCreateWalkInDto({
        customer_name: "Khách không để lại SĐT",
        services: [{ service_id: service.id, actual_price: 180000 }],
    }));
    assert.equal(visit.staff_id, staff1.id);
    assert.equal(visit.branch_id, branch.id);
    assert.equal(visit.customer_phone, null);
    assert.equal(visit.customer_email, null);
    assert.equal(visit.services[0].reference_price, 100000);
    assert.equal(visit.services[0].actual_price, 180000);
    assert.ok((await listWalkIns(staff1.id, UserRole.STAFF)).visits.some(v => v.id === visit.id));
    assert.ok(!(await listWalkIns(staff2.id, UserRole.STAFF)).visits.some(v => v.id === visit.id));
    assert.ok((await listWalkIns(admin.id, UserRole.ADMIN)).visits.some(v => v.id === visit.id));
    await assert.rejects(
        createWalkIn(customer.id, parseCreateWalkInDto({
            customer_name: "Unauthorized", services: [{ service_id: service.id, actual_price: 1 }],
        })),
        (e: unknown) => e instanceof AppError && e.statusCode === 403,
    );
    assert.ok((await getAdminTodaySummary()).revenue >= 180000);
});

test("two staff price one group appointment independently, without changing reference price", async () => {
    const { staff1, staff2, customer, admin, service } = await seed();
    const booking = await createAppointment(customer.id, UserRole.CUSTOMER, {
        service_ids: [service.id], start_time: futureStart(),
        customer_phone: "+84900000001", party_size: 2,
    });
    assert.equal(booking.party_size, 2);
    assert.equal((await getAppointment(booking.id, customer.id, UserRole.CUSTOMER))?.id, booking.id);
    await assert.rejects(
        setActualPriceForStaff(booking.id, service.id, staff1.id, 123000),
        (e: unknown) => e instanceof AppError && e.statusCode === 409,
    );
    await updateAppointment(booking.id, admin.id, UserRole.ADMIN, { status: AppointmentStatus.CONFIRMED });
    await setActualPriceForStaff(booking.id, service.id, staff1.id, 180000);
    await setActualPriceForStaff(booking.id, service.id, staff2.id, 220000);
    await assert.rejects(
        setActualPriceForStaff(booking.id, service.id, customer.id, 5),
        (e: unknown) => e instanceof AppError && e.statusCode === 403,
    );
    const loaded = await getAppointment(booking.id, admin.id, UserRole.ADMIN);
    assert.equal(loaded?.appointment_services.length, 1);
    assert.equal(loaded?.appointment_services[0].price, 100000);
    assert.deepEqual(loaded?.actual_prices.map(p => p.actual_price).sort((a, b) => a - b), [180000, 220000]);
});
