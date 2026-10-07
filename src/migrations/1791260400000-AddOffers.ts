import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOffers1791260400000 implements MigrationInterface {
    name = "AddOffers1791260400000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`offers\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`details\` text NOT NULL,
                \`start_date\` date NOT NULL,
                \`end_date\` date NOT NULL,
                \`image\` varchar(500) NOT NULL,
                \`sort_order\` int NOT NULL DEFAULT 0,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_offers_date_range_sort\` (\`start_date\`, \`end_date\`, \`sort_order\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`offers\``);
    }
}
