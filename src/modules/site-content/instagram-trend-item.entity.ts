import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SalonContent } from "./salon-content.entity";

@Entity("instagram_trend_items")
@Index("IDX_instagram_trend_salon_sort", ["salon_content_id", "sort_order"])
export class InstagramTrendItem {
    @PrimaryGeneratedColumn({ type: "int" })
    id: number;

    @Column({ type: "int" })
    salon_content_id: number;

    @ManyToOne(() => SalonContent, { onDelete: "CASCADE" })
    @JoinColumn({ name: "salon_content_id" })
    salon_content: SalonContent;

    @Column({ type: "varchar", nullable: true })
    title: string | null;

    @Column({ type: "text" })
    image_src: string;

    @Column({ type: "varchar", length: 2048 })
    instagram_url: string;

    @Column({ type: "int" })
    sort_order: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
