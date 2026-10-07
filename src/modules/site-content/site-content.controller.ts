import { Request, Response } from "express";
import { AppError } from "../../common/errors";
import * as siteContentService from "./site-content.service";

function parseBranchId(value: unknown): number {
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
        throw new AppError("Branch ID must be a positive integer", 400, "VALIDATION_ERROR");
    }

    const branchId = Number(value);

    if (!Number.isSafeInteger(branchId) || branchId < 1) {
        throw new AppError("Branch ID must be a positive safe integer", 400, "VALIDATION_ERROR");
    }

    return branchId;
}

export const getPublicContent = async (req: Request, res: Response) => {
    const branchId = parseBranchId(req.query.branch_id);
    const data = await siteContentService.getPublicContent(branchId);

    if (!data) {
        throw new AppError("Salon content not found", 404, "SALON_CONTENT_NOT_FOUND");
    }

    return res.status(200).json({
        success: {
            message: "Get salon content successfully",
            data,
        },
    });
};
