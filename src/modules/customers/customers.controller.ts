import { Request, Response } from "express";
import * as customerService from "./customers.service";

export const getAllCustomers = async (req: Request, res: Response) => {
    try {
        const data = await customerService.getAllCustomers();
        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const newCustomer = await customerService.createCustomer(req.body);
        res.status(201).json({ message: "Create customer successfully", id: newCustomer.id });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getCustomerById = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = await customerService.getCustomer(req.params.id as string);
        if (!data) return res.status(404).json({ message: "Customer not found" });
        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        await customerService.updateCustomer(req.params.id as string, req.body);
        res.status(200).json({ message: "Update customer successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        await customerService.deleteCustomer(req.params.id as string);
        res.status(200).json({ message: "Delete customer successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};