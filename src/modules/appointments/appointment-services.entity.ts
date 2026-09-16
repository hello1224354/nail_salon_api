import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Appointment } from "./appointments.entity";
import { Service } from "../services/service.entity";

@Entity("appointment_services")
export class AppointmentService {
    @PrimaryColumn("uuid")
    appointment_id: string;

    @ManyToOne(() => Appointment, { onDelete: "CASCADE" })
    @JoinColumn({ name: "appointment_id" })
    appointment: Appointment;

    @PrimaryColumn("uuid")
    service_id: string;

    @ManyToOne(() => Service, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "service_id" })
    service: Service;

    @Column({ type: "varchar" })
    service_name: string;

    @Column({ type: "int" })
    price: number;

    @Column({ type: "int" })
    duration_minutes: number;
}