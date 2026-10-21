import { randomUUID } from "crypto";
import { In, IsNull } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { isUuid } from "../../common/validators";
import { Appointment, AppointmentStatus } from "./appointments.entity";
import { AppointmentService } from "./appointment-services.entity";
import { AppointmentActualPrice } from "./appointment-actual-price.entity";
import { ownedBookedServiceIds } from "./booking-service-ownership";

type PriceInput = { service_id: string; actual_price: number | null };
type ExtraInput = { name: string; price: number };

const validPrice = (value: unknown): value is number =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;

export function parseWorkPrices(body: unknown): { prices: PriceInput[]; extras: ExtraInput[] } {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Invalid work prices", 400, "VALIDATION_ERROR");
    }
    const data = body as Record<string, unknown>;
    if (!Array.isArray(data.prices) || !Array.isArray(data.extras) || data.prices.length > 40 || data.extras.length > 40) {
        throw new AppError("Invalid work price lines", 400, "VALIDATION_ERROR");
    }
    const prices = data.prices.map(row => {
        if (!row || typeof row !== "object" || Array.isArray(row)) throw new AppError("Invalid price line", 400, "VALIDATION_ERROR");
        const r = row as Record<string, unknown>;
        if (!isUuid(r.service_id) ||
            (r.actual_price !== null && !validPrice(r.actual_price))) {
            throw new AppError("Invalid service or actual price", 400, "VALIDATION_ERROR");
        }
        return { service_id: r.service_id, actual_price: r.actual_price as number | null };
    });
    if (new Set(prices.map(row => row.service_id)).size !== prices.length) {
        throw new AppError("Duplicate service", 400, "VALIDATION_ERROR");
    }
    const extras = data.extras.map(row => {
        if (!row || typeof row !== "object" || Array.isArray(row)) throw new AppError("Invalid additional service", 400, "VALIDATION_ERROR");
        const r = row as Record<string, unknown>;
        if (typeof r.name !== "string" || !r.name.trim() || r.name.trim().length > 255 || !validPrice(r.price)) {
            throw new AppError("Additional service requires a name and price", 400, "VALIDATION_ERROR");
        }
        return { name: r.name.trim(), price: r.price };
    });
    return { prices, extras };
}

/** Additional work uses existing snapshots, without a new services table or schema.
 * duration_minutes=0 identifies a custom line, and its staff owner is the actual-price row.
 */
export async function saveWorkPrices(appointmentId: string, staffId: string, input: ReturnType<typeof parseWorkPrices>) {
    return AppDataSource.transaction(async manager => {
        const appointment = await manager.getRepository(Appointment).findOne({
            where: { id: appointmentId, merged_into_id: IsNull() },
            relations: { appointment_services: true, staff_assignments: true, actual_prices: true },
            lock: { mode: "pessimistic_write" },
        });
        if (!appointment) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
        const mine = appointment.staff_assignments.find(row => row.staff_id === staffId);
        if (!mine) throw new AppError("Not assigned to this booking", 403, "FORBIDDEN");
        if (mine.completed_at || ![AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS, AppointmentStatus.NO_SHOW].includes(appointment.status)) {
            throw new AppError("Work is no longer editable", 409, "APPOINTMENT_NOT_EDITABLE");
        }
        const eligible = new Set(ownedBookedServiceIds(
            appointment.appointment_services.filter(row => row.duration_minutes > 0).map(row => row.service_id),
            appointment.staff_assignments, staffId
        ));
        const originals = appointment.appointment_services.filter(row => row.duration_minutes > 0 && eligible.has(row.service_id));
        const baseIds = new Set(originals.map(row => row.service_id));
        if (input.prices.some(row => !baseIds.has(row.service_id))) {
            throw new AppError("Unknown booked service", 400, "SERVICE_NOT_FOUND");
        }
        if (mine.assisted_service_id && input.extras.length) {
            throw new AppError("Helpers cannot add unassigned services", 403, "FORBIDDEN");
        }
        const specified = new Map(input.prices.map(row => [row.service_id, row.actual_price]));
        const actualRepo = manager.getRepository(AppointmentActualPrice);
        const serviceRepo = manager.getRepository(AppointmentService);
        // Only delete custom work owned by this staff. Other group members are untouched.
        const existingExtraIds = appointment.appointment_services
            .filter(row => row.duration_minutes === 0 &&
                appointment.actual_prices.some(price => price.staff_id === staffId && price.service_id === row.service_id))
            .map(row => row.service_id);
        if (existingExtraIds.length) {
            await actualRepo.delete({ appointment_id: appointment.id, staff_id: staffId, service_id: In(existingExtraIds) });
            await serviceRepo.delete({ appointment_id: appointment.id, service_id: In(existingExtraIds) });
        }
        const baseRows = originals.map(service => ({
            appointment_id: appointment.id,
            staff_id: staffId,
            service_id: service.service_id,
            actual_price: specified.get(service.service_id) ?? service.price,
        }));
        await actualRepo.save(baseRows);
        for (const extra of input.extras) {
            const serviceId = randomUUID();
            await serviceRepo.save(serviceRepo.create({
                appointment_id: appointment.id, service_id: serviceId,
                service_name: extra.name, price: 0, duration_minutes: 0,
            }));
            await actualRepo.save(actualRepo.create({
                appointment_id: appointment.id, staff_id: staffId,
                service_id: serviceId, actual_price: extra.price,
            }));
        }
        return {
            base: baseRows,
            extras: input.extras,
            total: baseRows.reduce((sum, row) => sum + row.actual_price, 0) +
                input.extras.reduce((sum, row) => sum + row.price, 0),
        };
    });
}

/** Filling missing prices on completion avoids counting absent entries as zero revenue. */
export async function fillUnenteredReferencePrices(
    manager: import("typeorm").EntityManager,
    appointment: Appointment,
    staffId: string,
): Promise<void> {
    const priceRepo = manager.getRepository(AppointmentActualPrice);
    const existing = await priceRepo.findBy({ appointment_id: appointment.id, staff_id: staffId });
    const known = new Set(existing.map(item => item.service_id));
    const eligible = new Set(ownedBookedServiceIds(
        appointment.appointment_services.filter(service => service.duration_minutes > 0).map(service => service.service_id),
        appointment.staff_assignments, staffId
    ));
    const missing = appointment.appointment_services
        .filter(service => service.duration_minutes > 0 && eligible.has(service.service_id) && !known.has(service.service_id))
        .map(service => priceRepo.create({
            appointment_id: appointment.id, staff_id: staffId,
            service_id: service.service_id, actual_price: service.price,
        }));
    if (missing.length) await priceRepo.save(missing);
}
