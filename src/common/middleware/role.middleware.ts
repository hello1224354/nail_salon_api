import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors";
import { UserRole } from "../../modules/users/users.entity";

export const requireRole = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

        if (!allowedRoles.includes(req.user.role)) throw new AppError("You do not have permission to perform this action", 403, "FORBIDDEN");

        next();
    };
};