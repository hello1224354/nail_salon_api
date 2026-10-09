import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMediaFiles1791452400000 implements MigrationInterface {
    name = "AddMediaFiles1791452400000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`media_files\` (
                \`id\` varchar(36) NOT NULL,
                \`object_key\` varchar(180) NOT NULL,
                \`original_name\` varchar(255) NOT NULL,
                \`mime_type\` varchar(32) NOT NULL,
                \`byte_size\` int unsigned NOT NULL,
                \`created_by\` varchar(36) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_media_files_object_key\` (\`object_key\`),
                INDEX \`IDX_media_files_created_at\` (\`created_at\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE \`media_files\`");
    }
}
