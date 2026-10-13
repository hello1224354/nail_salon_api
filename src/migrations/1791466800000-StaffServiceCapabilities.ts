import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Additive migration. Preserve existing bookings; bootstrap legacy employees
 * with their original branch service catalog. ADMIN can then narrow skills.
 */
export class StaffServiceCapabilities1791466800000 implements MigrationInterface {
    name = "StaffServiceCapabilities1791466800000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`staff_service_capabilities\` (
                \`staff_id\` varchar(36) NOT NULL,
                \`service_id\` varchar(36) NOT NULL,
                PRIMARY KEY (\`staff_id\`, \`service_id\`),
                CONSTRAINT \`FK_staff_capability_staff\`
                    FOREIGN KEY (\`staff_id\`) REFERENCES \`staffs\`(\`user_id\`) ON DELETE CASCADE,
                CONSTRAINT \`FK_staff_capability_service\`
                    FOREIGN KEY (\`service_id\`) REFERENCES \`services\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);
        // Preserve the previously active booking capacity; future staff must
        // select explicit skills when created through the admin API.
        await queryRunner.query(`
            INSERT INTO \`staff_service_capabilities\` (\`staff_id\`, \`service_id\`)
            SELECT st.\`user_id\`, sv.\`id\`
            FROM \`staffs\` st JOIN \`services\` sv ON st.\`branch_id\` = sv.\`branch_id\`
            WHERE sv.\`booking_enabled\` = 1
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const existing = await queryRunner.query(
            "SELECT COUNT(*) AS count FROM `staff_service_capabilities`"
        ) as Array<{ count: number }>;
        if (Number(existing[0]?.count ?? 0) > 0) {
            throw new Error("Refusing to discard staff skill configuration");
        }
        await queryRunner.query("DROP TABLE `staff_service_capabilities`");
    }
}
