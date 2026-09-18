import { Router } from "express";
import * as controller from "./appointments.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "../users/users.entity";
import { bookingRateLimiter } from "../../common/middleware/rate-limit.middleware";

const router = Router();

router.get("/", authenticate, controller.getAllAppointments);
router.post("/", authenticate, requireRole(UserRole.CUSTOMER, UserRole.ADMIN), bookingRateLimiter, controller.createAppointment);
router.get("/:id", authenticate, controller.getAppointmentById);
router.put("/:id", authenticate, requireRole(UserRole.STAFF, UserRole.ADMIN), controller.updateAppointment);

export default router;