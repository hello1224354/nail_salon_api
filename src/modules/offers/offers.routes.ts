import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { UserRole } from "../users/users.entity";
import * as controller from "./offers.controller";

const router = Router();

router.get("/", controller.getCurrentOffers);
router.get("/admin", authenticate, requireRole(UserRole.ADMIN), controller.getAllOffersForAdmin);
router.get("/:id", authenticate, requireRole(UserRole.ADMIN), controller.getOffer);
router.post("/", authenticate, requireRole(UserRole.ADMIN), controller.createOffer);
router.put("/:id", authenticate, requireRole(UserRole.ADMIN), controller.updateOffer);
router.delete("/:id", authenticate, requireRole(UserRole.ADMIN), controller.deleteOffer);

export default router;
