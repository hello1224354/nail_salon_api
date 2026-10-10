import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { WalkInVisitService } from "./walk-in-visit-service.entity";

@Entity("walk_in_visits")
export class WalkInVisit {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    // Snapshot ownership. No fabricated CUSTOMER account is ever created.
    @Column({ type: "uuid" })
    staff_id: string;

    @Column({ type: "varchar", length: 255 })
    staff_full_name: string;

    @Column({ type: "int" })
    branch_id: number;

    @Column({ type: "varchar", length: 255 })
    branch_name: string;

    @Column({ type: "varchar", length: 255 })
    customer_name: string;

    @Column({ type: "varchar", length: 20, nullable: true })
    customer_phone: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    customer_email: string | null;

    @CreateDateColumn({ type: "datetime", precision: 3 })
    served_at: Date;

    @OneToMany(() => WalkInVisitService, item => item.visit)
    services: WalkInVisitService[];
}
