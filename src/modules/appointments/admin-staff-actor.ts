import type { Request, Response } from "express";
import { AppError } from "../../common/errors";
import { isUuid } from "../../common/validators";
import { UserRole } from "../users/users.entity";
import { createAuditLog } from "../audit/audit-log.service";

/** The employee who owns the work is separate from the authenticated operator. */
export function resolveWorkStaff(
    actor: { id: string; role: UserRole }, selected: unknown,
): string {
    if (actor.role === UserRole.STAFF) {
        if (selected !== undefined) throw new AppError("Staff cannot act for another employee", 403, "FORBIDDEN");
        return actor.id;
    }
    if (actor.role === UserRole.ADMIN) {
        if (!isUuid(selected)) {
            throw new AppError("ADMIN must select a valid employee", 400, "VALIDATION_ERROR");
        }
        return selected;
    }
    throw new AppError("Employee or admin access required", 403, "FORBIDDEN");
}

export async function auditAdminWork(
    req: Request, res: Response, staffId: string, action: string, subject: string,
): Promise<void> {
    if (req.user?.role !== UserRole.ADMIN) return;
    await createAuditLog({
        event_type: "ADMIN_STAFF_ACTION",
        request_id: res.locals.requestId,
        user_id: req.user.id,
        user_role: req.user.role,
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        detail: "action=" + action + ";staff=" + staffId + ";subject=" + subject,
    });
}
