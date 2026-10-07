import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupBookings1791414000000 implements MigrationInterface {
    name = "AddGroupBookings1791414000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`booking_group_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`party_size\` int NOT NULL DEFAULT 1`);
        await queryRunner.query(`CREATE INDEX \`IDX_appointments_booking_group\` ON \`appointments\` (\`booking_group_id\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_appointments_booking_group\` ON \`appointments\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP COLUMN \`party_size\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP COLUMN \`booking_group_id\``);
    }
}
