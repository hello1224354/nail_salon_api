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
    const month = req.query.month;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);
    if (month !== undefined && typeof month !== "string") throw new AppError("Invalid month", 400, "VALIDATION_ERROR");
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        throw new AppError("Invalid pagination", 400, "VALIDATION_ERROR");
    }
    const visits = await listWalkIns(req.user.id, req.user.role, month, page, limit);
    return res.status(200).json({ success: { data: visits, message: "Walk-in visits" } });
}
