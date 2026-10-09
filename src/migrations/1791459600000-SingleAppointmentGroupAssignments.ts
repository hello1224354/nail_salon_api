import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Non-destructive group consolidation.
 * Old group member appointments are retained and linked to their canonical
 * appointment, rather than being deleted; every allocated employee is
 * preserved in appointment_staff_assignments.
 *
 * Before production: verify a restorable database backup, because TypeORM
 * migrations are run automatically by the Railway API pre-deploy command.
 */
export class SingleAppointmentGroupAssignments1791459600000 implements MigrationInterface {
    name = "SingleAppointmentGroupAssignments1791459600000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Stop before any schema/data changes if past admin edits split group
        // schedules or statuses. Those cases require explicit reconciliation.
        const inconsistent = await queryRunner.query(`
            SELECT booking_group_id FROM appointments
            WHERE booking_group_id IS NOT NULL
            GROUP BY booking_group_id
            HAVING COUNT(DISTINCT user_id) > 1
                OR COUNT(DISTINCT branch_id) > 1
                OR COUNT(DISTINCT start_time) > 1
                OR COUNT(DISTINCT end_time) > 1
                OR COUNT(DISTINCT status) > 1
                OR COUNT(DISTINCT party_size) > 1
            LIMIT 1
        `) as Array<{ booking_group_id: string }>;
        if (inconsistent.length > 0) {
            throw new Error("Legacy booking group has inconsistent members; reconcile before migrating");
        }

        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`merged_into_id\` varchar(36) NULL`);
        await queryRunner.query(`
            CREATE TABLE \`appointment_staff_assignments\` (
                \`appointment_id\` varchar(36) NOT NULL,
                \`staff_id\` varchar(255) NOT NULL,
                \`staff_full_name\` varchar(255) NOT NULL,
                INDEX \`IDX_appointment_staff_assignment_staff\` (\`staff_id\`),
                PRIMARY KEY (\`appointment_id\`, \`staff_id\`),
                CONSTRAINT \`FK_assignment_appointment\` FOREIGN KEY (\`appointment_id\`)
                    REFERENCES \`appointments\`(\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`FK_assignment_staff\` FOREIGN KEY (\`staff_id\`)
                    REFERENCES \`staffs\`(\`user_id\`) ON DELETE RESTRICT
            ) ENGINE=InnoDB
        `);

        // Keep existing single appointments as-is, including historical ones.
        // The lowest UUID is a stable canonical id within each legacy group.
        await queryRunner.query(`
            INSERT INTO appointment_staff_assignments (appointment_id, staff_id, staff_full_name)
            SELECT COALESCE(g.canonical_id, a.id), a.staff_id, a.staff_full_name
            FROM appointments a
            LEFT JOIN (
                SELECT booking_group_id, MIN(id) AS canonical_id
                FROM appointments
                WHERE booking_group_id IS NOT NULL
                GROUP BY booking_group_id
            ) g ON g.booking_group_id = a.booking_group_id
        `);

        // Legacy member rows remain available for audit and manual rollback,
        // but customer/admin queries now see only the canonical appointment.
        await queryRunner.query(`
            UPDATE appointments a
            JOIN (
                SELECT booking_group_id, MIN(id) AS canonical_id
                FROM appointments WHERE booking_group_id IS NOT NULL
                GROUP BY booking_group_id
            ) g ON g.booking_group_id = a.booking_group_id
            SET a.merged_into_id = g.canonical_id
            WHERE a.id <> g.canonical_id
        `);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Dropping assignments would destroy post-migration booking ownership.
        throw new Error("Requires a verified, data-preserving reverse migration");
    }
}
