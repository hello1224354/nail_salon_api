import { MigrationInterface, QueryRunner } from "typeorm";

export class RegistrationOtpRememberSession1791448800000 implements MigrationInterface {
    name = "RegistrationOtpRememberSession1791448800000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \`refresh_sessions\` ADD \`persistent\` tinyint NOT NULL DEFAULT 1"
        );
        await queryRunner.query(
            "UPDATE \`branches\` SET \`name\` = 'Chi nhánh Quận 8' WHERE \`id\` = 1"
        );
        await queryRunner.query(
            "UPDATE \`salon_content\` SET \`tiktok_name\` = REPLACE(\`tiktok_name\`, 'Tiệm Nail Quận 8', 'Chi nhánh Quận 8') WHERE \`tiktok_name\` LIKE '%Tiệm Nail Quận 8%'"
        );

        await queryRunner.query(
            "CREATE TABLE \`registration_email_challenges\` (" +
                "\`id\` varchar(36) NOT NULL, " +
                "\`email\` varchar(255) NOT NULL, " +
                "\`code_hash\` varchar(64) NOT NULL, " +
                "\`expires_at\` datetime(3) NOT NULL, " +
                "\`attempts_remaining\` int NOT NULL DEFAULT 5, " +
                "\`consumed_at\` datetime(3) NULL, " +
                "\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), " +
                "INDEX \`IDX_registration_email_created\` (\`email\`, \`created_at\`), " +
                "PRIMARY KEY (\`id\`)" +
            ") ENGINE=InnoDB"
        );

        await queryRunner.query(
            "CREATE TABLE \`password_change_challenges\` (" +
                "\`id\` varchar(36) NOT NULL, " +
                "\`user_id\` varchar(36) NOT NULL, " +
                "\`code_hash\` varchar(64) NOT NULL, " +
                "\`expires_at\` datetime(3) NOT NULL, " +
                "\`attempts_remaining\` int NOT NULL DEFAULT 5, " +
                "\`consumed_at\` datetime(3) NULL, " +
                "\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), " +
                "INDEX \`IDX_password_change_user_created\` (\`user_id\`, \`created_at\`), " +
                "PRIMARY KEY (\`id\`)" +
            ") ENGINE=InnoDB"
        );

        await queryRunner.query(
            "ALTER TABLE \`password_change_challenges\` " +
            "ADD CONSTRAINT \`FK_password_change_user\` " +
            "FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) " +
            "ON DELETE CASCADE ON UPDATE NO ACTION"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \`password_change_challenges\` DROP FOREIGN KEY \`FK_password_change_user\`"
        );
        await queryRunner.query("DROP TABLE \`password_change_challenges\`");
        await queryRunner.query("DROP TABLE \`registration_email_challenges\`");
        await queryRunner.query("ALTER TABLE \`refresh_sessions\` DROP COLUMN \`persistent\`");
    }
}
