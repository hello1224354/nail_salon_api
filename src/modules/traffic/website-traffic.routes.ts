import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { publicReadRateLimiter } from "../../common/middleware/rate-limit.middleware";
import { UserRole } from "../users/users.entity";
import * as controller from "./website-traffic.controller";

const router = Router();
router.post("/pulse", publicReadRateLimiter, controller.pulse);
router.get("/admin/summary", authenticate, requireRole(UserRole.ADMIN), controller.summary);
export default router;
