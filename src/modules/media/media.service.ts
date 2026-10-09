import { randomUUID } from "crypto";
import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { Offer } from "../offers/offer.entity";
import { InstagramTrendItem } from "../site-content/instagram-trend-item.entity";
import { MediaFile } from "./media-file.entity";
import { inspectImage, mediaPublicUrl, safeOriginalFilename } from "./media-validation";
import { r2Configured, r2Request } from "./r2-storage";

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
    return { files: files.map(publicMedia), total, page, limit, total_pages: Math.ceil(total / limit), configured: r2Configured() };
}

export async function uploadMedia(bytes: Buffer, claimedMime: string | undefined, name: unknown, userId: string) {
    if (!r2Configured()) throw new AppError("R2 storage is not configured", 503, "MEDIA_STORAGE_UNAVAILABLE");
    const image = inspectImage(bytes);
    if (claimedMime && claimedMime !== image.mime) {
        throw new AppError("Image content does not match Content-Type", 415, "INVALID_MEDIA_TYPE");
    }
    const id = randomUUID();
    const objectKey = `media/${id}.${image.extension}`;
    await r2Request("PUT", objectKey, bytes, image.mime);
    try {
        const file = await repository.save(repository.create({
            id, object_key: objectKey, original_name: safeOriginalFilename(name),
            mime_type: image.mime, byte_size: bytes.length, created_by: userId,
        }));
        return publicMedia(file);
    } catch (error) {
        // Do not leave an untracked R2 file when DB metadata cannot be committed.
        await r2Request("DELETE", objectKey).catch((cleanup) => console.error("R2 cleanup failed", cleanup));
        throw error;
    }
}

export async function readMedia(id: string) {
    const file = await repository.findOneBy({ id });
    if (!file) throw new AppError("Image not found", 404, "MEDIA_NOT_FOUND");
    const response = await r2Request("GET", file.object_key);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 5 * 1024 * 1024) {
        throw new AppError("Stored image exceeds allowed size", 502, "MEDIA_STORAGE_ERROR");
    }
    return { file, bytes };
}

export async function deleteMedia(id: string) {
    const file = await repository.findOneBy({ id });
    if (!file) throw new AppError("Image not found", 404, "MEDIA_NOT_FOUND");
    const url = mediaPublicUrl(id);
    const [offers, trends] = await Promise.all([
        AppDataSource.getRepository(Offer).countBy({ image: url }),
        AppDataSource.getRepository(InstagramTrendItem).countBy({ image_src: url }),
    ]);
    if (offers || trends) {
        throw new AppError("Image is in use. Replace it in offers or trends before deleting.", 409, "MEDIA_IN_USE");
    }
    await r2Request("DELETE", file.object_key);
    await repository.remove(file);
    return { id };
}
