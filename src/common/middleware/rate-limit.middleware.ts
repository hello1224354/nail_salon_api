import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { AppError } from "../errors";

// All route-level middleware admits at least 100 calls per configured window.
// Security checks such as per-account failed-login audits and per-OTP attempt
// limits remain independent safeguards against brute-force attacks.
export const API_REQUEST_LIMIT = 100;

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: API_REQUEST_LIMIT,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many login attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: API_REQUEST_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many registration attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const mfaRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: API_REQUEST_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many MFA attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const passwordRecoveryRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: API_REQUEST_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many password recovery attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const refreshRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: API_REQUEST_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many session refresh attempts", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const accountOtpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: API_REQUEST_LIMIT,
    keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ""),
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many verification code requests. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const sensitiveAccountActionRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: API_REQUEST_LIMIT,
    keyGenerator: (req) => req.user!.id,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many sensitive account attempts. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const bookingRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: API_REQUEST_LIMIT,
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

export const mediaUploadRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: API_REQUEST_LIMIT,
    keyGenerator: (req) => req.user!.id,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many image uploads. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});

export const AVAILABILITY_REQUESTS_PER_MINUTE = API_REQUEST_LIMIT;

export const availabilityRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: AVAILABILITY_REQUESTS_PER_MINUTE,
    keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ""),
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new AppError("Too many availability requests. Try again later", 429, "RATE_LIMIT_EXCEEDED");
    },
});
