import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { Appointment } from "./appointments.entity";
import { Staff } from "../staffs/staffs.entity";

/** STAFF receptionist lookup is read-only, scoped to their own branch.
 * Does not give the receptionist ownership or permission to begin another worker's job.
 */
export async function lookupBookingForReception(actorId: string, raw: unknown, admin = false) {
    if (typeof raw !== "string" || raw.length > 32) {
        throw new AppError("Enter booking code or phone number", 400, "VALIDATION_ERROR");
    }
    const query = raw.trim();
    const code = /^[0-9a-fA-F]{8}$/.test(query) ? query.toLowerCase() : null;
    const cleaned = query.replace(/[\s.()-]/g, "");
    const phone = /^0\d{9}$/.test(cleaned) ? "+84" + cleaned.slice(1) :
        /^\+84\d{9}$/.test(cleaned) ? cleaned : null;
    if (!code && !phone) throw new AppError("Enter full 8-character booking code or valid phone number", 400, "VALIDATION_ERROR");
    const staff = admin ? null : await AppDataSource.getRepository(Staff).findOneBy({ user_id: actorId });
    if (!admin && !staff) throw new AppError("Staff profile not found", 403, "FORBIDDEN");
    const qb = AppDataSource.getRepository(Appointment).createQueryBuilder("a")
        .leftJoinAndSelect("a.staff_assignments", "assignment")
        .leftJoinAndSelect("a.appointment_services", "service")
        .where("a.merged_into_id IS NULL");
    if (staff) qb.andWhere("a.branch_id = :branchId", { branchId: staff.branch_id });
    if (code) {
        qb.andWhere("(a.booking_group_id LIKE :reference OR (a.booking_group_id IS NULL AND a.id LIKE :reference))",
            { reference: code + "%" });
    } else {
        qb.andWhere("a.customer_phone = :phone", { phone });
    }
    const matches = await qb.orderBy("a.start_time", "DESC").take(10).getMany();
    return matches.map(booking => ({
        id: booking.id,
        booking_code: (booking.booking_group_id || booking.id).slice(0, 8).toUpperCase(),
        customer_name: booking.customer_full_name,
        party_size: booking.party_size,
        start_time: booking.start_time,
        status: booking.status,
        staff: [...(booking.staff_assignments ?? [])]
            .sort((a, b) => a.position - b.position)
            .map(row => ({ id: row.staff_id, full_name: row.staff_full_name, position: row.position })),
        services: (booking.appointment_services ?? [])
            .filter(row => row.duration_minutes > 0).map(row => row.service_name),
    }));
}
