import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Branch } from "../branches/branches.entity";

@Entity("services")
export class Service {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "int" })
    branch_id: number;

    @ManyToOne(() => Branch, { onDelete: "CASCADE" })
    @JoinColumn({ name: "branch_id" })
    branch: Branch;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "varchar", nullable: true })
    display_name: string | null;

    @Column({ type: "varchar", nullable: true })
    category: string | null;

    @Column({ type: "varchar", nullable: true })
    subcategory: string | null;

    @Column({ type: "text", nullable: true })
    description: string | null;

    @Column({ type: "int" })
    price: number;

    @Column({ type: "int", nullable: true })
    price_min: number | null;

    @Column({ type: "int", nullable: true })
    price_max: number | null;

    @Column({ type: "int", nullable: true })
    duration_minutes: number | null;

    @Column({ type: "boolean", default: true })
    booking_enabled: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
