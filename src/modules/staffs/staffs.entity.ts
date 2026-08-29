import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Appointment } from "../appointments/appointments.entity";

@Entity("staffs")
export class Staff {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "varchar", nullable: true })
    phone: string | null;

    @Column({ type: "int" })
    branch_id: number;

    @Column({ type: "boolean", default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => Appointment, (appointment) => appointment.staff)
    appointments: Appointment[];
}
