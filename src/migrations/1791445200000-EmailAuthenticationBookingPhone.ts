import { MigrationInterface, QueryRunner } from "typeorm";

export class EmailAuthenticationBookingPhone1791445200000 implements MigrationInterface {
    name = "EmailAuthenticationBookingPhone1791445200000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` MODIFY `phone` varchar(255) NULL");
        await queryRunner.query("UPDATE `users` SET `phone` = NULL WHERE `role` = 'customer'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Customer phone values are intentionally not restored: after this migration
        // booking phone numbers live only on appointment snapshots, not customer accounts.
    }
}
