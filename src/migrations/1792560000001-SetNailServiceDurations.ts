import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Salon-approved reference durations, applied only to exact known items that
 * have no duration yet. Existing appointments retain immutable snapshots.
 * Booking visibility is deliberately unchanged.
 */
export class SetNailServiceDurations1792560000001 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        const durationByName: ReadonlyArray<readonly [string, number]> = [
            ["Cắt da chân", 45],
            ["Cắt da tay + sửa form móng", 45],
            ["Tháo móng up/phá gel", 45],
            ["Sơn Biab cứng móng ( có tạo cầu móng)", 45],
            ["Sơn Gel", 30],
            ["Sơn Thạch (Jelly)", 30],
            ["Sơn Mắt mèo (Cat Eye)", 30],
            ["Sơn Flash", 30],
            ["Sơn Ombre (chuyển màu)", 30],
            ["Design hoạt hình", 45],
            ["Design / Gel nổi", 45],
        ];
        for (const [name, duration] of durationByName) {
            await queryRunner.query(
                "UPDATE services SET duration_minutes = ? WHERE branch_id = ? AND name = ? AND duration_minutes IS NULL",
                [duration, 1, name]
            );
        }
    }

    async down(_queryRunner: QueryRunner): Promise<void> {
        // Deliberately preserve durations that the salon may subsequently edit.
    }
}
