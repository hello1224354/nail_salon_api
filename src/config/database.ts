import { DataSource } from "typeorm";
import { Service } from "../modules/services/service.entity";
import { ServiceCategory } from "../modules/services/service-category.entity";
import { WebsiteVisit } from "../modules/traffic/website-visit.entity";
import { Staff } from "../modules/staffs/staffs.entity";
import { Appointment } from "../modules/appointments/appointments.entity";
import { User } from "../modules/users/users.entity";
import { env } from "./env";
import { AppointmentService } from "../modules/appointments/appointment-services.entity";
import { Branch } from "../modules/branches/branches.entity";
import { StaffBookingSlot } from "../modules/appointments/staff-booking-slots.entity";
import { AppointmentStaffAssignment } from "../modules/appointments/appointment-staff-assignment.entity";
import { AuditLog } from "../modules/audit/audit-log.entity";
import { Offer } from "../modules/offers/offer.entity";
import { RefreshSession } from "../modules/users/refresh-session.entity";
import { PasswordResetChallenge } from "../modules/users/password-reset-challenge.entity";
import { LoginMfaChallenge } from "../modules/users/login-mfa-challenge.entity";
import { TrustedLoginDevice } from "../modules/users/trusted-login-device.entity";
import { RegistrationEmailChallenge } from "../modules/users/registration-email-challenge.entity";
import { PasswordChangeChallenge } from "../modules/users/password-change-challenge.entity";
import { SalonContent } from "../modules/site-content/salon-content.entity";
import { InstagramTrendItem } from "../modules/site-content/instagram-trend-item.entity";
import { CustomerReview } from "../modules/site-content/customer-review.entity";
import { MediaFile } from "../modules/media/media-file.entity";
import { WalkInVisit } from "../modules/walk-ins/walk-in-visit.entity";
import { WalkInVisitService } from "../modules/walk-ins/walk-in-visit-service.entity";
import { AppointmentActualPrice } from "../modules/appointments/appointment-actual-price.entity";
import { NotificationOutbox } from "../modules/appointments/notification-outbox.entity";
import { StaffAssignmentRotation } from "../modules/appointments/staff-assignment-rotation.entity";
import { AppointmentTransferRequest } from "../modules/appointments/appointment-transfer-request.entity";

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
        ServiceCategory,
        WebsiteVisit,
        Staff,
        Appointment,
        AppointmentService,
        User,
        Branch,
        StaffBookingSlot,
        AppointmentStaffAssignment,
        AuditLog,
        Offer,
        RefreshSession,
        PasswordResetChallenge,
        LoginMfaChallenge,
        TrustedLoginDevice,
        RegistrationEmailChallenge,
        PasswordChangeChallenge,
        SalonContent,
        InstagramTrendItem,
        CustomerReview,
        MediaFile,
        WalkInVisit,
        WalkInVisitService,
        AppointmentActualPrice,
        NotificationOutbox,
        StaffAssignmentRotation,
        AppointmentTransferRequest,
    ],
    migrations: [__dirname + "/../migrations/**/*{.js,.ts}"],
    timezone: "Z",
});