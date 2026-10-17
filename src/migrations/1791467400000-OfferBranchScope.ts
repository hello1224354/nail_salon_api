import { MigrationInterface, QueryRunner } from "typeorm";

/** Existing promotions remain valid at all branches (branch_id NULL). */
export class OfferBranchScope1791467400000 implements MigrationInterface {
    name = "OfferBranchScope1791467400000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE offers ADD COLUMN branch_id int NULL");
        await queryRunner.query("CREATE INDEX IDX_offers_branch ON offers (branch_id)");
        await queryRunner.query(
            "ALTER TABLE offers ADD CONSTRAINT FK_offer_branch " +
            "FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE offers DROP FOREIGN KEY FK_offer_branch");
        await queryRunner.query("DROP INDEX IDX_offers_branch ON offers");
        await queryRunner.query("ALTER TABLE offers DROP COLUMN branch_id");
    }
}
