import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity("service_categories")
export class ServiceCategory {
    @PrimaryColumn({ type: "varchar", length: 255 })
    name: string;

    @CreateDateColumn({ type: "datetime", precision: 3 })
    created_at: Date;
}
