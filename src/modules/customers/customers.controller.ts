import { Request, Response } from "express";
import * as customerService from "./customers.service";
import { AppError } from "../../common/errors";
import { parseCreateCustomerDto, parseUpdateCustomerDto } from "./customers.dto";

export const getAllCustomers = async (req: Request, res: Response) => {
    const data = await customerService.getAllCustomers();

    return res.status(200).json({
        success: {
            message: "Get all customers successfully",
            data,
        }
    });
};

export const createCustomer = async (req: Request, res: Response) => {
    const data = await customerService.createCustomer(parseCreateCustomerDto(req.body));

    return res.status(201).json({
        success: {
            message: "Create new customer successfully",
            data,
        }
    });
};

export const getCustomerById = async (req: Request, res: Response) => {
    const data = await customerService.getCustomer(req.params.id as string);

    if (!data) throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Get customer ${req.params.id} successfully`,
            data,
        }
    });
};

export const updateCustomer = async (req: Request, res: Response) => {
    const data = await customerService.updateCustomer(req.params.id as string, parseUpdateCustomerDto(req.body));

    if (!data) throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: "Update customer successfully",
            data,
        }
    });
};

export const deleteCustomer = async (req: Request, res: Response) => {
    const data = await customerService.deleteCustomer(req.params.id as string);

    if (!data) throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: "Delete customer successfully",
            data,
        }
    });
};