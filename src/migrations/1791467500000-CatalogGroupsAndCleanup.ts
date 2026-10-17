import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Convert the old free-text categories into a managed catalogue.
 * Retain all distinct nonempty category names currently used by any service.
 * Obsolete subcategory and skills table were retired by the application.
 */
export class CatalogGroupsAndCleanup1791467500000 implements MigrationInterface {
    name = "CatalogGroupsAndCleanup1791467500000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE service_categories (" +
            "name varchar(255) NOT NULL PRIMARY KEY, " +
            "created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB"
        );
        const seed = [
            "Chăm sóc cơ bản",
            "Combo",
            "Dịch vụ khác",
            "Nail art & trang trí",
            "Phụ thu sơn nền",
            "Sơn nền cao cấp",
        ];
        for (const name of seed) {
            await queryRunner.query("INSERT IGNORE INTO service_categories (name) VALUES (?)", [name]);
        }
        await queryRunner.query(
            "INSERT IGNORE INTO service_categories (name) " +
            "SELECT DISTINCT TRIM(category) FROM services WHERE category IS NOT NULL AND TRIM(category) <> ''"
        );

        // These fields have no runtime consumers after this release.
        await queryRunner.query("ALTER TABLE services DROP COLUMN subcategory");
        await queryRunner.query("DROP TABLE staff_service_capabilities");
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Removed legacy values cannot be reconstructed without a verified backup.
        throw new Error("This cleanup migration requires a database backup to reverse");
    }
}
