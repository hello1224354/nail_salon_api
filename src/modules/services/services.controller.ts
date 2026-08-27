import { Request, Response } from "express";
import * as serviceService from "./services.service";

export const getAllServices = async (req: Request, res: Response) => {
    try {
        const data = await serviceService.getAllServices();
        res.status(200).json({ message: "Success", data });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const createService = async (req: Request, res: Response) => {
    try {
        const result = await serviceService.createService(req.body);
        const newId = result.identifiers[0].id; 
        res.status(201).json({ message: "Create new service successfully", id: newId });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateService = async (req: Request, res: Response) => {
    try {
        await serviceService.updateService(req.params.id as string, req.body);
        res.status(200).json({ message: "Update service successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const deleteService = async (req: Request, res: Response) => {
    try {
        await serviceService.deleteService(req.params.id as string);
        res.status(200).json({ message: "Delete service successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getService = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = await serviceService.getService(req.params.id as string);
        if (!data) return res.status(404).json({ message: "Service not found" });
        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};