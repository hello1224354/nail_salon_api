import { Router } from "express";
import * as controller from "./users.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { requireRole } from "../../common/middleware/role.middleware";
import { requireTrustedOrigin } from "../../common/middleware/origin.middleware";
import { UserRole } from "./users.entity";
import {
    loginRateLimiter,
    mfaRateLimiter,
    passwordRecoveryRateLimiter,
    refreshRateLimiter,
    registerRateLimiter,
    sensitiveAccountActionRateLimiter,
} from "../../common/middleware/rate-limit.middleware";

const router = Router();

router.post("/register", registerRateLimiter, controller.registerUser);
router.post("/login", loginRateLimiter, controller.loginUser);
router.post("/login/mfa/verify", mfaRateLimiter, controller.verifyLoginMfa);

router.post(
    "/session/refresh",
    requireTrustedOrigin,
    refreshRateLimiter,
    controller.refreshSession
);
router.post(
    "/session/logout",
    requireTrustedOrigin,
    refreshRateLimiter,
    controller.logoutUser
);

router.post(
    "/password/forgot",
    passwordRecoveryRateLimiter,
    controller.forgotPassword
);
router.post(
    "/password/reset",
    passwordRecoveryRateLimiter,
    controller.resetPassword
);
router.post(
    "/password/change",
    authenticate,
    sensitiveAccountActionRateLimiter,
    controller.changePassword
);

router.get("/me", authenticate, controller.getMe);
router.delete("/me", authenticate, sensitiveAccountActionRateLimiter, controller.deleteMe);
router.get("/admin-test", authenticate, requireRole(UserRole.ADMIN), controller.adminTest);

export default router;