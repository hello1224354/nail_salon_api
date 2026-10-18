import { randomUUID } from "crypto";
import { EntityManager, In, IsNull } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { Appointment, AppointmentStatus } from "./appointments.entity";
import { AppointmentStaffAssignment } from "./appointment-staff-assignment.entity";
import { AppointmentTransferRequest, TransferStatus } from "./appointment-transfer-request.entity";
import { AppointmentActualPrice } from "./appointment-actual-price.entity";
import { AppointmentService } from "./appointment-services.entity";
import { StaffBookingSlot } from "./staff-booking-slots.entity";
import { StaffAssignmentRotation } from "./staff-assignment-rotation.entity";
import { Staff } from "../staffs/staffs.entity";
import { UserRole } from "../users/users.entity";
import { isWithinStaffWorkingHours } from "../staffs/staff-working-hours";
import { getVietnamMinuteOfDay } from "./booking-time";

const TRANSFER_EXPIRY_MS = 3 * 60 * 1000;
const MAX_OVERLAP_MS = 10 * 60 * 1000;
const SLOT_MS = 15 * 60 * 1000;
const ACTIVE = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS];
const TRANSFERABLE = [AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS, AppointmentStatus.NO_SHOW];

function overlaps(a: Date, b: Date, c: Date, d: Date): number {
    return Math.max(0, Math.min(b.getTime(), d.getTime()) - Math.max(a.getTime(), c.getTime()));
}

async function lockBranch(manager: EntityManager, branchId: number) {
    const repo = manager.getRepository(StaffAssignmentRotation);
    await repo.createQueryBuilder().insert().values({ branch_id: branchId, last_staff_id: null }).orIgnore().execute();
    const row = await repo.findOne({ where: { branch_id: branchId }, lock: { mode: "pessimistic_write" } });
    if (!row) throw new Error("Cannot lock branch assignment");
}

/** Logical holds also protect accepted transfers with permitted short overlaps.
 * Normal 15-minute slot uniqueness remains intact and is not relaxed.
 */
export async function getActiveTransferHolds(manager: EntityManager, staffId: string, now = new Date()) {
    const candidates = await manager.getRepository(AppointmentTransferRequest).find({
        where: { to_staff_id: staffId, status: In([TransferStatus.PENDING, TransferStatus.ACCEPTED]) },
    });
    if (!candidates.length) return [];
    const appointments = await manager.getRepository(Appointment).find({
        where: { id: In([...new Set(candidates.map(row => row.appointment_id))]), merged_into_id: IsNull() },
        relations: { staff_assignments: true },
    });
    const byId = new Map(appointments.map(row => [row.id, row]));
    return candidates.filter(row => {
        const appointment = byId.get(row.appointment_id);
        if (!appointment || ![...ACTIVE, AppointmentStatus.NO_SHOW].includes(appointment.status)) return false;
        if (row.status === TransferStatus.PENDING) {
            return row.expires_at > now &&
                appointment.staff_assignments.some(assigned => assigned.staff_id === row.from_staff_id && !assigned.started_at && !assigned.completed_at) &&
                appointment.start_time.getTime() === row.scheduled_start.getTime() &&
                appointment.end_time.getTime() === row.scheduled_end.getTime();
        }
        return ACTIVE.includes(appointment.status) &&
            appointment.start_time.getTime() === row.scheduled_start.getTime() &&
            appointment.end_time.getTime() === row.scheduled_end.getTime() &&
            appointment.staff_assignments.some(assigned => assigned.staff_id === staffId && !assigned.completed_at);
    });
}

export async function hasHeldTransferOverlap(
    manager: EntityManager, staffId: string, start: Date, end: Date,
): Promise<boolean> {
    const holds = await getActiveTransferHolds(manager, staffId);
    return holds.some(row => overlaps(start, end, row.reserved_start, row.reserved_end) > 0);
}

export async function expireTransferRequests() {
    await AppDataSource.getRepository(AppointmentTransferRequest)
        .createQueryBuilder().update()
        .set({ status: TransferStatus.EXPIRED, decided_at: new Date() })
        .where("status = :status AND expires_at <= :now", { status: TransferStatus.PENDING, now: new Date() })
        .execute();
}

export async function listTransferPeers(staffId: string) {
    const current = await AppDataSource.getRepository(Staff).findOneBy({ user_id: staffId });
    if (!current) throw new AppError("Staff profile not found", 403, "FORBIDDEN");
    const peers = await AppDataSource.getRepository(Staff).find({
        where: { branch_id: current.branch_id },
        relations: { user: true },
    });
    return peers.filter(peer => peer.user_id !== staffId && peer.user.role === UserRole.STAFF)
        .map(peer => ({ id: peer.user_id, name: peer.user.full_name }));
}

export async function listTransferRequests(staffId: string) {
    await expireTransferRequests();
    const repo = AppDataSource.getRepository(AppointmentTransferRequest);
    const [incoming, outgoing] = await Promise.all([
        repo.find({ where: { to_staff_id: staffId }, order: { created_at: "DESC" }, take: 60 }),
        repo.find({ where: { from_staff_id: staffId }, order: { created_at: "DESC" }, take: 60 }),
    ]);
    return { incoming, outgoing };
}

export async function requestTransfer(appointmentId: string, fromStaffId: string, toStaffId: string) {
    if (fromStaffId === toStaffId) throw new AppError("Select another employee", 400, "VALIDATION_ERROR");
    const createdAt = new Date();
    return AppDataSource.transaction("READ COMMITTED", async manager => {
        const appointment = await manager.getRepository(Appointment).findOne({
            where: { id: appointmentId, merged_into_id: IsNull() },
            relations: { staff_assignments: true, appointment_services: true },
            lock: { mode: "pessimistic_write" },
        });
        if (!appointment) throw new AppError("Booking not found", 404, "APPOINTMENT_NOT_FOUND");
        await lockBranch(manager, appointment.branch_id);
        if (!TRANSFERABLE.includes(appointment.status)) throw new AppError("Booking cannot be transferred", 409, "APPOINTMENT_NOT_EDITABLE");
        const mine = appointment.staff_assignments.find(row => row.staff_id === fromStaffId);
        if (!mine) throw new AppError("You do not own this work", 403, "FORBIDDEN");
        if (mine.started_at || mine.completed_at) throw new AppError("Work already started", 409, "APPOINTMENT_NOT_EDITABLE");
        const existing = await manager.getRepository(AppointmentTransferRequest).find({
            where: { appointment_id: appointmentId, from_staff_id: fromStaffId, status: TransferStatus.PENDING },
        });
        if (existing.some(row => row.expires_at > createdAt)) {
            throw new AppError("You already have a pending transfer", 409, "TRANSFER_ALREADY_PENDING");
        }
        if (existing.length) {
            await manager.getRepository(AppointmentTransferRequest)
                .update({ id: In(existing.map(row => row.id)) },
                    { status: TransferStatus.EXPIRED, decided_at: createdAt });
        }
        const target = await manager.getRepository(Staff).findOne({
            where: { user_id: toStaffId }, relations: { user: true },
        });
        if (!target || target.user.role !== UserRole.STAFF || target.branch_id !== appointment.branch_id) {
            throw new AppError("Select a staff member in this branch", 400, "BRANCH_MISMATCH");
        }
        if (appointment.staff_assignments.some(row => row.staff_id === toStaffId)) {
            throw new AppError("Staff already works on this group", 409, "STAFF_ALREADY_ASSIGNED");
        }
        const duration = appointment.appointment_services
            .filter(service => service.duration_minutes > 0)
            .reduce((sum, service) => sum + service.duration_minutes, 0);
        if (duration <= 0) throw new AppError("Invalid booked service duration", 409, "INVALID_APPOINTMENT_TIME");
        const reservedStart = new Date(Math.max(appointment.start_time.getTime(), createdAt.getTime()));
        const reservedEnd = new Date(reservedStart.getTime() + duration * 60_000);
        if (!isWithinStaffWorkingHours(target, getVietnamMinuteOfDay(reservedStart), getVietnamMinuteOfDay(reservedEnd))) {
            throw new AppError("Employee is outside working hours", 409, "SLOT_UNAVAILABLE");
        }

        const concurrent = await manager.getRepository(Appointment).createQueryBuilder("a")
            .innerJoinAndSelect("a.staff_assignments", "assigned",
                "assigned.staff_id = :staffId AND assigned.completed_at IS NULL", { staffId: toStaffId })
            .where("a.merged_into_id IS NULL")
            .andWhere("a.status IN (:...active)", { active: ACTIVE })
            .andWhere("a.start_time < :end AND a.end_time > :start", { start: reservedStart, end: reservedEnd })
            .getMany();
        // Compare only once on request creation. The pending hold protects the decision until acceptance.
        for (const other of concurrent) {
            if (other.id === appointment.id) continue;
            if (overlaps(reservedStart, reservedEnd, other.start_time, other.end_time) > MAX_OVERLAP_MS) {
                throw new AppError("Employee already has an overlapping booking", 409, "SLOT_UNAVAILABLE");
            }
        }
        const holds = await getActiveTransferHolds(manager, toStaffId, createdAt);
        for (const held of holds) {
            if (held.appointment_id === appointment.id) continue;
            if (overlaps(reservedStart, reservedEnd, held.reserved_start, held.reserved_end) > MAX_OVERLAP_MS) {
                throw new AppError("Employee has another reserved transfer", 409, "SLOT_UNAVAILABLE");
            }
        }
        const sender = await manager.getRepository(Staff).findOne({
            where: { user_id: fromStaffId }, relations: { user: true },
        });
        if (!sender) throw new AppError("Staff profile missing", 403, "FORBIDDEN");
        const request = manager.getRepository(AppointmentTransferRequest).create({
            id: randomUUID(), appointment_id: appointment.id,
            from_staff_id: fromStaffId, to_staff_id: toStaffId,
            from_staff_name: sender.user.full_name, to_staff_name: target.user.full_name,
            status: TransferStatus.PENDING,
            reserved_start: reservedStart, reserved_end: reservedEnd,
            scheduled_start: appointment.start_time, scheduled_end: appointment.end_time,
            created_at: createdAt, expires_at: new Date(createdAt.getTime() + TRANSFER_EXPIRY_MS),
            decided_at: null,
        });
        return manager.getRepository(AppointmentTransferRequest).save(request);
    });
}

export async function respondToTransfer(requestId: string, actorId: string, action: "accept" | "decline" | "cancel") {
    return AppDataSource.transaction("READ COMMITTED", async manager => {
        // Lock order must match transfer creation: appointment -> branch cursor -> request.
        // The final request-row lock ensures only one accept/decline/cancel wins.
        const requestRepo = manager.getRepository(AppointmentTransferRequest);
        const preview = await requestRepo.findOneBy({ id: requestId });
        if (!preview) throw new AppError("Transfer request not found", 404, "TRANSFER_NOT_FOUND");
        const appointment = await manager.getRepository(Appointment).findOne({
            where: { id: preview.appointment_id, merged_into_id: IsNull() },
            relations: { staff_assignments: true, appointment_services: true, actual_prices: true },
            lock: { mode: "pessimistic_write" },
        });
        if (appointment) await lockBranch(manager, appointment.branch_id);
        const request = await requestRepo.findOne({ where: { id: requestId }, lock: { mode: "pessimistic_write" } });
        if (!request) throw new AppError("Transfer request not found", 404, "TRANSFER_NOT_FOUND");
        if (action === "cancel" ? request.from_staff_id !== actorId : request.to_staff_id !== actorId) {
            throw new AppError("Not your transfer request", 403, "FORBIDDEN");
        }
        const now = new Date();
        if (request.status !== TransferStatus.PENDING || request.expires_at <= now) {
            if (request.status === TransferStatus.PENDING) {
                request.status = TransferStatus.EXPIRED;
                request.decided_at = now;
                await requestRepo.save(request);
            }
            throw new AppError("Transfer request expired or resolved", 409, "TRANSFER_NOT_PENDING");
        }
        if (action !== "accept") {
            request.status = action === "decline" ? TransferStatus.DECLINED : TransferStatus.CANCELED;
            request.decided_at = now;
            return requestRepo.save(request);
        }
        if (!appointment || !TRANSFERABLE.includes(appointment.status) ||
            appointment.start_time.getTime() !== request.scheduled_start.getTime() ||
            appointment.end_time.getTime() !== request.scheduled_end.getTime()) {
            throw new AppError("Booking changed; transfer invalid", 409, "TRANSFER_INVALIDATED");
        }
        const from = appointment.staff_assignments.find(row => row.staff_id === request.from_staff_id);
        if (!from || from.started_at || from.completed_at ||
            appointment.staff_assignments.some(row => row.staff_id === request.to_staff_id)) {
            throw new AppError("Work assignment changed", 409, "TRANSFER_INVALIDATED");
        }
        const target = await manager.getRepository(Staff).findOne({
            where: { user_id: actorId }, relations: { user: true },
        });
        if (!target || target.branch_id !== appointment.branch_id || target.user.role !== UserRole.STAFF) {
            throw new AppError("Receiving employee no longer eligible", 409, "TRANSFER_INVALIDATED");
        }
        // No second overlap check: the logical reservation created by requestTransfer is authoritative.
        const extraIds = appointment.appointment_services
            .filter(service => service.duration_minutes === 0 &&
                appointment.actual_prices.some(price => price.staff_id === from.staff_id && price.service_id === service.service_id))
            .map(service => service.service_id);
        const priceRepo = manager.getRepository(AppointmentActualPrice);
        await priceRepo.delete({ appointment_id: appointment.id, staff_id: from.staff_id });
        if (extraIds.length) {
            await manager.getRepository(AppointmentService).delete({
                appointment_id: appointment.id, service_id: In(extraIds),
            });
        }
        const fromLogicalTransfer = await manager.getRepository(AppointmentTransferRequest).exists({
            where: { appointment_id: appointment.id, to_staff_id: from.staff_id, status: TransferStatus.ACCEPTED },
        });
        const oldSlots: Date[] = [];
        for (let ms = appointment.start_time.getTime(); ms < appointment.end_time.getTime(); ms += SLOT_MS) oldSlots.push(new Date(ms));
        if (oldSlots.length && !fromLogicalTransfer) {
            await manager.getRepository(StaffBookingSlot).delete({ staff_id: from.staff_id, slot_start: In(oldSlots) });
        }
        await manager.getRepository(AppointmentStaffAssignment).delete({
            appointment_id: appointment.id, staff_id: from.staff_id,
        });
        await manager.getRepository(AppointmentStaffAssignment).insert({
            appointment_id: appointment.id, staff_id: target.user_id,
            staff_full_name: target.user.full_name, position: from.position,
            started_at: null, completed_at: null,
        });
        if (appointment.staff_id === from.staff_id) {
            appointment.staff_id = target.user_id;
            appointment.staff_full_name = target.user.full_name;
            await manager.getRepository(Appointment).save(appointment);
        }
        request.status = TransferStatus.ACCEPTED;
        request.decided_at = now;
        return requestRepo.save(request);
    });
}
