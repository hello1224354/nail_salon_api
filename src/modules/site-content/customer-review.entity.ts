import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SalonContent } from "./salon-content.entity";

@Entity("customer_reviews")
@Index("IDX_customer_reviews_salon_sort", ["salon_content_id", "sort_order"])
export class CustomerReview {
    @PrimaryGeneratedColumn({ type: "int" })
    id: number;

    @Column({ type: "int" })
    salon_content_id: number;

    @ManyToOne(() => SalonContent, { onDelete: "CASCADE" })
    @JoinColumn({ name: "salon_content_id" })
    salon_content: SalonContent;

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
