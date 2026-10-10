import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Appointment } from "./appointments.entity";

/** Actual charge for one staff member's service within a single group appointment. */
@Entity("appointment_actual_prices")
export class AppointmentActualPrice {
    @PrimaryColumn("uuid")
    appointment_id: string;

    @ManyToOne(() => Appointment, appointment => appointment.actual_prices, { onDelete: "CASCADE" })
    @JoinColumn({ name: "appointment_id" })
    appointment: Appointment;

    @PrimaryColumn("uuid")
    staff_id: string;

    @PrimaryColumn("uuid")
    service_id: string;

    @Column({ type: "int" })
    actual_price: number;

    @UpdateDateColumn({ type: "datetime", precision: 3 })
    updated_at: Date;
}
