import { Request, Response } from "express";
import * as appointmentService from "./appointments.service";
import { parseCreateAppointmentDto, parseGetAppointmentsQuery, parseUpdateAppointmentDto } from "./appointments.dto";
import { AppError } from "../../common/errors";

export const createAppointment = async (req: Request, res: Response) => {
    const data = await appointmentService.createAppointment(parseCreateAppointmentDto(req.body));

    return res.status(201).json({
        success: {
            message: "Create new appointment successfully",
            data,
        }
    });
};

export const getAllAppointments = async (req: Request, res: Response) => {
    const data = await appointmentService.getAllAppointments(parseGetAppointmentsQuery(req.query));

    return res.status(200).json({
        success: {
            message: "Get all appointments successfully",
            data,
        }
    });
};

export const getAppointmentById = async (req: Request, res: Response) => {
    const data = await appointmentService.getAppointment(req.params.id as string);

    if (!data) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Get appointment ${req.params.id} successfully`,
            data,
        }
    });
};

export const updateAppointment = async (req: Request, res: Response) => {
    const data = await appointmentService.updateAppointment(req.params.id as string, parseUpdateAppointmentDto(req.body));

    if (!data) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Update appointment ${req.params.id} successfully`,
            data,
        }
    });
};