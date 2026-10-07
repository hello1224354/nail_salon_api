import { MigrationInterface, QueryRunner } from "typeorm";

export class AppointmentSnapshotsAndHardDeletes1791400400000 implements MigrationInterface {
    name = "AppointmentSnapshotsAndHardDeletes1791400400000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`appointments\`
            ADD \`customer_full_name\` varchar(255) NULL AFTER \`user_id\`,
            ADD \`customer_phone\` varchar(255) NULL AFTER \`customer_full_name\`,
            ADD \`customer_email\` varchar(255) NULL AFTER \`customer_phone\`,
            ADD \`staff_full_name\` varchar(255) NULL AFTER \`staff_id\`,
            ADD \`branch_name\` varchar(255) NULL AFTER \`branch_id\`,
            ADD \`branch_address\` varchar(255) NULL AFTER \`branch_name\`
        `);

        await queryRunner.query(`
            UPDATE \`appointments\` appointment
            LEFT JOIN \`users\` customer ON customer.\`id\` = appointment.\`user_id\`
            LEFT JOIN \`staffs\` staff ON staff.\`user_id\` = appointment.\`staff_id\`
            LEFT JOIN \`users\` staff_user ON staff_user.\`id\` = staff.\`user_id\`
            LEFT JOIN \`branches\` branch ON branch.\`id\` = appointment.\`branch_id\`
            SET
                appointment.\`customer_full_name\` = COALESCE(customer.\`full_name\`, 'Unknown customer'),
                appointment.\`customer_phone\` = COALESCE(customer.\`phone\`, ''),
                appointment.\`customer_email\` = customer.\`email\`,
                appointment.\`staff_full_name\` = COALESCE(staff_user.\`full_name\`, 'Unknown staff'),
                appointment.\`branch_name\` = COALESCE(branch.\`name\`, 'Unknown branch'),
                appointment.\`branch_address\` = COALESCE(branch.\`address\`, '')
        `);

        await queryRunner.query(`
            ALTER TABLE \`appointments\`
            MODIFY \`customer_full_name\` varchar(255) NOT NULL,
            MODIFY \`customer_phone\` varchar(255) NOT NULL,
            MODIFY \`staff_full_name\` varchar(255) NOT NULL,
            MODIFY \`branch_name\` varchar(255) NOT NULL,
            MODIFY \`branch_address\` varchar(255) NOT NULL
        `);

        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_66dee3bea82328659a4db8e54b7\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_d211f77ba4a4f32903f0fb73a75\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_fc5d925c8972ba27457e23e7c09\``);
        await queryRunner.query(`ALTER TABLE \`appointment_services\` DROP FOREIGN KEY \`FK_5aafcd787c270f1fd2e01376a6b\``);

        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`is_active\``);
        await queryRunner.query(`ALTER TABLE \`branches\` DROP COLUMN \`is_active\``);
        await queryRunner.query(`ALTER TABLE \`services\` DROP COLUMN \`is_active\``);
    }

    public async down(): Promise<void> {
        throw new Error("AppointmentSnapshotsAndHardDeletes1791400400000 is intentionally irreversible because hard deletes may leave historical appointment snapshots whose source records no longer exist.");
    }
}
