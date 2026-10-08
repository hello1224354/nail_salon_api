import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("login_mfa_challenges")
@Index(["user_id", "created_at"])
export class LoginMfaChallenge {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 36 })
    user_id: string;

    @Column({ type: "varchar", length: 64 })
    code_hash: string;

    @Column({ type: "datetime", precision: 3 })
    expires_at: Date;

    @Column({ type: "int", default: 5 })
    attempts_remaining: number;

    @Column({ type: "datetime", precision: 3, nullable: true })
    consumed_at: Date | null;

    @Column({ type: "boolean", default: true })
    persistent: boolean;

    @Column({ type: "int", default: 0 })
    token_version: number;

    @CreateDateColumn()
    created_at: Date;
}
