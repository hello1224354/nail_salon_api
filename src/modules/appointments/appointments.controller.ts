import { Request, Response } from "express";
import * as appointmentService from "./appointments.service";
import { parseCreateAppointmentDto, parseGetAppointmentsQuery, parseUpdateAppointmentDto } from "./appointments.dto";
import { AppError } from "../../common/errors";

export const createAppointment = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const data = await appointmentService.createAppointment(req.user.id, req.user.role, parseCreateAppointmentDto(req.body));

    return res.status(201).json({
        success: {
            message: "Create new appointment successfully",
            data,
        }
    });
};

export const getAllAppointments = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const data = await appointmentService.getAllAppointments(req.user.id, req.user.role, parseGetAppointmentsQuery(req.query));

    return res.status(200).json({
        success: {
            message: "Get all appointments successfully",
            data,
        }
    });
};

export const getAppointmentById = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const data = await appointmentService.getAppointment(req.params.id as string, req.user.id, req.user.role);

    if (!data) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Get appointment ${req.params.id} successfully`,
            data,
        }
    });
};

export const updateAppointment = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const data = await appointmentService.updateAppointment(req.params.id as string, req.user.id, req.user.role, parseUpdateAppointmentDto(req.body));

    if (!data) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Update appointment ${req.params.id} successfully`,
            data,
        }
    });
};