import { MigrationInterface, QueryRunner } from "typeorm";

export class MediaObjectDeletionQueue1791467100000 implements MigrationInterface {
    name = "MediaObjectDeletionQueue1791467100000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`media_object_deletions\` (
                \`id\` varchar(36) NOT NULL,
                \`object_key\` varchar(255) NOT NULL,
                \`attempts\` int NOT NULL DEFAULT 0,
                \`next_attempt_at\` datetime(3) NOT NULL,
                \`claimed_at\` datetime(3) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`IDX_media_object_deletions_due\` (\`next_attempt_at\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const rows = await queryRunner.query("SELECT COUNT(*) AS count FROM `media_object_deletions`") as Array<{ count: number }>;
        if (Number(rows[0]?.count ?? 0) > 0) {
            throw new Error("Refusing to discard scheduled object deletion records");
        }
        await queryRunner.query("DROP TABLE `media_object_deletions`");
    }
}
