import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("media_object_deletions")
@Index("IDX_media_object_deletions_due", ["next_attempt_at"])
export class MediaObjectDeletion {
    @PrimaryColumn({ type: "varchar", length: 36 })
    id: string;

    @Column({ type: "varchar", length: 255 })
    object_key: string;

    @Column({ type: "int", default: 0 })
    attempts: number;

    @Column({ type: "datetime", precision: 3 })
    next_attempt_at: Date;

    @Column({ type: "datetime", precision: 3, nullable: true })
    claimed_at: Date | null;

    @CreateDateColumn({ type: "datetime", precision: 6 })
    created_at: Date;
}
