import { Request, Response } from "express";
import * as serviceService from "./services.service";
import { AppError } from "../../common/errors";
import { parseCreateServiceDto, parseUpdateServiceDto } from "./services.dto";

export const getAllServices = async (req: Request, res: Response) => {
    const data = await serviceService.getAllServices();
    return res.status(200).json({
        success: {
            message: "Get all services successfully",
            data,
        }
    });
};

export const getService = async (req: Request, res: Response) => {
    const data = await serviceService.getService(req.params.id as string);

    if (!data) throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Get service ${req.params.id} successfully`,
            data,
        }
    });
};

export const createService = async (req: Request, res: Response) => {
    const data = await serviceService.createService(parseCreateServiceDto(req.body));

    return res.status(201).json({
        success: {
            message: `Create new service successfully`,
            data,
        }
    });
};

export const updateService = async (req: Request, res: Response) => {
    const data = await serviceService.updateService(req.params.id as string, parseUpdateServiceDto(req.body));
    if (!data) throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: "Update service successfully",
            data,
        }
    });
};

export const deleteService = async (req: Request, res: Response) => {
    const data = await serviceService.deleteService(req.params.id as string);
    if (!data) throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: "Delete service successfully",
            data,
        }
    });
};

