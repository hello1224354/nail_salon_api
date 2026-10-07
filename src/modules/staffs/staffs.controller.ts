import { Request, Response } from "express";
import * as staffService from "./staffs.service";
import * as branchService from "../branches/branches.service";
import { AppError } from "../../common/errors";
import { parseCreateStaffDto, parseGetStaffsQuery, parseUpdateStaffDto } from "./staffs.dto";
import { parseUuidParam } from "../../common/validators";
import { AuditEventType, createAuditLog } from "../audit/audit-log.service";

function toPublicStaff(staff: Awaited<ReturnType<typeof staffService.getStaff>>) {
    if (!staff) return null;

    return {
        id: staff.user_id,
        branch_id: staff.branch_id,
        branch_name: staff.branch?.name ?? null,
        full_name: staff.user.full_name,
        phone: staff.user.phone,
        email: staff.user.email,
    };
}

function toAdminStaff(staff: NonNullable<Awaited<ReturnType<typeof staffService.getStaff>>>) {
    return {
        id: staff.user_id,
        branch_id: staff.branch_id,
        branch_name: staff.branch?.name ?? null,
        full_name: staff.user.full_name,
        phone: staff.user.phone,
        email: staff.user.email,
        created_at: staff.created_at,
        updated_at: staff.updated_at,
    };
}

async function auditStaffEvent(
    req: Request,
    res: Response,
    eventType: string,
    targetUserId: string
) {
    await createAuditLog({
        event_type: eventType,
        request_id: res.locals.requestId,
        user_id: req.user?.id ?? null,
        ip: req.ip,
        user_agent: req.get("user-agent") ?? null,
        detail: `target_user=${targetUserId}`,
    });
}

export const getAllStaffs = async (req: Request, res: Response) => {
    const data = await staffService.getAllStaffs(parseGetStaffsQuery(req.query));

    return res.status(200).json({
        success: {
            message: "Get all staffs successfully",
            data: data.map((staff) => toPublicStaff(staff)),
        }
    });
};

export const getAllStaffsForAdmin = async (req: Request, res: Response) => {
    const data = await staffService.getAllStaffsForAdmin(parseGetStaffsQuery(req.query));

    return res.status(200).json({
        success: {
            message: "Get all staffs for admin successfully",
            data: data.map((staff) => toAdminStaff(staff)),
        }
    });
};

export const getMyStaff = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const data = await staffService.getStaff(req.user.id);

    if (!data) {
        throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");
    }

    return res.status(200).json({
        success: {
            message: "Get current staff successfully",
            data: toPublicStaff(data),
        }
    });
};

export const createStaff = async (req: Request, res: Response) => {
    const data = await staffService.createStaff(parseCreateStaffDto(req.body));
    const staff = await staffService.getStaff(data.user_id);

    await auditStaffEvent(req, res, AuditEventType.STAFF_CREATED, data.user_id);

    return res.status(201).json({
        success: {
            message: "Create new staff successfully",
            data: staff ? toAdminStaff(staff) : data,
        }
    });
};

export const getStaffById = async (req: Request, res: Response) => {
    const staffId = parseUuidParam(req.params.id, "Staff id");
    const data = await staffService.getStaff(staffId);

    if (!data) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    const branch = await branchService.getBranch(data.branch_id);
    if (!branch) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Get staff ${req.params.id} successfully`,
            data: toAdminStaff(data),
        }
    });
};

export const updateStaff = async (req: Request, res: Response) => {
    const staffId = parseUuidParam(req.params.id, "Staff id");
    const input = parseUpdateStaffDto(req.body);
    const data = await staffService.updateStaff(staffId, input);

    if (!data) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    const staff = await staffService.getStaff(staffId);

    return res.status(200).json({
        success: {
            message: "Update staff successfully",
            data: staff ? toAdminStaff(staff) : data,
        }
    });
};

export const deleteStaff = async (req: Request, res: Response) => {
    const staffId = parseUuidParam(req.params.id, "Staff id");
    const data = await staffService.deleteStaff(staffId);

    if (!data) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    await auditStaffEvent(req, res, AuditEventType.STAFF_DELETED, staffId);

    return res.status(200).json({
        success: {
            message: "Delete staff permanently successfully",
            data: toAdminStaff(data),
        }
    });
};