import { Router } from "express";
import * as controller from "./branches.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "../users/users.entity";
import { publicReadRateLimiter } from "../../common/middleware/rate-limit.middleware";

const router = Router();

router.get("/", publicReadRateLimiter, controller.getAllBranches);
router.get("/admin", authenticate, requireRole(UserRole.ADMIN), controller.getAllBranchesForAdmin);
router.get("/:id", publicReadRateLimiter, controller.getBranch);
router.post("/", authenticate, requireRole(UserRole.ADMIN), controller.createBranch);
router.put("/:id", authenticate, requireRole(UserRole.ADMIN), controller.updateBranch);
router.delete("/:id", authenticate, requireRole(UserRole.ADMIN), controller.deleteBranch);

export default router;
