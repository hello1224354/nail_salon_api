import { Request, Response } from "express";
import { AppError } from "../../common/errors";
import * as siteContentService from "./site-content.service";

export const getPublicContent = async (_req: Request, res: Response) => {
    const data = await siteContentService.getPublicContent();

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
