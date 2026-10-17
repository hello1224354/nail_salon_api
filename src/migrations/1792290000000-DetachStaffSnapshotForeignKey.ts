import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Staff identity in appointment_staff_assignments is a historical snapshot.
 * Remove only the FK to live staffs, never the historical records or index.
 */
export class DetachStaffSnapshotForeignKey1792290000000 implements MigrationInterface {
    name = "DetachStaffSnapshotForeignKey1792290000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const constraints: Array<{ CONSTRAINT_NAME: string }> = await queryRunner.query(
            "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE " +
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointment_staff_assignments' " +
            "AND COLUMN_NAME = 'staff_id' AND REFERENCED_TABLE_NAME = 'staffs'"
        );
        for (const row of constraints) {
            const name = row.CONSTRAINT_NAME.replace(/`/g, "``");
            await queryRunner.query(
                "ALTER TABLE `appointment_staff_assignments` DROP FOREIGN KEY `" + name + "`"
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const orphanRows: Array<{ staff_id: string }> = await queryRunner.query(
            "SELECT assignment.staff_id FROM appointment_staff_assignments assignment " +
            "LEFT JOIN staffs staff ON staff.user_id = assignment.staff_id " +
            "WHERE staff.user_id IS NULL LIMIT 1"
        );
        if (orphanRows.length > 0) {
            throw new Error("Cannot restore staff FK: historical snapshots reference deleted staff");
        }
        const existing: Array<{ CONSTRAINT_NAME: string }> = await queryRunner.query(
            "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE " +
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointment_staff_assignments' " +
            "AND COLUMN_NAME = 'staff_id' AND REFERENCED_TABLE_NAME = 'staffs'"
        );
        if (existing.length === 0) {
            await queryRunner.query(
                "ALTER TABLE `appointment_staff_assignments` " +
                "ADD CONSTRAINT `FK_assignment_staff` FOREIGN KEY (`staff_id`) " +
                "REFERENCES `staffs`(`user_id`) ON DELETE RESTRICT"
            );
        }
    }
}
