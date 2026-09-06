import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors";
import { env } from "../../config/env";
import { UserRole } from "../../modules/users/users.entity";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;

    if (!authorization) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) throw new AppError("Invalid authorization header", 401, "INVALID_TOKEN");

    let payload;

    try {
        payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
        throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
    }

    if (typeof payload === "string") throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");

    if (typeof payload.sub !== "string") throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");

    if (!Object.values(UserRole).includes(payload.role as UserRole)) throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");

    req.user = {
        id: payload.sub,
        role: payload.role as UserRole,
    };

    next();
};