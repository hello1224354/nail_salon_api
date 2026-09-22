import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { Appointment } from "../appointments/appointments.entity";
import { User } from "../users/users.entity";
import { Branch } from "../branches/branches.entity";

@Entity("staffs")
export class Staff {
    @PrimaryColumn("uuid")
    user_id: string;

    @OneToOne(() => User, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ type: "int" })
    branch_id: number;

    @ManyToOne(() => Branch, (branch) => branch.staffs, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "branch_id" })
    branch: Branch;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => Appointment, (appointment) => appointment.staff)
    appointments: Appointment[];
}