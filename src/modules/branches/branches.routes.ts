import { Router } from "express";
import * as controller from "./branches.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "../users/users.entity";

const router = Router();

router.get("/", controller.getAllBranches);
router.get("/admin", authenticate, requireRole(UserRole.ADMIN), controller.getAllBranchesForAdmin);
router.get("/:id", controller.getBranch);
router.post("/", authenticate, requireRole(UserRole.ADMIN), controller.createBranch);
router.put("/:id", authenticate, requireRole(UserRole.ADMIN), controller.updateBranch);
router.delete("/:id", authenticate, requireRole(UserRole.ADMIN), controller.deleteBranch);

export default router;
