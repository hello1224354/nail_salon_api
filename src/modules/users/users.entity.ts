import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum UserRole {
    ADMIN = "admin",
    STAFF = "staff",
    CUSTOMER = "customer",
}

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", unique: true })
    email: string;

    @Column({ type: "varchar" })
    password_hash: string;

    @Column({
        type: "enum",
        enum: UserRole,
    })
    role: UserRole;

    @Column({ type: "boolean", default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}