import { DataSource } from "typeorm";
import { Service } from "../modules/services/service.entity";
import { Staff } from "../modules/staffs/staffs.entity";
import { Appointment } from "../modules/appointments/appointments.entity";
import { User } from "../modules/users/users.entity";
import { env } from "./env";
import { AppointmentService } from "../modules/appointments/appointment-services.entity";
import { Branch } from "../modules/branches/branches.entity";
import { StaffBookingSlot } from "../modules/appointments/staff-booking-slots.entity";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: env.DB_SYNCHRONIZE,
    logging: env.DB_LOGGING,
    entities: [Service, Staff, Appointment, AppointmentService, User, Branch, StaffBookingSlot],
    timezone: "Z",
});