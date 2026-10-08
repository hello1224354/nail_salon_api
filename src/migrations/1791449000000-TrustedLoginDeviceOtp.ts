import { MigrationInterface, QueryRunner } from "typeorm";

export class TrustedLoginDeviceOtp1791449000000 implements MigrationInterface {
    name = "TrustedLoginDeviceOtp1791449000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `login_mfa_challenges` " +
                "ADD `persistent` tinyint NOT NULL DEFAULT 1, " +
                "ADD `token_version` int NOT NULL DEFAULT 0"
        );
        await queryRunner.query(`
            CREATE TABLE \`trusted_login_devices\` (
                \`id\` varchar(36) NOT NULL,
                \`user_id\` varchar(36) NOT NULL,
                \`token_hash\` varchar(64) NOT NULL,
                \`token_version\` int NOT NULL,
                \`role\` varchar(16) NOT NULL,
                \`user_agent_hash\` varchar(64) NULL,
                \`expires_at\` datetime(3) NOT NULL,
                \`revoked_at\` datetime(3) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_trusted_login_devices_token_hash\` (\`token_hash\`),
                INDEX \`IDX_trusted_login_devices_user_expiry\` (\`user_id\`, \`expires_at\`),
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`FK_trusted_login_devices_user\`
                    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
                    ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE `trusted_login_devices`");
        await queryRunner.query(
            "ALTER TABLE `login_mfa_challenges` DROP COLUMN `token_version`, DROP COLUMN `persistent`"
        );
    }
}
