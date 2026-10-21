import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Optional per-service worker assistance. Primary (one-per-guest) assignments
 * keep assisted_service_id NULL. A helper owns exactly one booked service.
 * Existing records retain their original shape and behavior.
 */
export class EnableServiceAssistance1792560000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        const table = "appointment_staff_assignments";
        if (!await queryRunner.hasColumn(table, "assisted_service_id")) {
            await queryRunner.addColumn(table, new TableColumn({
                name: "assisted_service_id", type: "varchar", length: "36", isNullable: true,
            }));
        }
        if (!await queryRunner.hasColumn(table, "reserved_start")) {
            await queryRunner.addColumn(table, new TableColumn({
                name: "reserved_start", type: "datetime", isNullable: true,
            }));
        }
        if (!await queryRunner.hasColumn(table, "reserved_end")) {
            await queryRunner.addColumn(table, new TableColumn({
                name: "reserved_end", type: "datetime", isNullable: true,
            }));
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        const table = "appointment_staff_assignments";
        for (const name of ["reserved_end", "reserved_start", "assisted_service_id"]) {
            if (await queryRunner.hasColumn(table, name)) await queryRunner.dropColumn(table, name);
        }
    }
}
