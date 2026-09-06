import { Router } from "express";
import * as controller from "./users.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "./users.entity";

const router = Router();

router.post("/register", controller.registerUser);
router.post("/login", controller.loginUser);
router.get("/me", authenticate, controller.getMe);
router.get("/admin-test", authenticate, requireRole(UserRole.ADMIN), controller.adminTest);

export default router;