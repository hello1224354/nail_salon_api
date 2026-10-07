import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("instagram_trend_items")
@Index(["salon_content_id", "sort_order"])
export class InstagramTrendItem {
    @PrimaryGeneratedColumn({ type: "int" })
    id: number;

    @Column({ type: "int" })
    salon_content_id: number;

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
