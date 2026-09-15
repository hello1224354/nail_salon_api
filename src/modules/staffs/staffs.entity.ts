import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from "typeorm";
import { Appointment } from "../appointments/appointments.entity";
import { User } from "../users/users.entity";

@Entity("staffs")
export class Staff {
    @PrimaryColumn("uuid")
    user_id: string;

    @OneToOne(() => User, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ type: "int" })
    branch_id: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => Appointment, (appointment) => appointment.staff)
    appointments: Appointment[];
}