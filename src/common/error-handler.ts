import { Request, Response, NextFunction } from "express";
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

    console.error(error);

    return res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Internal server error",
            }
        })
}