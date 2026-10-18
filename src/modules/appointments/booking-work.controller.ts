import { Request, Response } from "express";
import { AppError } from "../../common/errors";
import { parseUuidParam } from "../../common/validators";
import { parseWorkPrices, saveWorkPrices } from "./booking-work.service";
import { listTransferPeers, listTransferRequests, requestTransfer, respondToTransfer } from "./appointment-transfers.service";

export async function saveMyWork(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const appointmentId = parseUuidParam(req.params.id, "Appointment id");
    const result = await saveWorkPrices(appointmentId, req.user.id, parseWorkPrices(req.body));
    return res.status(200).json({ success: { data: result, message: "Work prices saved" } });
}

export async function peers(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const result = await listTransferPeers(req.user.id);
    return res.status(200).json({ success: { data: result } });
}

export async function requests(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const result = await listTransferRequests(req.user.id);
    return res.status(200).json({ success: { data: result } });
}

export async function createTransfer(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const appointmentId = parseUuidParam(req.params.id, "Appointment id");
    const body = req.body as Record<string, unknown> | undefined;
    const candidate = body?.to_staff_id;
    if (typeof candidate !== "string") throw new AppError("Select receiving staff", 400, "VALIDATION_ERROR");
    const toStaffId = parseUuidParam(candidate, "Receiving staff");
    const result = await requestTransfer(appointmentId, req.user.id, toStaffId);
    return res.status(201).json({ success: { data: result, message: "Transfer request sent" } });
}

export async function decideTransfer(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const id = parseUuidParam(req.params.requestId, "Transfer request");
    const action = req.params.action;
    if (action !== "accept" && action !== "decline" && action !== "cancel") {
        throw new AppError("Invalid transfer action", 400, "VALIDATION_ERROR");
    }
    const result = await respondToTransfer(id, req.user.id, action);
    return res.status(200).json({ success: { data: result, message: "Transfer updated" } });
}
