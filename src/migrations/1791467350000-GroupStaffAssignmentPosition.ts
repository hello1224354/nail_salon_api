import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Preserve per-person assignment order for group booking admin edits.
 * Legacy rows remain intact; ties on old rows are sorted by staff id in the API.
 */
export class GroupStaffAssignmentPosition1791467350000 implements MigrationInterface {
    name = "GroupStaffAssignmentPosition1791467350000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE appointment_staff_assignments ADD COLUMN position int NOT NULL DEFAULT 0"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reversing this after any edits would discard the intended guest order.
        throw new Error("Restore assignment order from verified backup before rolling back");
    }
}
