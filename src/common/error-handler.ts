import { Request, Response, NextFunction } from "express";
import { QueryFailedError } from "typeorm";
import { AppError } from "./errors";

export const errorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message,
            }
        })
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