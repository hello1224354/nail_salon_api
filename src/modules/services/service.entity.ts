import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("services")
export class Service {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255 })
    name: string;

    @Column({ type: "int" })
    price: number;

    @Column({ type: "int", comment: "Minutes" })
    duration: number;

    @Column({ type: "int" })
    category_id: number;

    @Column({ type: "int" })
    branch_id: number;

    @Column({ type: "boolean", default: true })
    available: boolean;
}