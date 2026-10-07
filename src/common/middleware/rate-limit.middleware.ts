import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { AppError } from "../errors";
import { AuditEventType, createAuditLog } from "../../modules/audit/audit-log.service";

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        void createAuditLog({
            event_type: AuditEventType.LOGIN_RATE_LIMITED,
            request_id: res.locals.requestId,
            identifier: typeof req.body?.phone === "string" ? req.body.phone : null,
            ip: req.ip,
            user_agent: req.get("user-agent") ?? null,
            detail: "ip_limit",
        })
            .catch((error) => {
                console.error(`[${res.locals.requestId}] Failed to audit login rate limit`, error);
            })
            .finally(() => {
                next(new AppError("Too many login attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED"));
            });
    },
});

export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many registration attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const mfaRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many MFA attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const passwordRecoveryRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many password recovery attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const refreshRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many session refresh attempts", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const bookingRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    keyGenerator: (req) => req.user!.id,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many booking attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const publicReadRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many read requests. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const authenticatedReadRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ""),
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many read requests. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const availabilityRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ""),
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many availability requests. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});
