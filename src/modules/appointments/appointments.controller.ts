import { Request, Response } from "express";
import * as appointmentService from "./appointments.service";
import { parseCreateAppointmentDto } from "./appointments.dto";

export const createAppointment = async (req: Request, res: Response) => {
    const data = await appointmentService.createAppointment(parseCreateAppointmentDto(req.body));

    return res.status(201).json({
        success: {
            message: "Create new appointment successfully",
            data,
        }
    });
};