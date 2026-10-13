import "reflect-metadata";
import { createHash } from "node:crypto";
import { AppDataSource } from "../config/database";
import { MediaFile } from "../modules/media/media-file.entity";
import { inspectImage } from "../modules/media/media-validation";
import { getMediaObject, objectStorageConfigured, putMediaObject } from "../modules/media/object-storage";

async function main(): Promise<void> {
    const mode = process.argv[2];
    if (mode !== "copy" && mode !== "purge") {
        throw new Error("Usage: node dist/jobs/migrate-media-storage.js copy|purge");
    }
    if (!objectStorageConfigured()) throw new Error("Configure all five MEDIA_S3_* variables first");
    if (mode === "purge" && process.env.CONFIRM_MEDIA_BLOB_PURGE !== "YES_I_HAVE_A_BACKUP") {
        throw new Error("Purge requires a verified database backup and CONFIRM_MEDIA_BLOB_PURGE=YES_I_HAVE_A_BACKUP");
    }

    await AppDataSource.initialize();
    try {
        const repo = AppDataSource.getRepository(MediaFile);
        let cursor = "";
        let migrated = 0;
        let skipped = 0;

        for (;;) {
            const batch = await repo.createQueryBuilder("media")
                .addSelect("media.image_data")
                .where("media.id > :cursor", { cursor })
                .andWhere("media.image_data IS NOT NULL")
                .andWhere(mode === "copy" ? "media.object_key IS NULL" : "media.object_key IS NOT NULL")
                .orderBy("media.id", "ASC")
                .limit(20)
                .getMany();
            if (batch.length === 0) break;

            for (const file of batch) {
                cursor = file.id;
                const original = file.image_data;
                if (!Buffer.isBuffer(original) || original.length !== file.byte_size) {
                    throw new Error("Invalid legacy BLOB for media " + file.id);
                }
                const checksum = createHash("sha256").update(original).digest("hex");

                if (mode === "copy") {
                    const image = inspectImage(original);
                    const key = file.id + "." + image.extension;
                    await putMediaObject(key, original, file.mime_type);
                    const remote = await getMediaObject(key);
                    if (createHash("sha256").update(remote).digest("hex") !== checksum) {
                        throw new Error("Remote checksum mismatch for media " + file.id);
                    }
                    const updated = await repo.createQueryBuilder()
                        .update(MediaFile)
                        .set({ object_key: key })
                        .where("id = :id AND object_key IS NULL AND image_data IS NOT NULL", { id: file.id })
                        .execute();
                    if (updated.affected === 1) migrated++;
                    else skipped++;
                } else {
                    const remote = await getMediaObject(file.object_key!);
                    if (createHash("sha256").update(remote).digest("hex") !== checksum) {
                        throw new Error("Refusing to purge: remote checksum mismatch for " + file.id);
                    }
                    const updated = await repo.createQueryBuilder()
                        .update(MediaFile)
                        .set({ image_data: null })
                        .where("id = :id AND object_key = :key AND image_data IS NOT NULL", {
                            id: file.id, key: file.object_key,
                        })
                        .execute();
                    if (updated.affected === 1) migrated++;
                    else skipped++;
                }
                console.log(mode + ": completed " + migrated + " media objects, skipped " + skipped);
            }
        }
        console.log(mode + " done: " + migrated + " media items, " + skipped + " concurrent changes skipped");
    } finally {
        await AppDataSource.destroy();
    }
}

void main().catch(error => {
    console.error("Media migration stopped; safe to resume:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
