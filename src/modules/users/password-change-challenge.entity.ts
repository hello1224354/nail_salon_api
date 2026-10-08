import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("password_change_challenges")
@Index(["user_id", "created_at"])
export class PasswordChangeChallenge {
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

    @CreateDateColumn()
    created_at: Date;
}
