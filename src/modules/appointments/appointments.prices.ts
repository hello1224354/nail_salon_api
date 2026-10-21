import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { IsNull } from "typeorm";
import { Appointment, AppointmentStatus } from "./appointments.entity";
import { AppointmentActualPrice } from "./appointment-actual-price.entity";
import { ownedBookedServiceIds } from "./booking-service-ownership";

/** Staff identity is always taken from the authenticated request, never client input. */
export async function setActualPriceForStaff(appointmentId: string, serviceId: string, staffId: string, actualPrice: number) {
    return AppDataSource.transaction(async manager => {
        const appointment = await manager.getRepository(Appointment).findOne({
            where: { id: appointmentId, merged_into_id: IsNull() },
            relations: { staff_assignments: true, appointment_services: true },
            lock: { mode: "pessimistic_write" },
        });
        if (!appointment) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
        const myAssignment = appointment.staff_assignments.find(assigned => assigned.staff_id === staffId);
        if (!myAssignment) {
            throw new AppError("You are not assigned to this appointment", 403, "FORBIDDEN");
        }
        if (myAssignment.completed_at !== null) {
            throw new AppError("This employee has already completed their work", 409, "STAFF_ALREADY_COMPLETED");
        }
        if (![AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS, AppointmentStatus.NO_SHOW].includes(appointment.status)) {
            throw new AppError("Only confirmed or active appointments can be priced", 409, "APPOINTMENT_NOT_EDITABLE");
        }
        const booked = appointment.appointment_services.filter(service => service.duration_minutes > 0);
        if (!ownedBookedServiceIds(booked.map(service => service.service_id), appointment.staff_assignments, staffId).includes(serviceId)) {
            throw new AppError("Service is not assigned to this worker", 403, "FORBIDDEN");
        }
        const prices = manager.getRepository(AppointmentActualPrice);
        let price = await prices.findOneBy({ appointment_id: appointmentId, service_id: serviceId, staff_id: staffId });
        if (!price) price = prices.create({ appointment_id: appointmentId, staff_id: staffId, service_id: serviceId });
        price.actual_price = actualPrice;
        return prices.save(price);
    });
}
