import { Request, Response } from "express";
import { AppError } from "../../common/errors";
import { parseCreateWalkInDto } from "./walk-ins.dto";
import { parseWalkInListQuery } from "./walk-ins.query";
import { parseUuidParam } from "../../common/validators";
import { createWalkIn, listWalkIns, updateWalkIn, deleteWalkIn } from "./walk-ins.service";
import { UserRole } from "../users/users.entity";
import { resolveWorkStaff, auditAdminWork } from "../appointments/admin-staff-actor";

export async function create(req: Request, res: Response) {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
    let staffId = req.user.id;
    let submitted = req.body;
    if (req.user.role === UserRole.ADMIN) {
        const input = req.body as Record<string, unknown> | undefined;
        staffId = resolveWorkStaff(req.user, input?.staff_id);
        const { staff_id: _selectedEmployee, ...customerData } = input ?? {};
        submitted = customerData;
    }
    // For STAFF, the body is parsed unchanged: employees cannot select another staff ID.
    const visit = await createWalkIn(staffId, parseCreateWalkInDto(submitted));
    await auditAdminWork(req, res, staffId, "CREATE_WALK_IN", visit.id);
    return res.status(201).json({ success: { data: visit, message: "Walk-in visit recorded" } });
}

export async function list(req: Request, res: Response) {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
    const visits = await listWalkIns(req.user.id, req.user.role, parseWalkInListQuery(req.query));
    return res.status(200).json({ success: { data: visits, message: "Walk-in visits" } });
}

export async function update(req: Request, res: Response) {
    const id = parseUuidParam(req.params.id, "Walk-in id");
    const visit = await updateWalkIn(id, parseCreateWalkInDto(req.body));
    if (!visit) throw new AppError("Walk-in visit not found", 404, "WALK_IN_NOT_FOUND");
    return res.status(200).json({ success: { data: visit, message: "Walk-in corrected" } });
}

export async function remove(req: Request, res: Response) {
    const id = parseUuidParam(req.params.id, "Walk-in id");
    const visit = await deleteWalkIn(id);
    if (!visit) throw new AppError("Walk-in visit not found", 404, "WALK_IN_NOT_FOUND");
    return res.status(200).json({ success: { data: visit, message: "Walk-in deleted" } });
}
