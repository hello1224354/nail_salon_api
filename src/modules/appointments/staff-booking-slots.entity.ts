import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Staff } from "../staffs/staffs.entity";

@Entity("staff_booking_slots")
export class StaffBookingSlot {
    @PrimaryColumn("uuid")
    staff_id: string;

    @PrimaryColumn({ type: "datetime" })
    slot_start: Date;

    @ManyToOne(() => Staff, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "staff_id" })
    staff: Staff;
}