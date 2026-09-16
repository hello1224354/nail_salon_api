import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from "typeorm";
import { User } from "../users/users.entity";
import { Staff } from "../staffs/staffs.entity";
import { AppointmentService } from "./appointment-services.entity";

export enum AppointmentStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}

@Index("IDX_appointments_user_start", ["user_id", "start_time"])
@Index("IDX_appointments_staff_start", ["staff_id", "start_time"])
@Entity("appointments")
export class Appointment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    user_id: string;

    @ManyToOne(() => User, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ type: "uuid", nullable: true })
    staff_id: string | null;

    @ManyToOne(() => Staff, (staff) => staff.appointments, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "staff_id", referencedColumnName: "user_id" })
    staff: Staff | null;

    @OneToMany(() => AppointmentService, (appointmentService) => appointmentService.appointment)
    appointment_services: AppointmentService[];

    @Column({ type: "datetime" })
    start_time: Date;

    @Column({ type: "datetime" })
    end_time: Date;

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