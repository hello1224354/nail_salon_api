import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export type InstagramShowcaseItem = {
    title: string | null;
    instagram_url: string;
    image_source: string | null;
    sort_order: number;
};

export type CustomerReview = {
    display_name: string;
    content: string;
    source: string;
    source_url: string;
};

@Entity("salon_content")
export class SalonContent {
    @PrimaryColumn({ type: "int" })
    id: number;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "varchar" })
    display_name: string;

    @Column({ type: "varchar", nullable: true })
    instagram_handle: string | null;

    @Column({ type: "text", nullable: true })
    google_maps_location: string | null;

    @Column({ type: "varchar", nullable: true })
    hotline: string | null;

    @Column({ type: "varchar", nullable: true })
    contact_email: string | null;

    @Column({ type: "varchar", nullable: true })
    facebook_name: string | null;

    @Column({ type: "varchar", nullable: true })
    tiktok_name: string | null;

    @Column({ type: "boolean", default: false })
    has_refreshments: boolean;

    @Column({ type: "boolean", default: false })
    has_warranty: boolean;

    @Column({ type: "int", nullable: true })
    warranty_days: number | null;

    @Column({ type: "text", nullable: true })
    brands: string | null;

    @Column({ type: "text", nullable: true })
    experience_notes: string | null;

    @Column({ type: "json" })
    instagram_showcase: InstagramShowcaseItem[];

    @Column({ type: "json" })
    customer_reviews: CustomerReview[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
