import { Request, Response } from "express";
import * as staffService from "./staffs.service";
import * as branchService from "../branches/branches.service";
import { AppError } from "../../common/errors";
import { parseCreateStaffDto, parseGetStaffsQuery, parseUpdateStaffDto } from "./staffs.dto";
import { parseUuidParam } from "../../common/validators";

function toPublicStaff(staff: Awaited<ReturnType<typeof staffService.getStaff>>) {
    if (!staff) return null;

    return {
        id: staff.user_id,
        branch_id: staff.branch_id,
        full_name: staff.user.full_name,
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
        is_active: staff.user.is_active,
        created_at: staff.created_at,
        updated_at: staff.updated_at,
    };
}

export const getAllStaffs = async (req: Request, res: Response) => {
    const data = await staffService.getAllStaffs(parseGetStaffsQuery(req.query));

    return res.status(200).json({
        success: {
            message: "Get all staffs successfully",
            data: data.map((staff) => ({
                id: staff.user_id,
                branch_id: staff.branch_id,
                full_name: staff.user.full_name,
            })),
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

export const createStaff = async (req: Request, res: Response) => {
    const data = await staffService.createStaff(parseCreateStaffDto(req.body));
    const staff = await staffService.getStaff(data.user_id);

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

    if (!data || !data.user.is_active) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    const branch = await branchService.getBranch(data.branch_id);
    if (!branch || !branch.is_active) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Get staff ${req.params.id} successfully`,
            data: toPublicStaff(data),
        }
    });
};

export const updateStaff = async (req: Request, res: Response) => {
    const staffId = parseUuidParam(req.params.id, "Staff id");
    const data = await staffService.updateStaff(staffId, parseUpdateStaffDto(req.body));

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

    const staff = await staffService.getStaff(staffId);

    return res.status(200).json({
        success: {
            message: "Delete staff successfully",
            data: staff ? toAdminStaff(staff) : data,
        }
    });
};