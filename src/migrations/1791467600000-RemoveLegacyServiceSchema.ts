import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Permanently remove two unused legacy schema objects.
 * The service catalogue uses only category; scheduling does not use capabilities.
 * Data stored in these objects is intentionally discarded without a backup.
 */
export class RemoveLegacyServiceSchema1791467600000 implements MigrationInterface {
    name = "RemoveLegacyServiceSchema1791467600000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn("services", "subcategory")) {
            await queryRunner.query("ALTER TABLE `services` DROP COLUMN `subcategory`");
        }

        if (await queryRunner.hasTable("staff_service_capabilities")) {
            await queryRunner.query("DROP TABLE `staff_service_capabilities`");
        }
    }

    public async down(): Promise<void> {
        throw new Error("Legacy columns and their data cannot be restored by a down migration");
    }
}
