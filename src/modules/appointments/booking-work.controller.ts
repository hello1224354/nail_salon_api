import { Request, Response } from "express";
import { AppError } from "../../common/errors";
import { parseUuidParam } from "../../common/validators";
import { parseWorkPrices, saveWorkPrices } from "./booking-work.service";
import { assignAvailableServiceHelper, cancelServiceHelper } from "./booking-service-assistance.service";
import { lookupBookingForReception } from "./booking-reception.service";
import { resolveWorkStaff, auditAdminWork } from "./admin-staff-actor";
import { UserRole } from "../users/users.entity";
import { listTransferPeers, listTransferRequests, requestTransfer, respondToTransfer } from "./appointment-transfers.service";

export async function saveMyWork(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const appointmentId = parseUuidParam(req.params.id, "Appointment id");
    const staffId = resolveWorkStaff(req.user, (req.body as Record<string, unknown> | undefined)?.staff_id);
    const result = await saveWorkPrices(appointmentId, staffId, parseWorkPrices(req.body));
    await auditAdminWork(req, res, staffId, "SAVE_WORK_PRICES", appointmentId);
    return res.status(200).json({ success: { data: result, message: "Work prices saved" } });
}

export async function assignHelper(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const appointmentId = parseUuidParam(req.params.id, "Appointment id");
    const body = (req.body ?? {}) as Record<string, unknown>;
    const staffId = resolveWorkStaff(req.user, body.staff_id);
    const serviceId = parseUuidParam(body.service_id, "Service id");
    const result = await assignAvailableServiceHelper(appointmentId, staffId, serviceId);
    await auditAdminWork(req, res, staffId, "ASSIGN_SERVICE_HELPER", appointmentId);
    return res.status(201).json({ success: { data: result, message: "Available service helper assigned" } });
}

export async function cancelHelper(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const appointmentId = parseUuidParam(req.params.id, "Appointment id");
    const helperId = parseUuidParam(req.params.helperId, "Helper id");
    const staffId = resolveWorkStaff(req.user, (req.body as Record<string, unknown> | undefined)?.staff_id);
    await cancelServiceHelper(appointmentId, staffId, helperId);
    await auditAdminWork(req, res, staffId, "CANCEL_SERVICE_HELPER", appointmentId);
    return res.status(200).json({ success: { data: null, message: "Service helper removed" } });
}

export async function peers(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const staffId = resolveWorkStaff(req.user, req.query.staff_id);
    const result = await listTransferPeers(staffId);
    return res.status(200).json({ success: { data: result } });
}

export async function requests(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const result = req.user.role === UserRole.ADMIN ? await listTransferRequests(null) : await listTransferRequests(req.user.id);
    return res.status(200).json({ success: { data: result } });
}

export async function createTransfer(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const appointmentId = parseUuidParam(req.params.id, "Appointment id");
    const body = req.body as Record<string, unknown> | undefined;
    const candidate = body?.to_staff_id;
    if (typeof candidate !== "string") throw new AppError("Select receiving staff", 400, "VALIDATION_ERROR");
    const toStaffId = parseUuidParam(candidate, "Receiving staff");
    const senderId = resolveWorkStaff(req.user, body?.from_staff_id);
    const result = await requestTransfer(appointmentId, senderId, toStaffId);
    await auditAdminWork(req, res, senderId, "REQUEST_TRANSFER", appointmentId);
    return res.status(201).json({ success: { data: result, message: "Transfer request sent" } });
}

export async function decideTransfer(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const id = parseUuidParam(req.params.requestId, "Transfer request");
    const action = req.params.action;
    if (action !== "accept" && action !== "decline" && action !== "cancel") {
        throw new AppError("Invalid transfer action", 400, "VALIDATION_ERROR");
    }
    // A transfer only takes effect if the receiving employee personally accepts.
    // ADMIN may cancel on behalf of the sender, but cannot accept/decline for B.
    if (req.user.role === UserRole.ADMIN && action !== "cancel") {
        throw new AppError("Receiving employee must personally respond", 403, "FORBIDDEN");
    }
    const actingId = resolveWorkStaff(req.user, (req.body as Record<string, unknown> | undefined)?.staff_id);
    const result = await respondToTransfer(id, actingId, action);
    await auditAdminWork(req, res, actingId, "TRANSFER_" + action.toUpperCase(), id);
    return res.status(200).json({ success: { data: result, message: "Transfer updated" } });
}

export async function receptionLookup(req: Request, res: Response) {
    if (!req.user) throw new AppError("Login required", 401, "AUTHENTICATION_REQUIRED");
    const result = req.user.role === UserRole.ADMIN
        ? await lookupBookingForReception(req.user.id, req.query.q, true)
        : await lookupBookingForReception(req.user.id, req.query.q);
    return res.status(200).json({ success: { data: result } });
}
