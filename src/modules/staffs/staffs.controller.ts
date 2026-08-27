import { Request, Response } from "express";
import * as staffService from "./staffs.service";

export const getAllStaffs = async (req: Request, res: Response) => {
    try {
        const data = await staffService.getAllStaffs();
        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const createStaff = async (req: Request, res: Response) => {
    try {
        const newStaff = await staffService.createStaff(req.body);
        res.status(201).json({ message: "Create staff successfully", id: newStaff.id });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getStaffById = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = await staffService.getStaff(req.params.id as string);
        if (!data) return res.status(404).json({ message: "Staff not found" });
        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateStaff = async (req: Request, res: Response) => {
    try {
        await staffService.updateStaff(req.params.id as string, req.body);
        res.status(200).json({ message: "Update staff successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const deleteStaff = async (req: Request, res: Response) => {
    try {
        await staffService.deleteStaff(req.params.id as string);
        res.status(200).json({ message: "Delete staff successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};