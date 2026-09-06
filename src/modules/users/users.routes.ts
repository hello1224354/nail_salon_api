import { Router } from "express";
import * as controller from "./users.controller";
import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();

router.post("/register", controller.registerUser);
router.post("/login", controller.loginUser);
router.get("/me", authenticate, controller.getMe);

export default router;