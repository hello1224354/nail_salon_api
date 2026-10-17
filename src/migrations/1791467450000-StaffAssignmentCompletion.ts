import { MigrationInterface, QueryRunner } from "typeorm";

/** Individual completion stamps for each staff member in a group booking. */
export class StaffAssignmentCompletion1791467450000 implements MigrationInterface {
    name = "StaffAssignmentCompletion1791467450000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE appointment_staff_assignments " +
            "ADD COLUMN completed_at datetime(3) NULL"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE appointment_staff_assignments DROP COLUMN completed_at");
    }
}
