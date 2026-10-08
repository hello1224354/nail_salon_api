import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("refresh_sessions")
@Index(["user_id", "family_id"])
export class RefreshSession {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 36 })
    user_id: string;

    @Column({ type: "varchar", length: 36 })
    family_id: string;

    @Column({ type: "varchar", length: 64, unique: true })
    token_hash: string;

    @Column({ type: "datetime", precision: 3 })
    expires_at: Date;

    @Column({ type: "datetime", precision: 3, nullable: true })
    revoked_at: Date | null;

    @Column({ type: "varchar", length: 36, nullable: true })
    replaced_by: string | null;

    @Column({ type: "varchar", length: 64, nullable: true })
    ip_hash: string | null;

    @Column({ type: "varchar", length: 64, nullable: true })
    user_agent_hash: string | null;

    @Column({ type: "boolean", default: true })
    persistent: boolean;

    @CreateDateColumn()
    created_at: Date;
}
