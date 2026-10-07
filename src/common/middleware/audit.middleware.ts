import { NextFunction, Request, Response } from "express";
import { AuditEventType, createAuditLog } from "../../modules/audit/audit-log.service";

const MUTATION_METHODS = new Set(["POST", "PUT", "DELETE"]);

export const auditMutation = (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
        if (!MUTATION_METHODS.has(req.method)) return;
        if (!req.user) return;
        if (res.statusCode < 200 || res.statusCode >= 300) return;

        void createAuditLog({
            event_type: AuditEventType.HTTP_MUTATION,
            user_id: req.user.id,
            user_role: req.user.role,
            method: req.method,
            path: req.originalUrl,
            status_code: res.statusCode,
            request_id: res.locals.requestId,
        }).catch((error) => {
            console.error(`[${res.locals.requestId}] Failed to write audit log`, error);
        });
    });

    next();
};