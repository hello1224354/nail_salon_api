import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { Appointment, AppointmentStatus } from "./appointments.entity";
import { CreateAppointmentDto, GetAppointmentsQueryDto, UpdateAppointmentDto } from "./appointments.dto";
import { Staff } from "../staffs/staffs.entity";
import * as staffService from "../staffs/staffs.service";
import * as serviceService from "../services/services.service";
import { In, LessThan, MoreThan, Not } from "typeorm";
import { UserRole } from "../users/users.entity";
import * as userService from "../users/users.service";

const appointmentRepo = AppDataSource.getRepository(Appointment);

export const createAppointment = async (actorId: string, actorRole: UserRole, data: CreateAppointmentDto) => {
    let ownerId: string;

    if (actorRole === UserRole.CUSTOMER) {
        if (data.user_id !== undefined) throw new AppError("Customers cannot specify user_id", 403, "FORBIDDEN");

        ownerId = actorId;
    } else if (actorRole === UserRole.ADMIN) {
        if (data.user_id === undefined) throw new AppError("User_id is required when admin creates an appointment", 400, "VALIDATION_ERROR");

        const targetUser = await userService.getUser(data.user_id);

        if (!targetUser) throw new AppError("User not found", 404, "USER_NOT_FOUND");

        if (targetUser.role !== UserRole.CUSTOMER) throw new AppError("Appointment owner must be a customer", 400, "INVALID_APPOINTMENT_OWNER");

        if (!targetUser.is_active) throw new AppError("User account is inactive", 400, "USER_INACTIVE");

        ownerId = data.user_id;
    } else {
        throw new AppError("You do not have permission to perform this action", 403, "FORBIDDEN");
    }

    let staff: Staff | null = null;

    if (data.staff_id) {
        staff = await staffService.getStaff(data.staff_id);

        if (!staff) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

        if (!staff.is_active) throw new AppError("Staff is inactive", 400, "STAFF_INACTIVE");
    }

    const services = await serviceService.getServicesByIds(data.service_ids);

    if (services.length < data.service_ids.length) throw new AppError("One or more services were not found", 404, "SERVICE_NOT_FOUND");

    if (!services.every(service => service.is_active)) throw new AppError("One or more services are inactive", 400, "SERVICE_INACTIVE");

    let totalDurationMinutes = 0;

    services.forEach((service) => {
        totalDurationMinutes += service.duration_minutes;
    });

    let endTime: Date;

    endTime = new Date(data.start_time.getTime() + totalDurationMinutes * 60 * 1000);

    if (staff) {
        const overlapAppointment = await appointmentRepo.findOneBy({
            staff_id: staff.id,
            status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            start_time: LessThan(endTime),
            end_time: MoreThan(data.start_time),
        });

        if (overlapAppointment) throw new AppError("Staff already has an appointment during this time", 409, "APPOINTMENT_CONFLICT");
    }

    const newAppointment = appointmentRepo.create({
        user_id: ownerId,
        staff_id: staff?.id ?? null,
        services: services,
        start_time: data.start_time,
        end_time: endTime,
        status: AppointmentStatus.PENDING,
    });

    return await appointmentRepo.save(newAppointment);
};

export const getAllAppointments = async (userId: string, role: UserRole, query: GetAppointmentsQueryDto) => {
    const queryBuilder = appointmentRepo.createQueryBuilder("appointment").leftJoinAndSelect("appointment.staff", "staff").leftJoinAndSelect("appointment.services", "services");

    if (role === UserRole.CUSTOMER) {
        queryBuilder.andWhere("appointment.user_id = :user_id", {
            user_id: userId,
        });
    }

    if (query.staff_id !== undefined) {
        queryBuilder.andWhere("appointment.staff_id = :staff_id", {
            staff_id: query.staff_id,
        });
    }

    if (query.status !== undefined) {
        queryBuilder.andWhere("appointment.status = :status", {
            status: query.status,
        });
    }

    if (query.from !== undefined) {
        queryBuilder.andWhere("appointment.start_time >= :start_time_from", {
            start_time_from: query.from,
        });
    }

    if (query.to !== undefined) {
        queryBuilder.andWhere("appointment.start_time < :start_time_to", {
            start_time_to: query.to,
        });
    }

    queryBuilder.orderBy("appointment.start_time", "ASC");

    queryBuilder.skip((query.page - 1) * query.limit);

    queryBuilder.take(query.limit);

    const [appointments, total] = await queryBuilder.getManyAndCount();

    return {
        appointments,
        total,
        page: query.page,
        limit: query.limit,
        total_pages: Math.ceil(total / query.limit),
    };
};

export const getAppointment = async (id: string, userId: string, role: UserRole) => {
    if (role === UserRole.CUSTOMER) {
        return await appointmentRepo.findOne({
            where: {
                id: id,
                user_id: userId,
            },
            relations: {
                staff: true,
                services: true,
            },
        });
    }

    return await appointmentRepo.findOne({
        where: {
            id: id,
        },
        relations: {
            staff: true,
            services: true,
        },
    });
};

export const updateAppointment = async (id: string, userId: string, role: UserRole, data: UpdateAppointmentDto) => {
    const appointment = await getAppointment(id, userId, role);

    if (!appointment) return null;

    if (role === UserRole.CUSTOMER && data.status !== undefined && data.status !== AppointmentStatus.CANCELLED) throw new AppError("Customers can only cancel appointments", 403, "FORBIDDEN");

    if ((appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) && (data.staff_id !== undefined || data.service_ids !== undefined || data.start_time !== undefined)) throw new AppError("Completed or cancelled appointment cannot be modified", 409, "APPOINTMENT_NOT_EDITABLE");

    let staff = appointment.staff;
    let services = appointment.services;
    let startTime = appointment.start_time;
    let status = appointment.status;

    if (data.staff_id !== undefined) {
        if (data.staff_id === null) {
            staff = null;
        } else {
            const staffChecker = await staffService.getStaff(data.staff_id);

            if (!staffChecker) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

            if (!staffChecker.is_active) throw new AppError("Staff is inactive", 400, "STAFF_INACTIVE");

            staff = staffChecker;
        }
    }

    if (data.service_ids !== undefined) {
        const servicesChecker = await serviceService.getServicesByIds(data.service_ids);

        if (servicesChecker.length < data.service_ids.length) throw new AppError("One or more services were not found", 404, "SERVICE_NOT_FOUND");

        if (!servicesChecker.every(service => service.is_active)) throw new AppError("One or more services are inactive", 400, "SERVICE_INACTIVE");

        services = servicesChecker;
    }

    if (data.status !== undefined) {
        if (status === AppointmentStatus.CANCELLED || status === AppointmentStatus.COMPLETED) throw new AppError("Invalid appointment status transition", 409, "INVALID_STATUS_TRANSITION");

        if (status === AppointmentStatus.PENDING) {
            if (data.status !== AppointmentStatus.CONFIRMED && data.status !== AppointmentStatus.CANCELLED) throw new AppError("Invalid appointment status transition", 409, "INVALID_STATUS_TRANSITION");
        }

        if (status === AppointmentStatus.CONFIRMED) {
            if (data.status !== AppointmentStatus.COMPLETED && data.status !== AppointmentStatus.CANCELLED) throw new AppError("Invalid appointment status transition", 409, "INVALID_STATUS_TRANSITION");
        }

        status = data.status;
    }

    if (data.start_time !== undefined) {
        startTime = data.start_time;
    }

    let totalDurationMinutes = 0;

    services.forEach((service) => {
        totalDurationMinutes += service.duration_minutes;
    });

    const endTime = new Date(startTime.getTime() + totalDurationMinutes * 60 * 1000);

    if (staff && (status === AppointmentStatus.PENDING || status === AppointmentStatus.CONFIRMED)) {
        const overlapAppointment = await appointmentRepo.findOneBy({
            id: Not(appointment.id),
            staff_id: staff.id,
            status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            start_time: LessThan(endTime),
            end_time: MoreThan(startTime),
        });

        if (overlapAppointment) throw new AppError("Staff already has an appointment during this time", 409, "APPOINTMENT_CONFLICT");
    }

    appointment.staff_id = staff?.id ?? null;
    appointment.staff = staff;
    appointment.services = services;
    appointment.start_time = startTime;
    appointment.end_time = endTime;
    appointment.status = status;

    return await appointmentRepo.save(appointment);
};