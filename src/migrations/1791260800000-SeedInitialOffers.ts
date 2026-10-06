import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedInitialOffers1791260800000 implements MigrationInterface {
    name = "SeedInitialOffers1791260800000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO \`offers\`
                (\`id\`, \`name\`, \`details\`, \`start_date\`, \`end_date\`, \`image\`, \`sort_order\`)
             VALUES
                (
                    '8a07b2ac-9441-4a18-8405-3f9db5c62801',
                    'Bộ móng mới, khởi đầu nhẹ nhàng',
                    'Chọn phong cách tinh giản với bảng màu trung tính được yêu thích tại studio.',
                    '2026-10-06',
                    '2026-10-31',
                    '/nails/nail-01.png',
                    1
                ),
                (
                    '8a07b2ac-9441-4a18-8405-3f9db5c62802',
                    'Gel bền màu cho lịch trình bận rộn',
                    'Một lựa chọn gọn gàng, bóng đẹp và phù hợp cho những tuần làm việc dài.',
                    '2026-10-06',
                    '2026-10-31',
                    '/nails/nail-02.png',
                    2
                ),
                (
                    '8a07b2ac-9441-4a18-8405-3f9db5c62803',
                    'Thêm điểm nhấn với nail art',
                    'Kết hợp màu nền thanh lịch cùng chi tiết trang trí vừa đủ cho phong cách riêng của bạn.',
                    '2026-10-06',
                    '2026-10-31',
                    '/nails/nail-04.png',
                    3
                )`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM \`offers\`
             WHERE \`id\` IN (
                '8a07b2ac-9441-4a18-8405-3f9db5c62801',
                '8a07b2ac-9441-4a18-8405-3f9db5c62802',
                '8a07b2ac-9441-4a18-8405-3f9db5c62803'
             )`
        );
    }
}
