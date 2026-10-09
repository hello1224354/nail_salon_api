import { Router, raw } from "express";
import { AppError } from "../../common/errors";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { publicReadRateLimiter } from "../../common/middleware/rate-limit.middleware";
import { UserRole } from "../users/users.entity";
import { parseUuidParam } from "../../common/validators";
import * as media from "./media.service";

const router = Router();
const admin = [authenticate, requireRole(UserRole.ADMIN)];

router.get("/", ...admin, async (req, res) => {
    const rawPage = req.query.page;
    if (rawPage !== undefined && (typeof rawPage !== "string" || !/^[1-9]\d{0,3}$/.test(rawPage))) {
        throw new AppError("Invalid page", 400, "VALIDATION_ERROR");
    }
    const page = rawPage ? Number(rawPage) : 1;
    if (page > 1000) throw new AppError("Page too large", 400, "VALIDATION_ERROR");
    const data = await media.listMedia(page);
    return res.json({ success: { message: "Get media successfully", data } });
});

router.post("/", ...admin, raw({ type: () => true, limit: "5mb" }), async (req, res) => {
    if (!Buffer.isBuffer(req.body)) {
        throw new AppError("Binary image body is required", 400, "INVALID_MEDIA_TYPE");
    }
    const contentType = req.headers["content-type"]?.split(";")[0]?.trim().toLowerCase();
    const data = await media.uploadMedia(req.body, contentType, req.headers["x-file-name"], req.user!.id);
    return res.status(201).json({ success: { message: "Image uploaded", data } });
});

// Public read enables existing Next.js Image components to use same-origin /api/media URLs.
// Object keys and R2 credentials never leave the backend.
router.get("/:id/file", publicReadRateLimiter, async (req, res) => {
    const id = parseUuidParam(req.params.id, "Media id");
    const { file, bytes } = await media.readMedia(id);
    res.setHeader("Content-Type", file.mime_type);
    res.setHeader("Cache-Control", "public, max-age=3600, immutable");
    res.setHeader("Content-Disposition", "inline");
    return res.status(200).send(bytes);
});

router.delete("/:id", ...admin, async (req, res) => {
    const id = parseUuidParam(req.params.id, "Media id");
    const data = await media.deleteMedia(id);
    return res.json({ success: { message: "Image deleted", data } });
});

export default router;
