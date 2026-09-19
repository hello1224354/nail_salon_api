import { Request, Response } from "express";
import * as staffService from "./staffs.service";
import { AppError } from "../../common/errors";
import { parseCreateStaffDto, parseGetStaffsQuery, parseUpdateStaffDto } from "./staffs.dto";
import { parseUuidParam } from "../../common/validators";

export const getAllStaffs = async (req: Request, res: Response) => {
    const data = await staffService.getAllStaffs(parseGetStaffsQuery(req.query));

    const publicData = {
        ...data,
        staffs: data.staffs.map((staff) => {
            return {
                id: staff.user_id,
                full_name: staff.user.full_name,
            };
        }),
    };

    return res.status(200).json({
        success: {
            message: "Get all staffs successfully",
            data: publicData,
        }
    });
};

export const createStaff = async (req: Request, res: Response) => {
    const data = await staffService.createStaff(parseCreateStaffDto(req.body));

    return res.status(201).json({
        success: {
            message: "Create new staff successfully",
            data,
        }
    });
};

export const getStaffById = async (req: Request, res: Response) => {
    const staffId = parseUuidParam(req.params.id, "Staff id");

    const data = await staffService.getStaff(staffId);

    if (!data) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    const publicData = {
        id: data.user_id,
        full_name: data.user.full_name,
    };

    return res.status(200).json({
        success: {
            message: `Get staff ${req.params.id} successfully`,
            data: publicData,
        }
    });
};

export const updateStaff = async (req: Request, res: Response) => {
    const staffId = parseUuidParam(req.params.id, "Staff id");

    const data = await staffService.updateStaff(staffId, parseUpdateStaffDto(req.body));

    if (!data) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: "Update staff successfully",
            data,
        }
    });
};

export const deleteStaff = async (req: Request, res: Response) => {
    const staffId = parseUuidParam(req.params.id, "Staff id");

    const data = await staffService.deleteStaff(staffId);

    if (!data) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: "Delete staff successfully",
            data,
        }
    });
};