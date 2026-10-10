import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Additive-only migration: online appointments and all historical bookings
 * remain untouched. Do not interpret reference prices as collected revenue.
 */
export class StaffPricesAndWalkIns1791463200000 implements MigrationInterface {
    name = "StaffPricesAndWalkIns1791463200000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`appointment_actual_prices\` (
                \`appointment_id\` varchar(36) NOT NULL,
                \`staff_id\` varchar(36) NOT NULL,
                \`service_id\` varchar(36) NOT NULL,
                \`actual_price\` int NOT NULL,
                \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                PRIMARY KEY (\`appointment_id\`, \`staff_id\`, \`service_id\`),
                CONSTRAINT \`FK_actual_price_appointment\` FOREIGN KEY (\`appointment_id\`)
                    REFERENCES \`appointments\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`walk_in_visits\` (
                \`id\` varchar(36) NOT NULL,
                \`staff_id\` varchar(36) NOT NULL,
                \`staff_full_name\` varchar(255) NOT NULL,
                \`branch_id\` int NOT NULL,
                \`branch_name\` varchar(255) NOT NULL,
                \`customer_name\` varchar(255) NOT NULL,
                \`customer_phone\` varchar(20) NULL,
                \`customer_email\` varchar(255) NULL,
                \`served_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                INDEX \`IDX_walk_in_staff_date\` (\`staff_id\`, \`served_at\`),
                INDEX \`IDX_walk_in_branch_date\` (\`branch_id\`, \`served_at\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`walk_in_visit_services\` (
                \`visit_id\` varchar(36) NOT NULL,
                \`service_id\` varchar(36) NOT NULL,
                \`service_name\` varchar(255) NOT NULL,
                \`reference_price\` int NOT NULL,
                \`actual_price\` int NOT NULL,
                PRIMARY KEY (\`visit_id\`, \`service_id\`),
                CONSTRAINT \`FK_walk_in_visit\` FOREIGN KEY (\`visit_id\`)
                    REFERENCES \`walk_in_visits\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const rows = await queryRunner.query(
            "SELECT (SELECT COUNT(*) FROM walk_in_visits) AS visits, (SELECT COUNT(*) FROM appointment_actual_prices) AS prices",
        ) as Array<{ visits: number; prices: number }>;
        if (Number(rows[0]?.visits) > 0 || Number(rows[0]?.prices) > 0) {
            throw new Error("Refusing to drop real price/visit data; export and reconcile first");
        }
        await queryRunner.query("DROP TABLE `walk_in_visit_services`");
        await queryRunner.query("DROP TABLE `walk_in_visits`");
        await queryRunner.query("DROP TABLE `appointment_actual_prices`");
    }
}
