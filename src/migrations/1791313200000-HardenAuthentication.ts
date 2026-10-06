import { MigrationInterface, QueryRunner } from "typeorm";

export class HardenAuthentication1791313200000 implements MigrationInterface {
    name = "HardenAuthentication1791313200000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`token_version\` int NOT NULL DEFAULT 0`);

        await queryRunner.query(`
            CREATE TABLE \`refresh_sessions\` (
                \`id\` varchar(36) NOT NULL,
                \`user_id\` varchar(36) NOT NULL,
                \`family_id\` varchar(36) NOT NULL,
                \`token_hash\` varchar(64) NOT NULL,
                \`expires_at\` datetime(3) NOT NULL,
                \`revoked_at\` datetime(3) NULL,
                \`replaced_by\` varchar(36) NULL,
                \`ip_hash\` varchar(64) NULL,
                \`user_agent_hash\` varchar(64) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_refresh_sessions_token_hash\` (\`token_hash\`),
                INDEX \`IDX_refresh_sessions_user_family\` (\`user_id\`, \`family_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`security_events\` (
                \`id\` varchar(36) NOT NULL,
                \`event_type\` varchar(64) NOT NULL,
                \`user_id\` varchar(36) NULL,
                \`identifier_hash\` varchar(64) NULL,
                \`ip_hash\` varchar(64) NULL,
                \`user_agent_hash\` varchar(64) NULL,
                \`request_id\` varchar(36) NOT NULL,
                \`detail\` varchar(255) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX \`IDX_security_events_lookup\` (\`event_type\`, \`identifier_hash\`, \`created_at\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`password_reset_challenges\` (
                \`id\` varchar(36) NOT NULL,
                \`user_id\` varchar(36) NOT NULL,
                \`code_hash\` varchar(64) NOT NULL,
                \`expires_at\` datetime(3) NOT NULL,
                \`attempts_remaining\` int NOT NULL DEFAULT 5,
                \`consumed_at\` datetime(3) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX \`IDX_password_reset_user_created\` (\`user_id\`, \`created_at\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`login_mfa_challenges\` (
                \`id\` varchar(36) NOT NULL,
                \`user_id\` varchar(36) NOT NULL,
                \`code_hash\` varchar(64) NOT NULL,
                \`expires_at\` datetime(3) NOT NULL,
                \`attempts_remaining\` int NOT NULL DEFAULT 5,
                \`consumed_at\` datetime(3) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX \`IDX_login_mfa_user_created\` (\`user_id\`, \`created_at\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            ALTER TABLE \`refresh_sessions\`
            ADD CONSTRAINT \`FK_refresh_sessions_user\`
            FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE \`password_reset_challenges\`
            ADD CONSTRAINT \`FK_password_reset_user\`
            FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE \`login_mfa_challenges\`
            ADD CONSTRAINT \`FK_login_mfa_user\`
            FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`login_mfa_challenges\` DROP FOREIGN KEY \`FK_login_mfa_user\``);
        await queryRunner.query(`ALTER TABLE \`password_reset_challenges\` DROP FOREIGN KEY \`FK_password_reset_user\``);
        await queryRunner.query(`ALTER TABLE \`refresh_sessions\` DROP FOREIGN KEY \`FK_refresh_sessions_user\``);
        await queryRunner.query(`DROP TABLE \`login_mfa_challenges\``);
        await queryRunner.query(`DROP TABLE \`password_reset_challenges\``);
        await queryRunner.query(`DROP TABLE \`security_events\``);
        await queryRunner.query(`DROP TABLE \`refresh_sessions\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`token_version\``);
    }
}
