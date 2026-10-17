import { MigrationInterface, QueryRunner } from "typeorm";

export class OfferInstagramPostUrl1791467200000 implements MigrationInterface {
    name = "OfferInstagramPostUrl1791467200000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `offers` ADD `instagram_post_url` varchar(500) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `offers` DROP COLUMN `instagram_post_url`");
    }
}
