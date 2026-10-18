import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

export enum TransferStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    DECLINED = "declined",
    CANCELED = "canceled",
    EXPIRED = "expired",
}

@Entity("appointment_transfer_requests")
@Index("IDX_transfer_target_status_expiry", ["to_staff_id", "status", "expires_at"])
@Index("IDX_transfer_appointment_status", ["appointment_id", "status"])
export class AppointmentTransferRequest {
    @PrimaryColumn({ type: "varchar", length: 36 })
    id: string;

    @Column({ type: "varchar", length: 36 })
    appointment_id: string;

    @Column({ type: "varchar", length: 36 })
    from_staff_id: string;

    @Column({ type: "varchar", length: 36 })
    to_staff_id: string;

    @Column({ type: "varchar", length: 255 })
    from_staff_name: string;

    @Column({ type: "varchar", length: 255 })
    to_staff_name: string;

    @Column({ type: "enum", enum: TransferStatus })
    status: TransferStatus;

    @Column({ type: "datetime", precision: 3 })
    reserved_start: Date;

    @Column({ type: "datetime", precision: 3 })
    reserved_end: Date;

    @Column({ type: "datetime", precision: 3 })
    scheduled_start: Date;

    @Column({ type: "datetime", precision: 3 })
    scheduled_end: Date;

    @Column({ type: "datetime", precision: 3 })
    expires_at: Date;

    @Column({ type: "datetime", precision: 3, nullable: true })
    decided_at: Date | null;

    @CreateDateColumn({ type: "datetime", precision: 3 })
    created_at: Date;
}
