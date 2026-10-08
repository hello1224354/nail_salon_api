import { IsNull, Not } from "typeorm";
import { AppDataSource } from "../../config/database";
import { User, UserRole } from "../users/users.entity";
import { sendPlainTextEmail } from "../users/email.service";
import { buildNewBookingEmail, type NewBookingEmailData } from "./booking-notification.template";

/**
 * Called only after the booking transaction has committed.
 * Delivery is best-effort: email failures must not change a successful booking.
 */
export async function notifyAdminsOfNewBooking(booking: NewBookingEmailData): Promise<void> {
    const admins = await AppDataSource.getRepository(User).find({
        select: { id: true, email: true },
        where: {
            role: UserRole.ADMIN,
            email: Not(IsNull()),
        },
    });

    // An ADMIN's login email is the notification destination.
    const recipients = new Map<string, string>();
    for (const admin of admins) {
        const email = admin.email?.trim().toLowerCase();
        if (email) recipients.set(email, admin.id);
    }

    if (recipients.size === 0) {
        console.warn("New booking email skipped: no ADMIN has an email", {
            bookingGroupId: booking.bookingGroupId,
        });
        return;
    }

    const { subject, body } = buildNewBookingEmail(booking);
    const targets = Array.from(recipients);
    const results = await Promise.allSettled(
        targets.map(([email]) => sendPlainTextEmail(email, subject, body))
    );

    let failed = false;
    results.forEach((result, index) => {
        if (result.status === "rejected") {
            failed = true;
            console.error("Admin booking email delivery failed", {
                bookingGroupId: booking.bookingGroupId,
                adminId: targets[index][1],
                error: result.reason,
            });
        }
    });

    if (failed) throw new Error("At least one admin booking email failed");
}
