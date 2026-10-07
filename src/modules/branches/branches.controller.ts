import { Request, Response } from "express";
import * as branchService from "./branches.service";
import { AppError } from "../../common/errors";
import { parsePositiveIntParam } from "../../common/validators";
import { parseCreateBranchDto, parseGetBranchesQuery, parseUpdateBranchDto } from "./branches.dto";

export const getAllBranches = async (req: Request, res: Response) => {
    const data = await branchService.getAllBranches(parseGetBranchesQuery(req.query));

    return res.status(200).json({
        success: { message: "Get all branches successfully", data }
    });
};

export const getAllBranchesForAdmin = async (req: Request, res: Response) => {
    const data = await branchService.getAllBranchesForAdmin(parseGetBranchesQuery(req.query));

    return res.status(200).json({
        success: { message: "Get all branches for admin successfully", data }
    });
};

export const getBranch = async (req: Request, res: Response) => {
    const branchId = parsePositiveIntParam(req.params.id, "Branch id");
    const data = await branchService.getBranch(branchId);

    if (!data) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");

    return res.status(200).json({
        success: { message: `Get branch ${req.params.id} successfully`, data }
    });
};

export const createBranch = async (req: Request, res: Response) => {
    const data = await branchService.createBranch(parseCreateBranchDto(req.body));

    return res.status(201).json({
        success: { message: "Create new branch successfully", data }
    });
};

export const updateBranch = async (req: Request, res: Response) => {
    const branchId = parsePositiveIntParam(req.params.id, "Branch id");
    const data = await branchService.updateBranch(branchId, parseUpdateBranchDto(req.body));

    if (!data) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");

    return res.status(200).json({
        success: { message: "Update branch successfully", data }
    });
};

export const deleteBranch = async (req: Request, res: Response) => {
    const branchId = parsePositiveIntParam(req.params.id, "Branch id");
    const data = await branchService.deleteBranch(branchId);

    if (!data) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");

    return res.status(200).json({
        success: { message: "Delete branch successfully", data }
    });
};
