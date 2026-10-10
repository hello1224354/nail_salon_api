import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { WalkInVisit } from "./walk-in-visit.entity";

@Entity("walk_in_visit_services")
export class WalkInVisitService {
    @PrimaryColumn("uuid")
    visit_id: string;

    @ManyToOne(() => WalkInVisit, visit => visit.services, { onDelete: "CASCADE" })
    @JoinColumn({ name: "visit_id" })
    visit: WalkInVisit;

    @PrimaryColumn("uuid")
    service_id: string;

    @Column({ type: "varchar", length: 255 })
    service_name: string;

    // Service prices are a quote snapshot, never the recorded sale.
    @Column({ type: "int" })
    reference_price: number;

    @Column({ type: "int" })
    actual_price: number;
}
