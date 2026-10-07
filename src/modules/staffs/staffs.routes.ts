import { Router } from "express";
import * as controller from "./staffs.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "../users/users.entity";

const router = Router();

router.get("/", authenticate, requireRole(UserRole.ADMIN), controller.getAllStaffsForAdmin);
router.get("/admin", authenticate, requireRole(UserRole.ADMIN), controller.getAllStaffsForAdmin);
router.get("/me", authenticate, requireRole(UserRole.STAFF), controller.getMyStaff);
router.get("/:id", authenticate, requireRole(UserRole.ADMIN), controller.getStaffById);
router.post("/", authenticate, requireRole(UserRole.ADMIN), controller.createStaff);
router.put("/:id", authenticate, requireRole(UserRole.ADMIN), controller.updateStaff);
router.delete("/:id", authenticate, requireRole(UserRole.ADMIN), controller.deleteStaff);

export default router;