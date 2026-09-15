import { Router } from "express";
import * as controller from "./staffs.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "../users/users.entity";

const router = Router();

router.get("/", controller.getAllStaffs);
router.get("/:id", controller.getStaffById);
router.post("/", authenticate, requireRole(UserRole.ADMIN), controller.createStaff);
router.put("/:id", authenticate, requireRole(UserRole.ADMIN), controller.updateStaff);
router.delete("/:id", authenticate, requireRole(UserRole.ADMIN), controller.deleteStaff);

export default router;