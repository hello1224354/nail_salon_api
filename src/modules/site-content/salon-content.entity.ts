import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

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


    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
