import { DataSource } from "typeorm";
import { Service } from "../modules/services/service.entity";
import { Staff } from "../modules/staffs/staffs.entity";
import { Appointment } from "../modules/appointments/appointments.entity";
import { User } from "../modules/users/users.entity";
import { env } from "./env";
import { AppointmentService } from "../modules/appointments/appointment-services.entity";
import { Branch } from "../modules/branches/branches.entity";
import { StaffBookingSlot } from "../modules/appointments/staff-booking-slots.entity";
import { AuditLog } from "../modules/audit/audit-log.entity";
import { Offer } from "../modules/offers/offer.entity";
import { RefreshSession } from "../modules/users/refresh-session.entity";
import { PasswordResetChallenge } from "../modules/users/password-reset-challenge.entity";
import { LoginMfaChallenge } from "../modules/users/login-mfa-challenge.entity";
import { SalonContent } from "../modules/site-content/salon-content.entity";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: env.DB_SYNCHRONIZE,
    logging: env.DB_LOGGING,
    entities: [
        Service,
        Staff,
        Appointment,
        AppointmentService,
        User,
        Branch,
        StaffBookingSlot,
        AuditLog,
        Offer,
        RefreshSession,
        PasswordResetChallenge,
        LoginMfaChallenge,
        SalonContent,
    ],
    migrations: [__dirname + "/../migrations/**/*{.js,.ts}"],
    timezone: "Z",
});