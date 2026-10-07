import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("offers")
export class Offer {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255 })
    name: string;

    @Column({ type: "text" })
    details: string;

    @Column({ type: "date" })
    start_date: string;

    @Column({ type: "date" })
    end_date: string;

    @Column({ type: "varchar", length: 500 })
    image: string;

    @Column({ type: "int", default: 0 })
    sort_order: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
