import { MigrationInterface, QueryRunner } from "typeorm";

const correctedTrendRows = [
    {
        title: null,
        image_src: "https://drive.google.com/thumbnail?id=1DtS5RGDSSeLd0J9KYaZk4PA5je8cj8UX&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DeGQeQvynTm/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 1,
    },
    {
        title: "French tip kim tuyến ngọc trai",
        image_src: "https://drive.google.com/thumbnail?id=1dwTteuoTGfVvijHDYS8C1E4Ko2ZjYfMc&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DdLGgOuicGs/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 2,
    },
    {
        title: "French tip sữa đính hoa 3D",
        image_src: "https://drive.google.com/thumbnail?id=15c9T9QBS-MO1EZ5AL4oV2sJDB-F6IyIn&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DddH7VSpqk7/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 3,
    },
    {
        title: "Ngọc trai xà cừ",
        image_src: "https://drive.google.com/thumbnail?id=1EJKxKhza6gfg5OZkkt_cKqbyy3dPhVPv&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DdITMpxib29/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 4,
    },
] as const;

export class CorrectInstagramTrendItems1791441600000 implements MigrationInterface {
    name = "CorrectInstagramTrendItems1791441600000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DELETE FROM `instagram_trend_items`");
        await queryRunner.query("ALTER TABLE `instagram_trend_items` AUTO_INCREMENT = 1");

        for (const item of correctedTrendRows) {
            await queryRunner.query(
                `INSERT INTO \`instagram_trend_items\`
                    (\`salon_content_id\`, \`title\`, \`image_src\`, \`instagram_url\`, \`sort_order\`)
                 VALUES (?, ?, ?, ?, ?)`,
                [1, item.title, item.image_src, item.instagram_url, item.sort_order]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DELETE FROM `instagram_trend_items`");
        await queryRunner.query("ALTER TABLE `instagram_trend_items` AUTO_INCREMENT = 1");
    }
}
