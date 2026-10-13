import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("notification_outbox")
@Index("UQ_notification_booking_recipient", ["booking_group_id", "recipient"], { unique: true })
export class NotificationOutbox {
    @PrimaryColumn({ type: "varchar", length: 36 })
    id: string;

    @Column({ type: "varchar", length: 36 })
    booking_group_id: string;

    @Column({ type: "varchar", length: 255 })
    recipient: string;

    @Column({ type: "varchar", length: 255 })
    subject: string;

    @Column({ type: "text" })
    body: string;

    @Column({ type: "varchar", length: 16, default: "pending" })
    status: string;

    @Column({ type: "int", default: 0 })
    attempts: number;

    @Column({ type: "datetime", precision: 3 })
    next_attempt_at: Date;

    @Column({ type: "datetime", precision: 3, nullable: true })
    claimed_at: Date | null;

    @Column({ type: "datetime", precision: 3, nullable: true })
    sent_at: Date | null;

    @Column({ type: "varchar", length: 500, nullable: true })
    last_error: string | null;

    @CreateDateColumn()
    created_at: Date;
}
