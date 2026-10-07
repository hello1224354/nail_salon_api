import { Router } from "express";
import { publicReadRateLimiter } from "../../common/middleware/rate-limit.middleware";
import * as controller from "./site-content.controller";

const router = Router();

router.get("/", publicReadRateLimiter, controller.getPublicContent);

export default router;
