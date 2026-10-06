import { Request, Response } from "express";
import * as appointmentService from "./appointments.service";
import { parseCreateAppointmentDto, parseGetAppointmentsQuery, parseGetAvailabilityQuery, parseUpdateAppointmentDto } from "./appointments.dto";
import { AppError } from "../../common/errors";
import { Appointment } from "./appointments.entity";
import { parseUuidParam } from "../../common/validators";

function toAppointmentResponse(appointment: Appointment) {
    const { staff, user, branch, ...data } = appointment;

    return {
        ...data,
        customer: user ? {
            id: user.id,
            full_name: user.full_name,
            phone: user.phone,
            email: user.email,
        } : undefined,
        staff: staff ? {
            id: staff.user_id,
            full_name: staff.user?.full_name ?? null,
        } : undefined,
        branch: branch ? {
            id: branch.id,
            name: branch.name,
            address: branch.address,
        } : undefined,
    };
}

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
            data: {
                ...data,
                appointments: data.appointments.map(toAppointmentResponse),
            },
        }
    });
};

export const getAvailability = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const data = await appointmentService.getAvailability(
        parseGetAvailabilityQuery(req.query)
    );

    return res.status(200).json({
        success: {
            message: "Get appointment availability successfully",
            data,
        }
    });
};

export const getAppointmentById = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const appointmentId = parseUuidParam(req.params.id, "Appointment id");

    const data = await appointmentService.getAppointment(appointmentId, req.user.id, req.user.role);

    if (!data) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Get appointment ${req.params.id} successfully`,
            data: toAppointmentResponse(data),
        }
    });
};

export const updateAppointment = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const appointmentId = parseUuidParam(req.params.id, "Appointment id");

    const data = await appointmentService.updateAppointment(appointmentId, req.user.id, req.user.role, parseUpdateAppointmentDto(req.body));

    if (!data) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Update appointment ${req.params.id} successfully`,
            data: toAppointmentResponse(data),
        }
    });
};