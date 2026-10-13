import { MigrationInterface, QueryRunner } from "typeorm";

/** Additive transition: old BLOBs remain readable while files migrate to S3. */
export class MediaObjectStorage1791467000000 implements MigrationInterface {
    name = "MediaObjectStorage1791467000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `media_files` ADD `object_key` varchar(255) NULL, MODIFY `image_data` mediumblob NULL",
        );
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // A rollback would strand media whose BLOB was intentionally retired.
        throw new Error("Refusing to discard object-storage references or media");
    }
}
