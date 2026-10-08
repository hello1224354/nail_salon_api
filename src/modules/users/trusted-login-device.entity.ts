import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("trusted_login_devices")
@Index(["user_id", "expires_at"])
export class TrustedLoginDevice {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 36 })
    user_id: string;

    // Hash of a 256-bit bearer secret; never store the browser cookie in plaintext.
    @Column({ type: "varchar", length: 64, unique: true })
    token_hash: string;

    @Column({ type: "int" })
    token_version: number;

    @Column({ type: "varchar", length: 64, nullable: true })
    user_agent_hash: string | null;

    @Column({ type: "datetime", precision: 3 })
    expires_at: Date;

    @Column({ type: "datetime", precision: 3, nullable: true })
    revoked_at: Date | null;

    @CreateDateColumn()
    created_at: Date;
}
