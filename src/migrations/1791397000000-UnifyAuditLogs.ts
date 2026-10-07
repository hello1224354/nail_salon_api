import { MigrationInterface, QueryRunner } from "typeorm";

export class UnifyAuditLogs1791397000000 implements MigrationInterface {
    name = "UnifyAuditLogs1791397000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`audit_logs\`
            MODIFY \`user_id\` varchar(36) NULL,
            MODIFY \`user_role\` enum ('admin', 'staff', 'customer') NULL,
            MODIFY \`method\` varchar(10) NULL,
            MODIFY \`path\` varchar(2048) NULL,
            MODIFY \`status_code\` int NULL
        `);

        await queryRunner.query(`
            ALTER TABLE \`audit_logs\`
            ADD \`event_type\` varchar(64) NOT NULL DEFAULT 'HTTP_MUTATION' AFTER \`id\`,
            ADD \`identifier_hash\` varchar(64) NULL AFTER \`request_id\`,
            ADD \`ip_hash\` varchar(64) NULL AFTER \`identifier_hash\`,
            ADD \`user_agent_hash\` varchar(64) NULL AFTER \`ip_hash\`,
            ADD \`detail\` varchar(255) NULL AFTER \`user_agent_hash\`
        `);

        await queryRunner.query(`
            CREATE INDEX \`IDX_audit_logs_event_identifier_created\`
            ON \`audit_logs\` (\`event_type\`, \`identifier_hash\`, \`created_at\`)
        `);

        await queryRunner.query(`
            CREATE INDEX \`IDX_audit_logs_event_ip_created\`
            ON \`audit_logs\` (\`event_type\`, \`ip_hash\`, \`created_at\`)
        `);

        await queryRunner.query(`
            CREATE INDEX \`IDX_audit_logs_request_id\`
            ON \`audit_logs\` (\`request_id\`)
        `);

        await queryRunner.query(`
            INSERT INTO \`audit_logs\` (
                \`id\`,
                \`event_type\`,
                \`user_id\`,
                \`user_role\`,
                \`method\`,
                \`path\`,
                \`status_code\`,
                \`request_id\`,
                \`identifier_hash\`,
                \`ip_hash\`,
                \`user_agent_hash\`,
                \`detail\`,
                \`created_at\`
            )
            SELECT
                \`id\`,
                \`event_type\`,
                \`user_id\`,
                NULL,
                NULL,
                NULL,
                NULL,
                \`request_id\`,
                \`identifier_hash\`,
                \`ip_hash\`,
                \`user_agent_hash\`,
                \`detail\`,
                \`created_at\`
            FROM \`security_events\`
        `);

        await queryRunner.query(`DROP TABLE \`security_events\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                INDEX \`IDX_security_events_ip_lookup\` (\`event_type\`, \`ip_hash\`, \`created_at\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            INSERT INTO \`security_events\` (
                \`id\`,
                \`event_type\`,
                \`user_id\`,
                \`identifier_hash\`,
                \`ip_hash\`,
                \`user_agent_hash\`,
                \`request_id\`,
                \`detail\`,
                \`created_at\`
            )
            SELECT
                \`id\`,
                \`event_type\`,
                \`user_id\`,
                \`identifier_hash\`,
                \`ip_hash\`,
                \`user_agent_hash\`,
                \`request_id\`,
                \`detail\`,
                \`created_at\`
            FROM \`audit_logs\`
            WHERE \`event_type\` <> 'HTTP_MUTATION'
        `);

        await queryRunner.query(`DELETE FROM \`audit_logs\` WHERE \`event_type\` <> 'HTTP_MUTATION'`);

        await queryRunner.query(`DROP INDEX \`IDX_audit_logs_request_id\` ON \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_audit_logs_event_ip_created\` ON \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_audit_logs_event_identifier_created\` ON \`audit_logs\``);

        await queryRunner.query(`
            ALTER TABLE \`audit_logs\`
            DROP COLUMN \`detail\`,
            DROP COLUMN \`user_agent_hash\`,
            DROP COLUMN \`ip_hash\`,
            DROP COLUMN \`identifier_hash\`,
            DROP COLUMN \`event_type\`
        `);

        await queryRunner.query(`
            ALTER TABLE \`audit_logs\`
            MODIFY \`user_id\` varchar(255) NOT NULL,
            MODIFY \`user_role\` enum ('admin', 'staff', 'customer') NOT NULL,
            MODIFY \`method\` varchar(10) NOT NULL,
            MODIFY \`path\` varchar(2048) NOT NULL,
            MODIFY \`status_code\` int NOT NULL
        `);
    }
}
