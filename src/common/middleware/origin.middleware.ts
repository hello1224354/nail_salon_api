import { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../errors";
import { trustedOrigins, isTrustedOrigin } from "./trusted-origins";

const allowedOrigins = trustedOrigins(env.CORS_ORIGIN, env.CORS_EXTRA_ORIGINS);

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
    const origin = req.get("origin");

    if (!isTrustedOrigin(origin, allowedOrigins)) {
        throw new AppError("Untrusted request origin", 403, "UNTRUSTED_ORIGIN");
    }

    next();
}
