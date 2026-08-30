import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable, Index } from "typeorm";
import { Customer } from "../customers/customers.entity";
import { Staff } from "../staffs/staffs.entity";
import { Service } from "../services/service.entity";

export enum AppointmentStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}

@Index("IDX_appointments_customer_start", ["customer_id", "start_time"])
@Index("IDX_appointments_staff_start", ["staff_id", "start_time"])
@Entity("appointments")
export class Appointment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    customer_id: string;

    @ManyToOne(() => Customer, (customer) => customer.appointments, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "customer_id" })
    customer: Customer;

    @Column({ type: "uuid", nullable: true })
    staff_id: string | null;

    @ManyToOne(() => Staff, (staff) => staff.appointments, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "staff_id" })
    staff: Staff | null;

    @ManyToMany(() => Service, (service) => service.appointments)
    @JoinTable({
        name: "appointment_services",
        joinColumn: { name: "appointment_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "service_id", referencedColumnName: "id" }
    })
    services: Service[];

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