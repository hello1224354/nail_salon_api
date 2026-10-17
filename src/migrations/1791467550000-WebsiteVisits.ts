import { MigrationInterface, QueryRunner } from "typeorm";

export class WebsiteVisits1791467550000 implements MigrationInterface {
    name = "WebsiteVisits1791467550000";
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE website_visits (" +
            "session_id varchar(36) NOT NULL PRIMARY KEY, " +
            "first_seen_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), " +
            "last_seen_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), " +
            "INDEX IDX_website_visit_last_seen (last_seen_at)) ENGINE=InnoDB"
        );
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE website_visits");
    }
}
