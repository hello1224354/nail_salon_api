import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { Staff } from "./staffs.entity";
import { Service } from "../services/service.entity";

@Entity("staff_service_capabilities")
export class StaffServiceCapability {
    @PrimaryColumn({ type: "varchar", length: 36 })
    staff_id: string;

    @PrimaryColumn({ type: "varchar", length: 36 })
    service_id: string;

    @ManyToOne(() => Staff, (staff) => staff.capabilities, { onDelete: "CASCADE" })
    @JoinColumn({ name: "staff_id" })
    staff: Staff;

    @ManyToOne(() => Service, { onDelete: "CASCADE" })
    @JoinColumn({ name: "service_id" })
    service: Service;
}
