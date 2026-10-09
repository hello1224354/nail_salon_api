import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm";
import { AppointmentService } from "./appointment-services.entity";
import { AppointmentStaffAssignment } from "./appointment-staff-assignment.entity";

export enum AppointmentStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}

@Index("IDX_appointments_user_start", ["user_id", "start_time"])
@Index("IDX_appointments_staff_start", ["staff_id", "start_time"])
@Index("IDX_appointments_booking_group", ["booking_group_id"])
@Entity("appointments")
export class Appointment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    user_id: string;

    @Column({ type: "uuid", nullable: true })
    booking_group_id: string | null;

    @Column({ type: "int", default: 1 })
    party_size: number;

    @Column({ type: "varchar", length: 36, nullable: true })
    merged_into_id: string | null;

    @OneToMany(() => AppointmentStaffAssignment, assignment => assignment.appointment)
    staff_assignments: AppointmentStaffAssignment[];

    @Column({ type: "varchar" })
    customer_full_name: string;

    @Column({ type: "varchar" })
    customer_phone: string;

    @Column({ type: "varchar", nullable: true })
    customer_email: string | null;

    @Column({ type: "uuid" })
    staff_id: string;

    @Column({ type: "varchar" })
    staff_full_name: string;

    @Column({ type: "int" })
    branch_id: number;

    @Column({ type: "varchar" })
    branch_name: string;

    @Column({ type: "varchar" })
    branch_address: string;

    @OneToMany(() => AppointmentService, (appointmentService) => appointmentService.appointment)
    appointment_services: AppointmentService[];

    @Column({ type: "datetime" })
    start_time: Date;

    @Column({ type: "datetime" })
    end_time: Date;

    @Column({ type: "datetime", precision: 3, nullable: true })
    actual_started_at: Date | null;

    @Column({ type: "datetime", precision: 3, nullable: true })
    actual_completed_at: Date | null;

    @Column({
        type: "enum",
        enum: AppointmentStatus,
        default: AppointmentStatus.PENDING
    })
    status: AppointmentStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
