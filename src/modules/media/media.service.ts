import { randomUUID } from "crypto";
import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { Offer } from "../offers/offer.entity";
import { InstagramTrendItem } from "../site-content/instagram-trend-item.entity";
import { MediaFile } from "./media-file.entity";
import { MediaObjectDeletion } from "./media-object-deletion.entity";
import { drainMediaObjectDeletions } from "./media-deletion-worker";
import { putMediaObject, getMediaObject, deleteMediaObject, objectStorageConfigured } from "./object-storage";
import { inspectImage, mediaPublicUrl, safeOriginalFilename, MAX_MEDIA_BYTES } from "./media-validation";

const repository = AppDataSource.getRepository(MediaFile);

export function publicMedia(file: MediaFile) {
    return {
        id: file.id,
        original_name: file.original_name,
        mime_type: file.mime_type,
        byte_size: file.byte_size,
        created_at: file.created_at,
        url: mediaPublicUrl(file.id),
    };
}

export async function listMedia(page: number) {
    const limit = 24;
    const [files, total] = await repository.findAndCount({
        order: { created_at: "DESC", id: "DESC" },
        take: limit,
        skip: (page - 1) * limit,
    });
    return { files: files.map(publicMedia), total, page, limit, total_pages: Math.ceil(total / limit) };
}

export async function uploadMedia(bytes: Buffer, claimedMime: string | undefined, name: unknown, userId: string) {
    const image = inspectImage(bytes);
    if (claimedMime && claimedMime !== image.mime) {
        throw new AppError("Image content does not match Content-Type", 415, "INVALID_MEDIA_TYPE");
    }
    const id = randomUUID();
    const key = id + "." + image.extension;
    const useObjectStorage = objectStorageConfigured();
    if (useObjectStorage) await putMediaObject(key, bytes, image.mime);
    try {
        const file = await repository.save(repository.create({
            id,
            original_name: safeOriginalFilename(name),
            mime_type: image.mime,
            byte_size: bytes.length,
            created_by: userId,
            image_data: useObjectStorage ? null : bytes,
            object_key: useObjectStorage ? key : null,
        }));
        return publicMedia(file);
    } catch (error) {
        // This upload has no DB reference. Best-effort immediate cleanup;
        // a failed cleanup is logged but must never hide the DB failure.
        if (useObjectStorage) {
            void deleteMediaObject(key).catch(cleanupError =>
                console.error("Orphaned media upload requires cleanup", {
                    objectKey: key,
                    error: cleanupError instanceof Error ? cleanupError.message : "Unknown",
                })
            );
        }
        throw error;
    }
}

export async function readMedia(id: string) {
    const file = await repository.createQueryBuilder("media")
        .addSelect("media.image_data")
        .where("media.id = :id", { id })
        .getOne();
    if (!file) throw new AppError("Image not found", 404, "MEDIA_NOT_FOUND");
    // During migration BLOBs remain authoritative until separately verified
    // and retired. Existing /api/media URLs never need to change.
    const bytes = Buffer.isBuffer(file.image_data)
        ? file.image_data
        : file.object_key
          ? await getMediaObject(file.object_key)
          : null;
    if (!Buffer.isBuffer(bytes) || bytes.length !== file.byte_size || bytes.length > MAX_MEDIA_BYTES) {
        throw new AppError("Stored image is invalid", 502, "MEDIA_STORAGE_ERROR");
    }
    return { file, bytes };
}

export async function deleteMedia(id: string) {
    const deleted = await AppDataSource.transaction(async (manager) => {
        const mediaRepo = manager.getRepository(MediaFile);
        const file = await mediaRepo.createQueryBuilder("media")
            .setLock("pessimistic_write")
            .where("media.id = :id", { id })
            .getOne();
        if (!file) throw new AppError("Image not found", 404, "MEDIA_NOT_FOUND");
        const url = mediaPublicUrl(id);
        const [offers, trends] = await Promise.all([
            manager.getRepository(Offer).countBy({ image: url }),
            manager.getRepository(InstagramTrendItem).countBy({ image_src: url }),
        ]);
        if (offers || trends) {
            throw new AppError("Image is in use. Replace it in offers or trends before deleting.", 409, "MEDIA_IN_USE");
        }
        if (file.object_key) {
            // Persist cleanup in the same transaction as record deletion;
            // S3 failures will not leave a broken DB reference.
            await manager.getRepository(MediaObjectDeletion).insert({
                id,
                object_key: file.object_key,
                attempts: 0,
                next_attempt_at: new Date(),
                claimed_at: null,
            });
        }
        await mediaRepo.delete(id);
        return { id };
    });
    void drainMediaObjectDeletions().catch(error =>
        console.error("Media object deletion deferred", error)
    );
    return deleted;
}
