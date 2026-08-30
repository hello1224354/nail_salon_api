import { Router } from "express";
import * as controller from "./appointments.controller";

const router = Router();

router.post("/", controller.createAppointment);

export default router;