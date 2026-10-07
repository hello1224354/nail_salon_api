import { MigrationInterface, QueryRunner } from "typeorm";
import { REAL_SALON_DATA } from "../data/real-salon-data";

const trendRows = [
    {
        image_src: "https://drive.google.com/thumbnail?id=1DtS5RGDSSeLd0J9KYaZk4PA5je8cj8UX&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DeGQeQvynTm/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 1,
    },
    {
        image_src: "https://drive.google.com/thumbnail?id=1dwTteuoTGfVvijHDYS8C1E4Ko2ZjYfMc&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DdLGgOuicGs/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 2,
    },
    {
        image_src: "https://drive.google.com/thumbnail?id=1pg5xQFyq5Yx4jjqDuDcvAIBBM3iC4W6g&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DdLGgOuicGs/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 3,
    },
    {
        image_src: "https://drive.google.com/thumbnail?id=1a2H_0PJmRFW2G0dA-pT_A-YCN4-u0Fxh&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DdLGgOuicGs/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 4,
    },
    {
        image_src: "https://drive.google.com/thumbnail?id=15c9T9QBS-MO1EZ5AL4oV2sJDB-F6IyIn&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DddH7VSpqk7/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 5,
    },
    {
        image_src: "https://drive.google.com/thumbnail?id=1EJKxKhza6gfg5OZkkt_cKqbyy3dPhVPv&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DdITMpxib29/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 6,
    },
    {
        image_src: "https://drive.google.com/thumbnail?id=1jQn9zhQrVXYBzNKcxEjwZiHrC4kgklIC&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DdITMpxib29/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 7,
    },
    {
        image_src: "https://drive.google.com/thumbnail?id=1HHeURR4Vfuxg-4b3yBcuSF2nY3bP05Zh&sz=w1600",
        instagram_url: "https://www.instagram.com/p/DdITMpxib29/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
        sort_order: 8,
    },
] as const;

const previousTrendTitles = [
    null,
    "French tip kim tuyến ngọc trai",
    "French tip kim tuyến ngọc trai",
    "French tip kim tuyến ngọc trai",
    "French tip sữa đính hoa 3D",
    "Ngọc trai xà cừ",
    "Ngọc trai xà cừ",
    "Ngọc trai xà cừ",
] as const;

export class BranchReviewsAndReseedTrends1791438000000 implements MigrationInterface {
    name = "BranchReviewsAndReseedTrends1791438000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DELETE FROM `customer_reviews`");
        await queryRunner.query("ALTER TABLE `customer_reviews` DROP FOREIGN KEY `FK_customer_reviews_salon_content`");
        await queryRunner.query("DROP INDEX `IDX_customer_reviews_salon_sort` ON `customer_reviews`");
        await queryRunner.query("ALTER TABLE `customer_reviews` DROP COLUMN `salon_content_id`");
        await queryRunner.query("ALTER TABLE `customer_reviews` ADD `branch_id` int NOT NULL AFTER `id`");
        await queryRunner.query("CREATE INDEX `IDX_customer_reviews_branch_sort` ON `customer_reviews` (`branch_id`, `sort_order`)");
        await queryRunner.query(
            "ALTER TABLE `customer_reviews` ADD CONSTRAINT `FK_customer_reviews_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query("ALTER TABLE `customer_reviews` AUTO_INCREMENT = 1");

        for (let index = 0; index < REAL_SALON_DATA.customer_reviews.length; index += 1) {
            const review = REAL_SALON_DATA.customer_reviews[index];

            await queryRunner.query(
                `INSERT INTO \`customer_reviews\`
                    (\`branch_id\`, \`display_name\`, \`content\`, \`source\`, \`source_url\`, \`sort_order\`)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    review.branch_id,
                    review.display_name,
                    review.content,
                    review.source,
                    review.source_url,
                    index + 1,
                ]
            );
        }

        await queryRunner.query("DELETE FROM `instagram_trend_items`");
        await queryRunner.query("ALTER TABLE `instagram_trend_items` AUTO_INCREMENT = 1");

        for (const trend of trendRows) {
            await queryRunner.query(
                `INSERT INTO \`instagram_trend_items\`
                    (\`salon_content_id\`, \`title\`, \`image_src\`, \`instagram_url\`, \`sort_order\`)
                 VALUES (?, ?, ?, ?, ?)`,
                [REAL_SALON_DATA.profile.id, null, trend.image_src, trend.instagram_url, trend.sort_order]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DELETE FROM `customer_reviews`");
        await queryRunner.query("ALTER TABLE `customer_reviews` DROP FOREIGN KEY `FK_customer_reviews_branch`");
        await queryRunner.query("DROP INDEX `IDX_customer_reviews_branch_sort` ON `customer_reviews`");
        await queryRunner.query("ALTER TABLE `customer_reviews` DROP COLUMN `branch_id`");
        await queryRunner.query("ALTER TABLE `customer_reviews` ADD `salon_content_id` int NOT NULL AFTER `id`");
        await queryRunner.query("CREATE INDEX `IDX_customer_reviews_salon_sort` ON `customer_reviews` (`salon_content_id`, `sort_order`)");
        await queryRunner.query(
            "ALTER TABLE `customer_reviews` ADD CONSTRAINT `FK_customer_reviews_salon_content` FOREIGN KEY (`salon_content_id`) REFERENCES `salon_content`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
        await queryRunner.query("ALTER TABLE `customer_reviews` AUTO_INCREMENT = 1");

        for (let index = 0; index < REAL_SALON_DATA.customer_reviews.length; index += 1) {
            const review = REAL_SALON_DATA.customer_reviews[index];

            await queryRunner.query(
                `INSERT INTO \`customer_reviews\`
                    (\`salon_content_id\`, \`display_name\`, \`content\`, \`source\`, \`source_url\`, \`sort_order\`)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    REAL_SALON_DATA.profile.id,
                    review.display_name,
                    review.content,
                    review.source,
                    review.source_url,
                    index + 1,
                ]
            );
        }

        await queryRunner.query("DELETE FROM `instagram_trend_items`");
        await queryRunner.query("ALTER TABLE `instagram_trend_items` AUTO_INCREMENT = 1");

        for (let index = 0; index < trendRows.length; index += 1) {
            const trend = trendRows[index];

            await queryRunner.query(
                `INSERT INTO \`instagram_trend_items\`
                    (\`salon_content_id\`, \`title\`, \`image_src\`, \`instagram_url\`, \`sort_order\`)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    REAL_SALON_DATA.profile.id,
                    previousTrendTitles[index],
                    trend.image_src,
                    trend.instagram_url,
                    trend.sort_order,
                ]
            );
        }
    }
}
