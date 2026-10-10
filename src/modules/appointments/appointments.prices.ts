import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { IsNull } from "typeorm";
import { Appointment, AppointmentStatus } from "./appointments.entity";
import { AppointmentActualPrice } from "./appointment-actual-price.entity";

/** Staff identity is always taken from the authenticated request, never client input. */
export async function setActualPriceForStaff(appointmentId: string, serviceId: string, staffId: string, actualPrice: number) {
    return AppDataSource.transaction(async manager => {
        const appointment = await manager.getRepository(Appointment).findOne({
            where: { id: appointmentId, merged_into_id: IsNull() },
            relations: { staff_assignments: true, appointment_services: true },
            lock: { mode: "pessimistic_write" },
        });
        if (!appointment) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
        if (!appointment.staff_assignments.some(assigned => assigned.staff_id === staffId)) {
            throw new AppError("You are not assigned to this appointment", 403, "FORBIDDEN");
        }
        if (![AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS].includes(appointment.status)) {
            throw new AppError("Only confirmed or active appointments can be priced", 409, "APPOINTMENT_NOT_EDITABLE");
        }
        if (!appointment.appointment_services.some(service => service.service_id === serviceId)) {
            throw new AppError("Service not found on this appointment", 404, "SERVICE_NOT_FOUND");
        }
        const prices = manager.getRepository(AppointmentActualPrice);
        let price = await prices.findOneBy({ appointment_id: appointmentId, service_id: serviceId, staff_id: staffId });
        if (!price) price = prices.create({ appointment_id: appointmentId, staff_id: staffId, service_id: serviceId });
        price.actual_price = actualPrice;
        return prices.save(price);
    });
}
