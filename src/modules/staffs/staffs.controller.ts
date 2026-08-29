import { Request, Response } from "express";
import * as staffService from "./staffs.service";
import { AppError } from "../../common/errors";
import { parseCreateStaffDto, parseUpdateStaffDto } from "./staffs.dto";

export const getAllStaffs = async (req: Request, res: Response) => {
    const data = await staffService.getAllStaffs();

    return res.status(200).json({
        success: {
            message: "Get all staffs successfully",
            data,
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
    const data = await staffService.getStaff(req.params.id as string);

    if (!data) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Get staff ${req.params.id} successfully`,
            data,
        }
    });
};

export const updateStaff = async (req: Request, res: Response) => {
    const data = await staffService.updateStaff(req.params.id as string, parseUpdateStaffDto(req.body));

    if (!data) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: "Update staff successfully",
            data,
        }
    });
};

export const deleteStaff = async (req: Request, res: Response) => {
    const data = await staffService.deleteStaff(req.params.id as string);

    if (!data) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: "Delete staff successfully",
            data,
        }
    });
};