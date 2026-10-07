import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Staff } from "../staffs/staffs.entity";

@Entity("branches")
export class Branch {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "varchar" })
    address: string;

    @Column({ type: "varchar", nullable: true })
    phone: string | null;

    @Column({ type: "varchar", nullable: true })
    opening_hours: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => Staff, (staff) => staff.branch)
    staffs: Staff[];
}
