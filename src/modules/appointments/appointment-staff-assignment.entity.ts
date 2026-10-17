import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Appointment } from "./appointments.entity";

// One appointment is the booking; these rows only identify reserved employees.
@Entity("appointment_staff_assignments")
@Index("IDX_appointment_staff_assignment_staff", ["staff_id"])
export class AppointmentStaffAssignment {
    @PrimaryColumn({ type: "varchar", length: 36 })
    appointment_id: string;

    @PrimaryColumn({ type: "varchar", length: 255 })
    staff_id: string;

    @Column({ type: "varchar", length: 255 })
    staff_full_name: string;

    @Column({ type: "int", default: 0 })
    position: number;

    @Column({ type: "datetime", precision: 3, nullable: true })
    completed_at: Date | null;

    @ManyToOne(() => Appointment, appointment => appointment.staff_assignments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "appointment_id" })
    appointment: Appointment;

}
