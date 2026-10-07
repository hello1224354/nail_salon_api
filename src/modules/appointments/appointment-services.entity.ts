import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Appointment } from "./appointments.entity";

@Entity("appointment_services")
export class AppointmentService {
    @PrimaryColumn("uuid")
    appointment_id: string;

    @ManyToOne(() => Appointment, (appointment) => appointment.appointment_services, {
        createForeignKeyConstraints: false,
    })
    @JoinColumn({ name: "appointment_id" })
    appointment: Appointment;

    @PrimaryColumn("uuid")
    service_id: string;

    @Column({ type: "varchar" })
    service_name: string;

    @Column({ type: "int" })
    price: number;

    @Column({ type: "int" })
    duration_minutes: number;
}
