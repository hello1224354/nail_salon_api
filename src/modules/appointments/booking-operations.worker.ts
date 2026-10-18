import { In, IsNull, LessThanOrEqual } from "typeorm";
import { AppDataSource } from "../../config/database";
import { Appointment, AppointmentStatus } from "./appointments.entity";
import { AppointmentStaffAssignment } from "./appointment-staff-assignment.entity";
import { AppointmentTransferRequest, TransferStatus } from "./appointment-transfer-request.entity";
import { StaffBookingSlot } from "./staff-booking-slots.entity";
import { expireTransferRequests } from "./appointment-transfers.service";

const SLOT_MS = 15 * 60 * 1000;
const GRACE_MS = 15 * 60 * 1000;

/** Reconcile overdue appointments server-side, independent of open browser tabs.
 * Each booking is locked when changing its state; repeated runs are idempotent.
 */
export async function reconcileNoShows(): Promise<void> {
    const now = new Date();
    const deadline = new Date(now.getTime() - GRACE_MS);
    const expired = await AppDataSource.getRepository(Appointment).find({
        where: {
            status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            merged_into_id: IsNull(),
            start_time: LessThanOrEqual(deadline),
        },
        order: { start_time: "ASC" },
        take: 100,
    });
    for (const due of expired) {
        await AppDataSource.transaction(async manager => {
            const repo = manager.getRepository(Appointment);
            const appt = await repo.findOne({
                where: { id: due.id, merged_into_id: IsNull() },
                relations: { staff_assignments: true },
                lock: { mode: "pessimistic_write" },
            });
            if (!appt || ![AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(appt.status) ||
                appt.start_time.getTime() + GRACE_MS > Date.now()) return;
            const transfers = await manager.getRepository(AppointmentTransferRequest).find({
                where: { appointment_id: appt.id, status: TransferStatus.ACCEPTED },
            });
            const logicalWorkers = new Set(transfers.map(row => row.to_staff_id));
            const slotStarts: Date[] = [];
            for (let ms = appt.start_time.getTime(); ms < appt.end_time.getTime(); ms += SLOT_MS) {
                slotStarts.push(new Date(ms));
            }
            for (const assigned of appt.staff_assignments) {
                // Transferred staff hold logical reservations, not physical slots.
                // Never delete physical slots belonging to their unrelated booking.
                if (logicalWorkers.has(assigned.staff_id) || slotStarts.length === 0) continue;
                await manager.getRepository(StaffBookingSlot).delete({
                    staff_id: assigned.staff_id, slot_start: In(slotStarts),
                });
            }
            appt.status = AppointmentStatus.NO_SHOW;
            await repo.save(appt);
        });
    }
}

export function startBookingOperationsWorker(): () => void {
    let running = false;
    const tick = async () => {
        if (running) return;
        running = true;
        try {
            await expireTransferRequests();
            await reconcileNoShows();
        } catch (error) {
            console.error("Booking operations worker failed", error);
        } finally {
            running = false;
        }
    };
    void tick();
    const timer = setInterval(() => void tick(), 30_000);
    return () => clearInterval(timer);
}
