import { Router } from "express";
import * as controller from "./services.controller"
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "../users/users.entity";

const router = Router();

router.get("/", controller.getAllServices);
router.get("/:id", controller.getService);
router.post("/", authenticate, requireRole(UserRole.ADMIN), controller.createService);
router.put("/:id", authenticate, requireRole(UserRole.ADMIN), controller.updateService);
router.delete("/:id", authenticate, requireRole(UserRole.ADMIN), controller.deleteService);

export default router;