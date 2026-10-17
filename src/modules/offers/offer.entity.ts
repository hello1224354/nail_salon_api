import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("offers")
export class Offer {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255 })
    name: string;

    @Column({ type: "text" })
    details: string;

    /** NULL = available at every branch. */
    @Column({ type: "int", nullable: true })
    branch_id: number | null;

    @Column({ type: "date" })
    start_date: string;

    @Column({ type: "date" })
    end_date: string;

    @Column({ type: "varchar", length: 500 })
    image: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    instagram_post_url: string | null;

    @Column({ type: "int", default: 0 })
    sort_order: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
