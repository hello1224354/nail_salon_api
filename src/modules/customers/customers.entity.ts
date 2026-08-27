import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Appointment } from "../appointments/appointments.entity";

@Entity("customers")
export class Customer {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "varchar", unique: true })
    phone: string;

    @Column({ type: "varchar", nullable: true })
    email: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => Appointment, (appointment) => appointment.customer)
    appointments: Appointment[];
}