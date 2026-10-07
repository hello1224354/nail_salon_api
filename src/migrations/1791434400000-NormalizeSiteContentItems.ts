import { MigrationInterface, QueryRunner } from "typeorm";

type LegacyInstagramItem = {
    title?: string | null;
    instagram_url?: string;
};

type LegacyReview = {
    display_name?: string;
    content?: string;
    source?: string;
    source_url?: string;
};

const trendSeeds = [
    { driveId: "1DtS5RGDSSeLd0J9KYaZk4PA5je8cj8UX", postCode: "DeGQeQvynTm", fallbackTitle: null },
    { driveId: "1dwTteuoTGfVvijHDYS8C1E4Ko2ZjYfMc", postCode: "DdLGgOuicGs", fallbackTitle: "French tip kim tuyến ngọc trai" },
    { driveId: "1pg5xQFyq5Yx4jjqDuDcvAIBBM3iC4W6g", postCode: "DdLGgOuicGs", fallbackTitle: "French tip kim tuyến ngọc trai" },
    { driveId: "1a2H_0PJmRFW2G0dA-pT_A-YCN4-u0Fxh", postCode: "DdLGgOuicGs", fallbackTitle: "French tip kim tuyến ngọc trai" },
    { driveId: "15c9T9QBS-MO1EZ5AL4oV2sJDB-F6IyIn", postCode: "DddH7VSpqk7", fallbackTitle: "French tip sữa đính hoa 3D" },
    { driveId: "1EJKxKhza6gfg5OZkkt_cKqbyy3dPhVPv", postCode: "DdITMpxib29", fallbackTitle: "Ngọc trai xà cừ" },
    { driveId: "1jQn9zhQrVXYBzNKcxEjwZiHrC4kgklIC", postCode: "DdITMpxib29", fallbackTitle: "Ngọc trai xà cừ" },
    { driveId: "1HHeURR4Vfuxg-4b3yBcuSF2nY3bP05Zh", postCode: "DdITMpxib29", fallbackTitle: "Ngọc trai xà cừ" },
] as const;

function parseJsonArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];

    if (Buffer.isBuffer(value)) {
        value = value.toString("utf8");
    }

    if (typeof value !== "string") return [];

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
        return [];
    }
}

export class NormalizeSiteContentItems1791434400000 implements MigrationInterface {
    name = "NormalizeSiteContentItems1791434400000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`instagram_trend_items\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`salon_content_id\` int NOT NULL,
                \`title\` varchar(255) NULL,
                \`image_src\` text NOT NULL,
                \`instagram_url\` varchar(2048) NOT NULL,
                \`sort_order\` int NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_instagram_trend_salon_sort\` (\`salon_content_id\`, \`sort_order\`),
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`FK_instagram_trend_salon_content\`
                    FOREIGN KEY (\`salon_content_id\`) REFERENCES \`salon_content\`(\`id\`)
                    ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            CREATE TABLE \`customer_reviews\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`salon_content_id\` int NOT NULL,
                \`display_name\` varchar(255) NOT NULL,
                \`content\` text NOT NULL,
                \`source\` varchar(255) NOT NULL,
                \`source_url\` varchar(2048) NOT NULL,
                \`sort_order\` int NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_customer_reviews_salon_sort\` (\`salon_content_id\`, \`sort_order\`),
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`FK_customer_reviews_salon_content\`
                    FOREIGN KEY (\`salon_content_id\`) REFERENCES \`salon_content\`(\`id\`)
                    ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);

        const salonRows: Array<{
            id: number;
            instagram_showcase: unknown;
            customer_reviews: unknown;
        }> = await queryRunner.query(
            "SELECT \`id\`, \`instagram_showcase\`, \`customer_reviews\` FROM \`salon_content\`"
        );

        for (const salon of salonRows) {
            const legacyInstagram = parseJsonArray<LegacyInstagramItem>(salon.instagram_showcase);
            const legacyReviews = parseJsonArray<LegacyReview>(salon.customer_reviews);

            if (salon.id === 1) {
                for (let index = 0; index < trendSeeds.length; index += 1) {
                    const seed = trendSeeds[index];
                    const legacyPost = legacyInstagram.find((item) =>
                        item.instagram_url?.includes(`/p/${seed.postCode}/`)
                    );
                    const instagramUrl =
                        legacyPost?.instagram_url ?? `https://www.instagram.com/p/${seed.postCode}/`;

                    await queryRunner.query(
                        `INSERT INTO \`instagram_trend_items\`
                            (\`salon_content_id\`, \`title\`, \`image_src\`, \`instagram_url\`, \`sort_order\`)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            salon.id,
                            legacyPost?.title ?? seed.fallbackTitle,
                            `https://drive.google.com/thumbnail?id=${seed.driveId}&sz=w1600`,
                            instagramUrl,
                            index + 1,
                        ]
                    );
                }
            }

            for (let index = 0; index < legacyReviews.length; index += 1) {
                const review = legacyReviews[index];

                if (!review.display_name || !review.content || !review.source || !review.source_url) {
                    continue;
                }

                await queryRunner.query(
                    `INSERT INTO \`customer_reviews\`
                        (\`salon_content_id\`, \`display_name\`, \`content\`, \`source\`, \`source_url\`, \`sort_order\`)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        salon.id,
                        review.display_name,
                        review.content,
                        review.source,
                        review.source_url,
                        index + 1,
                    ]
                );
            }
        }

        await queryRunner.query(
            "ALTER TABLE \`salon_content\` DROP COLUMN \`instagram_showcase\`, DROP COLUMN \`customer_reviews\`"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \`salon_content\` ADD \`instagram_showcase\` json NULL, ADD \`customer_reviews\` json NULL"
        );

        const salonRows: Array<{ id: number }> = await queryRunner.query(
            "SELECT \`id\` FROM \`salon_content\`"
        );

        for (const salon of salonRows) {
            const trendRows: Array<{
                title: string | null;
                instagram_url: string;
                sort_order: number;
            }> = await queryRunner.query(
                "SELECT \`title\`, \`instagram_url\`, \`sort_order\` FROM \`instagram_trend_items\` WHERE \`salon_content_id\` = ? ORDER BY \`sort_order\`, \`id\`",
                [salon.id]
            );
            const reviewRows: Array<{
                display_name: string;
                content: string;
                source: string;
                source_url: string;
                sort_order: number;
            }> = await queryRunner.query(
                "SELECT \`display_name\`, \`content\`, \`source\`, \`source_url\`, \`sort_order\` FROM \`customer_reviews\` WHERE \`salon_content_id\` = ? ORDER BY \`sort_order\`, \`id\`",
                [salon.id]
            );

            const seenPosts = new Set<string>();
            const legacyInstagram = trendRows
                .filter((row) => {
                    if (seenPosts.has(row.instagram_url)) return false;
                    seenPosts.add(row.instagram_url);
                    return true;
                })
                .map((row, index) => ({
                    title: row.title,
                    instagram_url: row.instagram_url,
                    image_source: index === 0
                        ? "https://drive.google.com/drive/folders/1KkKgH4jIll2hOREIw9WhnIys9zKMnxiG"
                        : null,
                    sort_order: index + 1,
                }));

            const legacyReviews = reviewRows.map((row) => ({
                display_name: row.display_name,
                content: row.content,
                source: row.source,
                source_url: row.source_url,
            }));

            await queryRunner.query(
                "UPDATE \`salon_content\` SET \`instagram_showcase\` = ?, \`customer_reviews\` = ? WHERE \`id\` = ?",
                [JSON.stringify(legacyInstagram), JSON.stringify(legacyReviews), salon.id]
            );
        }

        await queryRunner.query(
            "ALTER TABLE \`salon_content\` MODIFY \`instagram_showcase\` json NOT NULL, MODIFY \`customer_reviews\` json NOT NULL"
        );

        await queryRunner.query("DROP TABLE \`customer_reviews\`");
        await queryRunner.query("DROP TABLE \`instagram_trend_items\`");
    }
}
