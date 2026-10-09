import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStaffWorkingHours1791456000000 implements MigrationInterface {
    name = "AddStaffWorkingHours1791456000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Existing staff keep the old bookable business-hour window until an ADMIN configures shifts.
        await queryRunner.query(
            "ALTER TABLE `staffs` ADD `work_start_time` varchar(5) NOT NULL DEFAULT '09:00', ADD `work_end_time` varchar(5) NOT NULL DEFAULT '20:30'"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `staffs` DROP COLUMN `work_end_time`, DROP COLUMN `work_start_time`"
        );
    }
}
