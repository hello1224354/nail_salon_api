import { Router } from "express";
import * as controller from "./appointments.controller";

const router = Router();

router.get("/", controller.getAllAppointments);
router.post("/", controller.createAppointment);
router.get("/:id", controller.getAppointmentById);

export default router;