import { Request, Response } from "express";
import * as appointmentService from "./appointments.service";
import { calculateAppointmentCharge } from "./appointment-charge";
import { parseCreateAppointmentDto, parseGetAppointmentsQuery, parseGetAvailabilityQuery, parseUpdateAppointmentDto } from "./appointments.dto";
import { AppError } from "../../common/errors";
import { Appointment } from "./appointments.entity";
import { parseUuidParam } from "../../common/validators";
import { setActualPriceForStaff } from "./appointments.prices";
import { validActualPrice } from "../walk-ins/walk-ins.dto";
import { resolveWorkStaff, auditAdminWork } from "./admin-staff-actor";

function toAppointmentResponse(appointment: Appointment) {
    const {
        customer_full_name,
        customer_phone,
        customer_email,
        staff_full_name,
        branch_name,
        branch_address,
        ...data
    } = appointment;

    return {
        ...data,
        effective_total_price: calculateAppointmentCharge(appointment),
        end_time: appointment.status === "completed" && appointment.actual_completed_at
            ? appointment.actual_completed_at : appointment.end_time,
        customer: {
            id: appointment.user_id,
            full_name: customer_full_name,
            phone: customer_phone,
            email: customer_email,
        },
        staff: {
            id: appointment.staff_id,
            full_name: staff_full_name,
        },
        assigned_staff: [...(appointment.staff_assignments ?? [])]
            .sort((a, b) => a.position - b.position || a.staff_id.localeCompare(b.staff_id))
            .map(assignment => ({
                id: assignment.staff_id,
                full_name: assignment.staff_full_name,
                started_at: assignment.started_at,
                completed_at: assignment.completed_at,
                position: assignment.position,
                assisted_service_id: assignment.assisted_service_id,
            })),
        branch: {
            id: appointment.branch_id,
            name: branch_name,
            address: branch_address,
        },
    };
}

export const createAppointment = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

    const data = await appointmentService.createAppointment(req.user.id, req.user.role, parseCreateAppointmentDto(req.body));

    return res.status(201).json({
        success: {
            message: "Create new appointment successfully",
            data: toAppointmentResponse(data),
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

export const getAdminLifetimeSummary = async (_req: Request, res: Response) => {
    const data = await appointmentService.getAdminLifetimeSummary();
    return res.status(200).json({
        success: { data, message: "Lifetime appointment and revenue summary" },
    });
};

export const getAdminMonthSummary = async (req: Request, res: Response) => {
    const month = req.query.month;
    if (typeof month !== "string") throw new AppError("Month is required (YYYY-MM)", 400, "VALIDATION_ERROR");
    const data = await appointmentService.getAdminMonthSummary(month);
    return res.status(200).json({ success: { data, message: "Monthly appointment and revenue summary" } });
};

export const getAdminTodaySummary = async (_req: Request, res: Response) => {
    const data = await appointmentService.getAdminTodaySummary();
    return res.status(200).json({
        success: {
            message: "Get admin daily appointment and revenue summary successfully",
            data,
        },
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

    const payload = parseUpdateAppointmentDto(req.body);
    const data = await appointmentService.updateAppointment(appointmentId, req.user.id, req.user.role, payload);
    if (payload.acting_staff_id) await auditAdminWork(req, res, payload.acting_staff_id, "WORK_" + payload.status, appointmentId);

    if (!data) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Update appointment ${req.params.id} successfully`,
            data: toAppointmentResponse(data),
        }
    });
};

export const deleteAppointment = async (req: Request, res: Response) => {
    const appointmentId = parseUuidParam(req.params.id, "Appointment id");
    const data = await appointmentService.deleteAppointment(appointmentId);

    if (!data) throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");

    return res.status(200).json({
        success: {
            message: `Delete appointment ${req.params.id} successfully`,
            data: toAppointmentResponse(data),
        }
    });
};

export const setActualPrice = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
    const appointmentId = parseUuidParam(req.params.id, "Appointment id");
    const serviceId = parseUuidParam(req.params.serviceId, "Service id");
    const body = req.body as Record<string, unknown> | null;
    if (!body || !validActualPrice(body.actual_price)) {
        throw new AppError("Actual price must be a non-negative whole VND amount", 400, "VALIDATION_ERROR");
    }
    const staffId = resolveWorkStaff(req.user, body.staff_id);
    const result = await setActualPriceForStaff(appointmentId, serviceId, staffId, body.actual_price);
    await auditAdminWork(req, res, staffId, "SET_ACTUAL_PRICE", appointmentId);
    return res.status(200).json({ success: { data: result, message: "Actual price saved" } });
};
