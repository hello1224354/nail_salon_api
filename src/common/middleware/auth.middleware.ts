import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors";
import { env } from "../../config/env";
import * as userService from "../../modules/users/users.service";
import { getAccessTokenVerifyOptions } from "../../modules/users/auth-session.service";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;

    if (!authorization) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const [scheme, token, extra] = authorization.split(" ");

    if (scheme !== "Bearer" || !token || extra !== undefined) {
        throw new AppError("Invalid authorization header", 401, "INVALID_TOKEN");
    }

    let payload: jwt.JwtPayload;

    try {
        const verified = jwt.verify(token, env.JWT_SECRET, getAccessTokenVerifyOptions());
        if (typeof verified === "string") throw new Error("Invalid payload");
        payload = verified;
    } catch {
        throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
    }

    if (
        typeof payload.sub !== "string" ||
        payload.type !== "access" ||
        typeof payload.ver !== "number" ||
        !Number.isInteger(payload.ver)
    ) {
        throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");
    }

    const user = await userService.getUser(payload.sub);

    if (!user) throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
    if (!user.is_active) throw new AppError("User account is inactive", 403, "USER_INACTIVE");

    if (payload.ver !== user.token_version) {
        throw new AppError("Session has been revoked", 401, "TOKEN_REVOKED");
    }

    req.user = {
        id: user.id,
        role: user.role,
    };

    next();
};