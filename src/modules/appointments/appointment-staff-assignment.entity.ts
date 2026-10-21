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

    // NULL = primary worker for the guest; non-NULL = assisting on one service.
    @Column({ type: "varchar", length: 36, nullable: true })
    assisted_service_id: string | null;

    // Only assistants reserve additional slots at the moment work is shared.
    @Column({ type: "datetime", nullable: true })
    reserved_start: Date | null;

    @Column({ type: "datetime", nullable: true })
    reserved_end: Date | null;

    @Column({ type: "datetime", precision: 3, nullable: true })
    started_at: Date | null;

    @Column({ type: "datetime", precision: 3, nullable: true })
    completed_at: Date | null;

    @ManyToOne(() => Appointment, appointment => appointment.staff_assignments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "appointment_id" })
    appointment: Appointment;

}
