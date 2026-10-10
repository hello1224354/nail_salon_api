import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "../users/users.entity";
import * as controller from "./walk-ins.controller";

const router = Router();
router.get("/", authenticate, requireRole(UserRole.STAFF, UserRole.ADMIN), controller.list);
router.post("/", authenticate, requireRole(UserRole.STAFF), controller.create);
export default router;
