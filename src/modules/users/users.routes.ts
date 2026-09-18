import { Router } from "express";
import * as controller from "./users.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "./users.entity";
import { loginRateLimiter, registerRateLimiter } from "../../common/middleware/rate-limit.middleware";

const router = Router();

router.post("/register", registerRateLimiter, controller.registerUser);
router.post("/login", loginRateLimiter, controller.loginUser);
router.get("/me", authenticate, controller.getMe);
router.get("/admin-test", authenticate, requireRole(UserRole.ADMIN), controller.adminTest);

export default router;