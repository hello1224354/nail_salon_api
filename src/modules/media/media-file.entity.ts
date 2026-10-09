import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("media_files")
@Index("IDX_media_files_created_at", ["created_at"])
export class MediaFile {
    @PrimaryColumn({ type: "varchar", length: 36 })
    id: string;

    @Column({ type: "varchar", length: 255 })
    original_name: string;

    @Column({ type: "varchar", length: 32 })
    mime_type: string;

    @Column({ type: "int", unsigned: true })
    byte_size: number;

    @Column({ type: "varchar", length: 36, nullable: true })
    created_by: string | null;

    @CreateDateColumn({ type: "datetime", precision: 6 })
    created_at: Date;

    // Avoid fetching image bytes for paginated admin metadata lists.
    @Column({ type: "mediumblob", select: false })
    image_data: Buffer;
}
