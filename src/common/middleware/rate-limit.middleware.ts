import { rateLimit } from "express-rate-limit";
import { AppError } from "../errors";

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many login attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED");
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