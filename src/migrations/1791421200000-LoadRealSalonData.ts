import { MigrationInterface, QueryRunner } from "typeorm";
import { REAL_SALON_DATA } from "../data/real-salon-data";

export class LoadRealSalonData1791421200000 implements MigrationInterface {
    name = "LoadRealSalonData1791421200000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`branches\` ADD \`phone\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`branches\` ADD \`opening_hours\` varchar(100) NULL`);

        await queryRunner.query(`ALTER TABLE \`services\` ADD \`display_name\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD \`category\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD \`subcategory\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD \`price_min\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD \`price_max\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD \`booking_enabled\` tinyint(1) NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`services\` MODIFY \`duration_minutes\` int NULL`);

        await queryRunner.query(`
            CREATE TABLE \`salon_content\` (
                \`id\` int NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`display_name\` varchar(255) NOT NULL,
                \`instagram_handle\` varchar(255) NULL,
                \`google_maps_location\` text NULL,
                \`hotline\` varchar(50) NULL,
                \`contact_email\` varchar(255) NULL,
                \`facebook_name\` varchar(255) NULL,
                \`tiktok_name\` varchar(255) NULL,
                \`has_refreshments\` tinyint(1) NOT NULL DEFAULT 0,
                \`has_warranty\` tinyint(1) NOT NULL DEFAULT 0,
                \`warranty_days\` int NULL,
                \`brands\` text NULL,
                \`experience_notes\` text NULL,
                \`instagram_showcase\` json NOT NULL,
                \`customer_reviews\` json NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Seed data additively. Never erase existing users, appointments,
        // payments, staff, audit logs or personalized salon content.
        const branch = REAL_SALON_DATA.branch;

            await queryRunner.query(
                `INSERT IGNORE INTO `branches`
                    (\`id\`, \`name\`, \`address\`, \`phone\`, \`opening_hours\`)
                 VALUES (?, ?, ?, ?, ?)`,
                [branch.id, branch.name, branch.address, branch.phone, branch.opening_hours]
            );

            for (const service of REAL_SALON_DATA.services) {
                await queryRunner.query(
                    `INSERT IGNORE INTO `services`
                        (
                            \`id\`, \`branch_id\`, \`name\`, \`display_name\`,
                            \`category\`, \`subcategory\`, \`description\`,
                            \`price\`, \`price_min\`, \`price_max\`,
                            \`duration_minutes\`, \`booking_enabled\`
                        )
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        service.id,
                        branch.id,
                        service.name,
                        service.display_name,
                        service.category,
                        service.subcategory,
                        service.description,
                        service.price_min,
                        service.price_min,
                        service.price_max,
                        service.duration_minutes,
                        service.booking_enabled ? 1 : 0,
                    ]
                );
            }

            const profile = REAL_SALON_DATA.profile;

            await queryRunner.query(
                `INSERT IGNORE INTO `salon_content`
                    (
                        \`id\`, \`name\`, \`display_name\`, \`instagram_handle\`,
                        \`google_maps_location\`, \`hotline\`, \`contact_email\`,
                        \`facebook_name\`, \`tiktok_name\`, \`has_refreshments\`,
                        \`has_warranty\`, \`warranty_days\`, \`brands\`,
                        \`experience_notes\`, \`instagram_showcase\`, \`customer_reviews\`
                    )
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    profile.id,
                    profile.name,
                    profile.display_name,
                    profile.instagram_handle,
                    profile.google_maps_location,
                    profile.hotline,
                    profile.contact_email,
                    profile.facebook_name,
                    profile.tiktok_name,
                    profile.has_refreshments ? 1 : 0,
                    profile.has_warranty ? 1 : 0,
                    profile.warranty_days,
                    profile.brands,
                    profile.experience_notes,
                    JSON.stringify(REAL_SALON_DATA.instagram_showcase),
                    JSON.stringify(REAL_SALON_DATA.customer_reviews),
                ]
            );

    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Removing historical seed records is destructive after users have
        // customized them. Requires an explicit backup/manual recovery plan.
        throw new Error("Irreversible data seed: refusing destructive rollback");
    }
}
