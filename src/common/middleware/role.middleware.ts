import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors";
import { UserRole } from "../../modules/users/users.entity";
import { hasRoleAccess } from "../role-permissions";

export const requireRole = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

        if (!hasRoleAccess(req.user.role, allowedRoles)) throw new AppError("You do not have permission to perform this action", 403, "FORBIDDEN");

        next();
    };
};