import { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../errors";

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
    const origin = req.get("origin");

    if (!origin || origin !== env.CORS_ORIGIN) {
        throw new AppError("Untrusted request origin", 403, "UNTRUSTED_ORIGIN");
    }

    next();
}
