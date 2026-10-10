import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserActiveFlag1791620500000 implements MigrationInterface {
    name = "AddUserActiveFlag1791620500000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` ADD `is_active` tinyint NOT NULL DEFAULT 1");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` DROP COLUMN `is_active`");
    }
}
