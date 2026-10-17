import { Request, Response, NextFunction } from "express";
import { QueryFailedError } from "typeorm";
import { AppError } from "./errors";

// Public responses for sensitive operations must not expose token state,
// account existence, OTP expiry/attempts, provider configuration or rate-limit causes.
// Preserve only client protocol distinctions needed to refresh sessions safely.
const sessionCodes = new Set([
    "AUTHENTICATION_REQUIRED", "INVALID_TOKEN", "TOKEN_REVOKED",
    "INVALID_REFRESH_SESSION", "REFRESH_TOKEN_REUSE", "AUTHENTICATION_RESTART_REQUIRED",
]);
const verificationCodes = new Set([
    "INVALID_MFA_CODE", "INVALID_RESET_CODE", "INVALID_VERIFICATION_CODE",
    "INVALID_PASSWORD_CHANGE_CODE",
]);
const verificationUnavailableCodes = new Set([
    "EMAIL_REQUIRED", "MFA_EMAIL_REQUIRED", "MFA_NOT_CONFIGURED",
    "EMAIL_NOT_CONFIGURED", "EMAIL_DELIVERY_FAILED",
]);

function publicApplicationError(error: AppError, req: Request) {
    const authRoute = req.baseUrl === "/api/users" &&
        /^\/(?:login|register|password|session)(?:\/|$)/.test(req.path);

    if (sessionCodes.has(error.code)) {
        return { code: "SESSION_INVALID", message: "Authentication required. Please sign in again." };
    }
    if (verificationCodes.has(error.code)) {
        return { code: "VERIFICATION_FAILED", message: "Verification was unsuccessful. Please check the details and try again." };
    }
    if (verificationUnavailableCodes.has(error.code)) {
        return { code: "VERIFICATION_UNAVAILABLE", message: "Verification is temporarily unavailable. Please try again later." };
    }
    if (error.code === "INVALID_CREDENTIALS" || error.code === "INVALID_CURRENT_PASSWORD") {
        return { code: error.code === "INVALID_CREDENTIALS" ? "INVALID_CREDENTIALS" : "CREDENTIAL_CHECK_FAILED",
            message: "Credentials could not be verified." };
    }
    if (error.code === "FORBIDDEN" || error.code === "UNTRUSTED_ORIGIN") {
        return { code: "FORBIDDEN", message: "This request is not permitted." };
    }
    if (error.code === "RATE_LIMIT_EXCEEDED") {
        return { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." };
    }
    if (error.code === "REFRESH_RACE") {
        // The frontend needs this code to retry a concurrently rotated session.
        return { code: "REFRESH_RACE", message: "Please retry this request." };
    }
    if (error.code === "REGISTRATION_UNAVAILABLE" ||
        (req.baseUrl === "/api/users" && req.path === "/register" &&
            (error.code === "EMAIL_ALREADY_EXISTS" || error.code === "PHONE_ALREADY_EXISTS"))) {
        return { code: "REGISTRATION_UNAVAILABLE", message: "Unable to complete registration with these details." };
    }
    if (authRoute && error.code === "VALIDATION_ERROR") {
        // The UI provides its own local field-level validation, but the API
        // must not be an account/credential validation oracle.
        return { code: "AUTH_INPUT_INVALID", message: "Invalid request details." };
    }
    return null;
}

export const errorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof AppError) {
        const publicError = publicApplicationError(error, req);
        if (publicError) {
            // Never log request bodies, credentials, tokens, cookies or raw query strings.
            // Log the original internal reason and a correlation ID only on the server.
            console.warn("[security-rejection]", {
                request_id: res.locals.requestId,
                route: `${req.baseUrl}${String(req.route?.path ?? "")}`,
                method: req.method,
                status: error.statusCode,
                internal_code: error.code,
                reason: error.message,
            });
        }
        return res.status(error.statusCode).json({
            error: {
                code: publicError?.code ?? error.code,
                message: publicError?.message ?? error.message,
                request_id: res.locals.requestId,
            },
        });
    }

    if (error !== null && typeof error === "object" && "type" in error && error.type === "entity.parse.failed") {
        return res.status(400).json({
            error: {
                code: "INVALID_JSON",
                message: "Request body contains invalid JSON",
            }
        });
    }

    if (error !== null && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
        return res.status(413).json({
            error: {
                code: "PAYLOAD_TOO_LARGE",
                message: "Request body is too large",
            }
        });
    }

    if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };

        if (driverError.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: {
                    code: "DUPLICATE_RESOURCE",
                    message: "Resource already exists",
                }
            });
        }

        if (driverError.code === "ER_ROW_IS_REFERENCED_2" ||
            driverError.code === "ER_ROW_IS_REFERENCED") {
            // Do not expose table names, SQL queries or customer data in responses.
            console.warn(`[${res.locals.requestId}] Blocked deletion of referenced resource: ${req.method} ${req.path}`);
            return res.status(409).json({
                error: {
                    code: "RESOURCE_IN_USE",
                    message: "Cannot delete this item because other records still reference it",
                    request_id: res.locals.requestId,
                }
            });
        }
    }

    console.error(`[${res.locals.requestId}]`, error);

    return res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal server error",
            request_id: res.locals.requestId,
        }
    })
}