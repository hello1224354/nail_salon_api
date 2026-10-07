import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("customer_reviews")
@Index(["salon_content_id", "sort_order"])
export class CustomerReview {
    @PrimaryGeneratedColumn({ type: "int" })
    id: number;

    @Column({ type: "int" })
    salon_content_id: number;

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
