import { Router } from "express";
import { AppError } from "../../common/errors";
import { AppDataSource } from "../../config/database";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "../users/users.entity";
import { InstagramTrendItem } from "./instagram-trend-item.entity";
import { SalonContent } from "./salon-content.entity";
import { MediaFile } from "../media/media-file.entity";
import { mediaPublicUrl } from "../media/media-validation";

const router = Router();
router.use(authenticate, requireRole(UserRole.ADMIN));

router.get("/trends", async (req, res) => {
    const items = await AppDataSource.getRepository(InstagramTrendItem).find({
        where: { salon_content_id: 1 }, order: { sort_order: "ASC", id: "ASC" },
    });
    return res.json({ success: { message: "Get trends successfully", data: items } });
});

function validateTrend(data: unknown) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new AppError("Invalid trend", 400, "VALIDATION_ERROR");
    const value = data as Record<string, unknown>;
    if (typeof value.image_src !== "string" || !/^\/api\/media\/[0-9a-f-]{36}\/file$/.test(value.image_src)) {
        throw new AppError("Select an uploaded image", 400, "VALIDATION_ERROR");
    }
    if (typeof value.instagram_url !== "string" || !/^https:\/\/(?:www\.)?instagram\.com\/[^\s]+$/i.test(value.instagram_url) || value.instagram_url.length > 2048) {
        throw new AppError("Valid Instagram post URL required", 400, "VALIDATION_ERROR");
    }
    if (value.title !== undefined && value.title !== null && (typeof value.title !== "string" || value.title.length > 255)) {
        throw new AppError("Invalid title", 400, "VALIDATION_ERROR");
    }
    if (value.sort_order !== undefined && (!Number.isInteger(value.sort_order) || (value.sort_order as number) < 0 || (value.sort_order as number) > 1_000_000)) {
        throw new AppError("Invalid sort order", 400, "VALIDATION_ERROR");
    }
    return {
        title: typeof value.title === "string" ? value.title.trim() || null : null,
        image_src: value.image_src,
        instagram_url: value.instagram_url,
        sort_order: typeof value.sort_order === "number" ? value.sort_order : 0,
    };
}

router.post("/trends", async (req, res) => {
    const parsed = validateTrend(req.body);
    const id = parsed.image_src.split("/")[3];
    if (!await AppDataSource.getRepository(MediaFile).exists({ where: { id } })) throw new AppError("Image not found", 400, "MEDIA_NOT_FOUND");
    const salon = await AppDataSource.getRepository(SalonContent).findOneBy({ id: 1 });
    if (!salon) throw new AppError("Salon content not found", 404, "SALON_CONTENT_NOT_FOUND");
    const item = await AppDataSource.getRepository(InstagramTrendItem).save({
        salon_content_id: salon.id, ...parsed,
    });
    return res.status(201).json({ success: { message: "Trend created", data: item } });
});

router.put("/trends/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) throw new AppError("Invalid trend id", 400, "VALIDATION_ERROR");
    const parsed = validateTrend(req.body);
    const mediaId = parsed.image_src.split("/")[3];
    if (!await AppDataSource.getRepository(MediaFile).exists({ where: { id: mediaId } })) throw new AppError("Image not found", 400, "MEDIA_NOT_FOUND");
    const repo = AppDataSource.getRepository(InstagramTrendItem);
    const item = await repo.findOneBy({ id, salon_content_id: 1 });
    if (!item) throw new AppError("Trend not found", 404, "TREND_NOT_FOUND");
    repo.merge(item, parsed);
    return res.json({ success: { message: "Trend updated", data: await repo.save(item) } });
});

router.delete("/trends/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) throw new AppError("Invalid trend id", 400, "VALIDATION_ERROR");
    const repo = AppDataSource.getRepository(InstagramTrendItem);
    const item = await repo.findOneBy({ id, salon_content_id: 1 });
    if (!item) throw new AppError("Trend not found", 404, "TREND_NOT_FOUND");
    await repo.remove(item);
    return res.json({ success: { message: "Trend removed", data: { id } } });
});

export default router;
