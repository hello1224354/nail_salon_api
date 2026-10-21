import { In, IsNull, QueryFailedError } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { UserRole } from "../users/users.entity";
import { Staff } from "../staffs/staffs.entity";
import { isWithinStaffWorkingHours } from "../staffs/staff-working-hours";
import { Appointment, AppointmentStatus } from "./appointments.entity";
import { AppointmentStaffAssignment } from "./appointment-staff-assignment.entity";
import { AppointmentActualPrice } from "./appointment-actual-price.entity";
import { StaffBookingSlot } from "./staff-booking-slots.entity";
import { StaffAssignmentRotation } from "./staff-assignment-rotation.entity";
import { getVietnamMinuteOfDay } from "./booking-time";
import { hasHeldTransferOverlap } from "./appointment-transfers.service";

const SLOT_MS = 15 * 60_000;

/** Realtime, optional one-service assistance. The primary guest worker keeps
 * their original full-length reservation. A helper takes only a free interval
 * and owns the delegated service's price and completion.
 *
 * Existing party-size allocation is not modified: extra workers never replace
 * or count as one of the group's primary positions.
 */
export async function assignAvailableServiceHelper(
    appointmentId: string, actorStaffId: string, serviceId: string,
): Promise<{ staff_id: string; staff_full_name: string; service_id: string }> {
    return AppDataSource.transaction("READ COMMITTED", async manager => {
        const appointments = manager.getRepository(Appointment);
        const appointment = await appointments.findOne({
            where: { id: appointmentId, merged_into_id: IsNull() },
            relations: { staff_assignments: true, appointment_services: true },
            lock: { mode: "pessimistic_write" },
        });
        if (!appointment) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
        if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
            throw new AppError("Start the guest's work before assigning an assistant", 409, "APPOINTMENT_NOT_EDITABLE");
        }
        const primary = appointment.staff_assignments.find(row =>
            row.staff_id === actorStaffId && !row.assisted_service_id);
        if (!primary || !primary.started_at || primary.completed_at) {
            throw new AppError("Only the guest's active primary worker can share a service", 403, "FORBIDDEN");
        }
        const booked = appointment.appointment_services.filter(row => row.duration_minutes > 0);
        if (booked.length < 2) {
            throw new AppError("Service assistance requires at least two booked services", 409, "SERVICE_MISMATCH");
        }
        const service = booked.find(row => row.service_id === serviceId);
        if (!service || service.duration_minutes <= 0) {
            throw new AppError("Select one booked service to delegate", 400, "SERVICE_NOT_FOUND");
        }
        if (appointment.staff_assignments.some(row =>
            row.position === primary.position && row.assisted_service_id)) {
            throw new AppError("This guest already has an assisting worker", 409, "STAFF_ALREADY_ASSIGNED");
        }

        // Serialize with ordinary bookings, reassignment and other assistance.
        const rotations = manager.getRepository(StaffAssignmentRotation);
        await rotations.createQueryBuilder().insert()
            .values({ branch_id: appointment.branch_id, last_staff_id: null }).orIgnore().execute();
        const rotation = await rotations.findOne({
            where: { branch_id: appointment.branch_id }, lock: { mode: "pessimistic_write" },
        });
        if (!rotation) throw new Error("Cannot lock staff allocation cursor");

        const now = Date.now();
        const begin = Math.floor(now / SLOT_MS) * SLOT_MS;
        const finish = Math.ceil((now + service.duration_minutes * 60_000) / SLOT_MS) * SLOT_MS;
        const reservedStart = new Date(begin);
        const reservedEnd = new Date(finish);
        if (finish <= begin) throw new AppError("Invalid service duration", 409, "INVALID_APPOINTMENT_TIME");

        const staff = await manager.getRepository(Staff).find({
            where: { branch_id: appointment.branch_id }, relations: { user: true },
        });
        const engaged = new Set(appointment.staff_assignments.map(row => row.staff_id));
        const candidates = staff.filter(row => row.user.role === UserRole.STAFF && !engaged.has(row.user_id))
            .sort((a, b) => a.user_id.localeCompare(b.user_id));
        // Rotate ties so the same helper is not selected repeatedly.
        const cursor = candidates.findIndex(row => row.user_id === rotation.last_staff_id);
        const ordered = cursor < 0 ? candidates : [...candidates.slice(cursor + 1), ...candidates.slice(0, cursor + 1)];
        const staffSlots = manager.getRepository(StaffBookingSlot);
        let selected: (typeof candidates)[number] | undefined;
        for (const candidate of ordered) {
            if (!isWithinStaffWorkingHours(candidate,
                getVietnamMinuteOfDay(reservedStart), getVietnamMinuteOfDay(reservedEnd))) continue;
            if (await hasHeldTransferOverlap(manager, candidate.user_id, reservedStart, reservedEnd)) continue;
            const starts: Date[] = [];
            for (let ms = begin; ms < finish; ms += SLOT_MS) starts.push(new Date(ms));
            const occupied = await staffSlots.find({
                where: { staff_id: candidate.user_id, slot_start: In(starts) },
            });
            if (occupied.length) continue;
            try {
                await staffSlots.insert(starts.map(slot_start => ({
                    staff_id: candidate.user_id, slot_start,
                })));
                selected = candidate;
                break;
            } catch (error) {
                // A duplicate slot means the employee was booked concurrently.
                // Do not leak a partial reservation into a different candidate.
                if (error instanceof QueryFailedError &&
                    (error.driverError as { code?: string }).code === "ER_DUP_ENTRY") {
                    throw new AppError("Staff capacity changed; retry assistance", 409, "SLOT_UNAVAILABLE");
                }
                throw error;
            }
        }
        if (!selected) {
            throw new AppError("No additional staff available for this service", 409, "SLOT_UNAVAILABLE");
        }

        await manager.getRepository(AppointmentStaffAssignment).save({
            appointment_id: appointment.id,
            staff_id: selected.user_id,
            staff_full_name: selected.user.full_name,
            position: primary.position,
            assisted_service_id: serviceId,
            reserved_start: reservedStart,
            reserved_end: reservedEnd,
            started_at: null,
            completed_at: null,
        });

        // If the primary already saved a manual override, transfer its owner
        // rather than charging this service twice. Otherwise helper defaults to
        // the immutable booked reference when they complete.
        const prices = manager.getRepository(AppointmentActualPrice);
        const previous = await prices.findOneBy({
            appointment_id: appointment.id,
            staff_id: primary.staff_id,
            service_id: serviceId,
        });
        if (previous) {
            await prices.delete({
                appointment_id: appointment.id,
                staff_id: primary.staff_id,
                service_id: serviceId,
            });
            await prices.save({
                appointment_id: appointment.id,
                staff_id: selected.user_id,
                service_id: serviceId,
                actual_price: previous.actual_price,
            });
        }
        rotation.last_staff_id = selected.user_id;
        await rotations.save(rotation);
        return { staff_id: selected.user_id, staff_full_name: selected.user.full_name, service_id: serviceId };
    });
}

/** Undo an accidentally requested assist before the helper begins work. */
export async function cancelServiceHelper(
    appointmentId: string, actorStaffId: string, helperStaffId: string,
): Promise<void> {
    await AppDataSource.transaction("READ COMMITTED", async manager => {
        const appointment = await manager.getRepository(Appointment).findOne({
            where: { id: appointmentId, merged_into_id: IsNull() },
            relations: { staff_assignments: true }, lock: { mode: "pessimistic_write" },
        });
        if (!appointment || appointment.status !== AppointmentStatus.IN_PROGRESS) {
            throw new AppError("Booking not active", 409, "APPOINTMENT_NOT_EDITABLE");
        }
        const helper = appointment.staff_assignments.find(row =>
            row.staff_id === helperStaffId && row.assisted_service_id);
        if (!helper || helper.started_at || helper.completed_at || !helper.reserved_start || !helper.reserved_end) {
            throw new AppError("Helper work has started or is not assigned", 409, "APPOINTMENT_NOT_EDITABLE");
        }
        const owner = appointment.staff_assignments.find(row =>
            row.staff_id === actorStaffId && !row.assisted_service_id &&
            row.position === helper.position && !row.completed_at);
        if (!owner) throw new AppError("Only this guest's active primary worker may cancel assistance", 403, "FORBIDDEN");

        const prices = manager.getRepository(AppointmentActualPrice);
        const price = await prices.findOneBy({
            appointment_id: appointment.id, staff_id: helper.staff_id, service_id: helper.assisted_service_id!,
        });
        if (price) {
            await prices.delete({ appointment_id: appointment.id, staff_id: helper.staff_id, service_id: helper.assisted_service_id! });
            await prices.save({
                appointment_id: appointment.id, staff_id: owner.staff_id,
                service_id: helper.assisted_service_id!, actual_price: price.actual_price,
            });
        }
        await manager.getRepository(AppointmentStaffAssignment).delete({
            appointment_id: appointment.id, staff_id: helper.staff_id,
        });
        const starts: Date[] = [];
        for (let ms = helper.reserved_start.getTime(); ms < helper.reserved_end.getTime(); ms += SLOT_MS) {
            starts.push(new Date(ms));
        }
        if (starts.length) {
            await manager.getRepository(StaffBookingSlot).delete({
                staff_id: helper.staff_id, slot_start: In(starts),
            });
        }
    });
}
