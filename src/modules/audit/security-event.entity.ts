import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("security_events")
@Index(["event_type", "identifier_hash", "created_at"])
@Index(["event_type", "ip_hash", "created_at"])
export class SecurityEvent {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 64 })
    event_type: string;

    @Column({ type: "varchar", length: 36, nullable: true })
    user_id: string | null;

    @Column({ type: "varchar", length: 64, nullable: true })
    identifier_hash: string | null;

    @Column({ type: "varchar", length: 64, nullable: true })
    ip_hash: string | null;

    @Column({ type: "varchar", length: 64, nullable: true })
    user_agent_hash: string | null;

    @Column({ type: "varchar", length: 36 })
    request_id: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    detail: string | null;

    @CreateDateColumn()
    created_at: Date;
}
