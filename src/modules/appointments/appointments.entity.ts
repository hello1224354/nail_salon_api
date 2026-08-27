import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from "typeorm";
import { Customer } from "../customers/customers.entity";
import { Staff } from "../staffs/staffs.entity";
import { Service } from "../services/service.entity";

export enum AppointmentStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}

@Entity("appointments")
export class Appointment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    customer_id: string;

    @ManyToOne(() => Customer, (customer) => customer.appointments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "customer_id" })
    customer: Customer;

    @Column({ type: "uuid", nullable: true })
    staff_id: string;

    @ManyToOne(() => Staff, (staff) => staff.appointments, { onDelete: "SET NULL" })
    @JoinColumn({ name: "staff_id" })
    staff: Staff;

    @ManyToMany(() => Service, { cascade: true })
    @JoinTable({
        name: "appointment_services",
        joinColumn: { name: "appointment_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "service_id", referencedColumnName: "id" }
    })
    services: Service[];

    @Column({ type: "datetime" })
    start_time: Date;

    @Column({ type: "datetime", nullable: true })
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