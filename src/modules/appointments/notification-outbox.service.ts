import { randomUUID } from "crypto";
import { EntityManager, IsNull, Not } from "typeorm";
import { AppDataSource } from "../../config/database";
import { User, UserRole } from "../users/users.entity";
import { sendPlainTextEmail } from "../users/email.service";
import { buildNewBookingEmail, type NewBookingEmailData } from "./booking-notification.template";
import { NotificationOutbox } from "./notification-outbox.entity";

/** Persist one message per ADMIN recipient within the booking transaction. */
export async function enqueueBookingEmails(manager: EntityManager, booking: NewBookingEmailData) {
    const admins = await manager.getRepository(User).find({
        where: { role: UserRole.ADMIN, email: Not(IsNull()) },
        select: { email: true },
    });
    const recipients = [...new Set(admins.map(user => user.email?.trim().toLowerCase()).filter((email): email is string => !!email))];
    if (recipients.length === 0) {
        console.warn("Booking notification has no admin recipient", { bookingGroupId: booking.bookingGroupId });
        return;
    }

    const email = buildNewBookingEmail(booking);
    await manager.getRepository(NotificationOutbox).insert(recipients.map(recipient => ({
        id: randomUUID(),
        booking_group_id: booking.bookingGroupId,
        recipient,
        subject: email.subject,
        body: email.body,
        status: "pending",
        attempts: 0,
        next_attempt_at: new Date(),
        claimed_at: null,
        sent_at: null,
        last_error: null,
    })));
}

let draining = false;

/** At-least-once delivery; claims are atomic across parallel API workers. */
export async function drainBookingNotificationOutbox(): Promise<void> {
    if (draining || !AppDataSource.isInitialized) return;
    draining = true;
    try {
        const repo = AppDataSource.getRepository(NotificationOutbox);
        const now = new Date();
        const stale = new Date(now.getTime() - 5 * 60_000);
        const candidates = await repo.createQueryBuilder("message")
            .where("(message.status = :pending AND message.next_attempt_at <= :now)", { pending: "pending", now })
            .orWhere("(message.status = :processing AND message.claimed_at < :stale)", { processing: "processing", stale })
            .orderBy("message.created_at", "ASC")
            .limit(20)
            .getMany();

        for (const item of candidates) {
            const claimed = await repo.createQueryBuilder()
                .update(NotificationOutbox)
                .set({ status: "processing", claimed_at: new Date() })
                .where("id = :id", { id: item.id })
                .andWhere("((status = :pending AND next_attempt_at <= :now) OR (status = :processing AND claimed_at < :stale))", {
                    pending: "pending", processing: "processing", now: new Date(), stale,
                })
                .execute();
            if (claimed.affected !== 1) continue;

            try {
                await sendPlainTextEmail(item.recipient, item.subject, item.body);
                await repo.update({ id: item.id }, {
                    status: "sent",
                    sent_at: new Date(),
                    last_error: null,
                    claimed_at: null,
                });
            } catch (error) {
                const attempts = item.attempts + 1;
                const delayMs = Math.min(3_600_000, Math.pow(2, Math.min(attempts, 10)) * 30_000);
                await repo.update({ id: item.id }, {
                    status: "pending",
                    attempts,
                    next_attempt_at: new Date(Date.now() + delayMs),
                    claimed_at: null,
                    last_error: error instanceof Error ? error.message.slice(0, 500) : "Unknown delivery failure",
                });
                console.error("Booking notification queued for retry", {
                    bookingGroupId: item.booking_group_id,
                    attempt: attempts,
                });
            }
        }
    } finally {
        draining = false;
    }
}

export function startBookingNotificationWorker(): () => void {
    const run = () => {
        void drainBookingNotificationOutbox().catch(error => {
            console.error("Booking outbox worker failed", error);
        });
    };
    run();
    const timer = setInterval(run, 60_000);
    timer.unref();
    return () => clearInterval(timer);
}
