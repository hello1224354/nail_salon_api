import { Router } from "express";
import * as controller from "./appointments.controller";
import * as work from "./booking-work.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "../users/users.entity";
import { availabilityRateLimiter, bookingRateLimiter } from "../../common/middleware/rate-limit.middleware";

const router = Router();

router.get("/", authenticate, controller.getAllAppointments);
router.get("/transfers/peers", authenticate, requireRole(UserRole.STAFF), work.peers);
router.get("/transfers/requests", authenticate, requireRole(UserRole.STAFF), work.requests);
router.post("/transfers/:requestId/:action", authenticate, requireRole(UserRole.STAFF), work.decideTransfer);
router.post("/:id/transfers", authenticate, requireRole(UserRole.STAFF), work.createTransfer);
router.put("/:id/work-prices", authenticate, requireRole(UserRole.STAFF), work.saveMyWork);
router.get("/availability", authenticate, requireRole(UserRole.CUSTOMER, UserRole.ADMIN), availabilityRateLimiter, controller.getAvailability);
router.get("/admin/today-summary", authenticate, requireRole(UserRole.ADMIN), controller.getAdminTodaySummary);
router.get("/admin/month-summary", authenticate, requireRole(UserRole.ADMIN), controller.getAdminMonthSummary);
router.get("/admin/lifetime-summary", authenticate, requireRole(UserRole.ADMIN), controller.getAdminLifetimeSummary);
router.post("/", authenticate, requireRole(UserRole.CUSTOMER, UserRole.ADMIN), bookingRateLimiter, controller.createAppointment);
router.get("/:id", authenticate, controller.getAppointmentById);
router.put("/:id/actual-prices/:serviceId", authenticate, requireRole(UserRole.STAFF), controller.setActualPrice);
router.put("/:id", authenticate, requireRole(UserRole.STAFF, UserRole.ADMIN), controller.updateAppointment);
router.delete("/:id", authenticate, requireRole(UserRole.ADMIN), controller.deleteAppointment);

export default router;
