import { MigrationInterface, QueryRunner } from "typeorm";

/** Additive migration. Old bookings are preserved. */
export class StaffAssignmentRotation1791467300000 implements MigrationInterface {
    name = "StaffAssignmentRotation1791467300000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE staff_assignment_rotation (" +
            "branch_id int NOT NULL PRIMARY KEY, " +
            "last_staff_id varchar(36) NULL, " +
            "CONSTRAINT FK_assignment_rotation_branch FOREIGN KEY (branch_id) " +
            "REFERENCES branches(id) ON DELETE CASCADE) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "INSERT INTO staff_assignment_rotation (branch_id, last_staff_id) " +
            "SELECT id, NULL FROM branches"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE staff_assignment_rotation");
    }
}
