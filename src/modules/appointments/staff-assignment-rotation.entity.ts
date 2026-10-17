import { Column, Entity, PrimaryColumn } from "typeorm";

/** A durable round-robin cursor per branch. Row-locked only during assignment. */
@Entity("staff_assignment_rotation")
export class StaffAssignmentRotation {
    @PrimaryColumn({ type: "int" })
    branch_id: number;

    @Column({ type: "varchar", length: 36, nullable: true })
    last_staff_id: string | null;
}
