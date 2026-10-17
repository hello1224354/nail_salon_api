import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

/** Random, tab-scoped session identifier; no IP addresses or personal data stored. */
@Entity("website_visits")
export class WebsiteVisit {
    @PrimaryColumn({ type: "varchar", length: 36 })
    session_id: string;

    @CreateDateColumn({ type: "datetime", precision: 3 })
    first_seen_at: Date;

    @Index("IDX_website_visit_last_seen")
    @Column({ type: "datetime", precision: 3 })
    last_seen_at: Date;
}
