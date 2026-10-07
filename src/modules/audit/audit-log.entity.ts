import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "../users/users.entity";

@Entity("audit_logs")
@Index(["event_type", "identifier_hash", "created_at"])
@Index(["event_type", "ip_hash", "created_at"])
@Index(["request_id"])
export class AuditLog {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 64 })
    event_type: string;

    @Column({ type: "uuid", nullable: true })
    user_id: string | null;

    @Column({
        type: "enum",
        enum: UserRole,
        nullable: true,
    })
    user_role: UserRole | null;

    @Column({ type: "varchar", length: 10, nullable: true })
    method: string | null;

    @Column({ type: "varchar", length: 2048, nullable: true })
    path: string | null;

    @Column({ type: "int", nullable: true })
    status_code: number | null;

    @Column({ type: "varchar", length: 36 })
    request_id: string;

    @Column({ type: "varchar", length: 64, nullable: true })
    identifier_hash: string | null;

    @Column({ type: "varchar", length: 64, nullable: true })
    ip_hash: string | null;

    @Column({ type: "varchar", length: 64, nullable: true })
    user_agent_hash: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    detail: string | null;

    @CreateDateColumn()
    created_at: Date;
}
