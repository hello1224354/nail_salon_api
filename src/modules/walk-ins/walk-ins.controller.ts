import { Request, Response } from "express";
import { AppError } from "../../common/errors";
import { parseCreateWalkInDto } from "./walk-ins.dto";
import { createWalkIn, listWalkIns } from "./walk-ins.service";

export async function create(req: Request, res: Response) {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
    const visit = await createWalkIn(req.user.id, parseCreateWalkInDto(req.body));
    return res.status(201).json({ success: { data: visit, message: "Walk-in visit recorded" } });
}

export async function list(req: Request, res: Response) {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
    const visits = await listWalkIns(req.user.id, req.user.role);
    return res.status(200).json({ success: { data: visits, message: "Walk-in visits" } });
}
