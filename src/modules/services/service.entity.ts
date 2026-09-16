import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { AppointmentService } from "../appointments/appointment-services.entity";

@Entity("services")
export class Service {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "int" })
    price: number;

    @Column({ type: "int" })
    duration_minutes: number;

    @Column({ type: "boolean", default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => AppointmentService, (appointmentService) => appointmentService.service)
    appointment_services: AppointmentService[];
}