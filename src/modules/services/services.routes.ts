import { Router } from "express";
import * as controller from "./services.controller"

const router = Router();

router.get("/", controller.getAllServices);
router.post("/", controller.createService);
router.get("/:id", controller.getService);
router.put("/:id", controller.updateService);
router.delete("/:id", controller.deleteService);

export default router;