import { Router } from "express";
import * as controller from "./staffs.controller";

const router = Router();

router.get("/", controller.getAllStaffs);
router.post("/", controller.createStaff);
router.get("/:id", controller.getStaffById);
router.put("/:id", controller.updateStaff);
router.delete("/:id", controller.deleteStaff);

export default router;