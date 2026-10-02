import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "../users/users.entity";

@Entity("audit_logs")
export class AuditLog {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    user_id: string;

    @Column({
        type: "enum",
        enum: UserRole,
    })
    user_role: UserRole;

    @Column({ type: "varchar", length: 10 })
    method: string;

    @Column({ type: "varchar", length: 2048 })
    path: string;

    @Column({ type: "int" })
    status_code: number;

    @Column({ type: "varchar", length: 36 })
    request_id: string;

    @CreateDateColumn()
    created_at: Date;
}