import { Request, Response } from "express";
import * as serviceService from "./services.service";
import { AppError } from "../../common/errors";
import { parseCreateServiceDto, parseGetServicesQuery, parseUpdateServiceDto } from "./services.dto";
import { parseUuidParam } from "../../common/validators";

export const getAllServices = async (req: Request, res: Response) => {
    const data = await serviceService.getAllServices(parseGetServicesQuery(req.query));
    return res.status(200).json({
        success: {
            message: "Get all services successfully",
            data,
        }
    });
};

export const getService = async (req: Request, res: Response) => {
    const serviceId = parseUuidParam(req.params.id, "Service id");

    const data = await serviceService.getService(serviceId);

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
    const serviceId = parseUuidParam(req.params.id, "Service id");

    const data = await serviceService.updateService(serviceId, parseUpdateServiceDto(req.body));

    if (!data) throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: "Update service successfully",
            data,
        }
    });
};

export const deleteService = async (req: Request, res: Response) => {
    const serviceId = parseUuidParam(req.params.id, "Service id");

    const data = await serviceService.deleteService(serviceId);
    
    if (!data) throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: "Delete service successfully",
            data,
        }
    });
};

