import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Branch } from "../branches/branches.entity";

@Entity("customer_reviews")
@Index("IDX_customer_reviews_branch_sort", ["branch_id", "sort_order"])
export class CustomerReview {
    @PrimaryGeneratedColumn({ type: "int" })
    id: number;

    @Column({ type: "int" })
    branch_id: number;

    @ManyToOne(() => Branch, { onDelete: "CASCADE" })
    @JoinColumn({ name: "branch_id" })
    branch: Branch;

    @Column({ type: "varchar" })
    display_name: string;

    @Column({ type: "text" })
    content: string;

    @Column({ type: "varchar" })
    source: string;

    @Column({ type: "varchar", length: 2048 })
    source_url: string;

    @Column({ type: "int" })
    sort_order: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
