import { MigrationInterface, QueryRunner } from "typeorm";

export class BookingNotificationOutbox1791466900000 implements MigrationInterface {
    name = "BookingNotificationOutbox1791466900000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`notification_outbox\` (
                \`id\` varchar(36) NOT NULL,
                \`booking_group_id\` varchar(36) NOT NULL,
                \`recipient\` varchar(255) NOT NULL,
                \`subject\` varchar(255) NOT NULL,
                \`body\` text NOT NULL,
                \`status\` varchar(16) NOT NULL DEFAULT 'pending',
                \`attempts\` int NOT NULL DEFAULT 0,
                \`next_attempt_at\` datetime(3) NOT NULL,
                \`claimed_at\` datetime(3) NULL,
                \`sent_at\` datetime(3) NULL,
                \`last_error\` varchar(500) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_notification_booking_recipient\` (\`booking_group_id\`, \`recipient\`),
                KEY \`IDX_notification_outbox_pending\` (\`status\`, \`next_attempt_at\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const rows = await queryRunner.query("SELECT COUNT(*) AS count FROM `notification_outbox`") as Array<{ count: number }>;
        if (Number(rows[0]?.count ?? 0) > 0) {
            throw new Error("Refusing to discard pending or historical delivery records");
        }
        await queryRunner.query("DROP TABLE `notification_outbox`");
    }
}
