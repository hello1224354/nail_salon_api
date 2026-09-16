import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { Appointment, AppointmentStatus } from "./appointments.entity";
import { CreateAppointmentDto, GetAppointmentsQueryDto, UpdateAppointmentDto } from "./appointments.dto";
import * as staffService from "../staffs/staffs.service";
import * as serviceService from "../services/services.service";
import { In, LessThan, MoreThan, Not } from "typeorm";
import { UserRole } from "../users/users.entity";
import * as userService from "../users/users.service";
import { AppointmentService } from "./appointment-services.entity";

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

    const staff = await staffService.getStaff(data.staff_id);

    if (!staff) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

    if (!staff.user.is_active) throw new AppError("Staff is inactive", 400, "STAFF_INACTIVE");

    if (staff.user.role !== UserRole.STAFF) throw new AppError("User is not a staff member", 400, "INVALID_STAFF_ACCOUNT");

    const services = await serviceService.getServicesByIds(data.service_ids);

    if (services.length < data.service_ids.length) throw new AppError("One or more services were not found", 404, "SERVICE_NOT_FOUND");

    if (!services.every(service => service.is_active)) throw new AppError("One or more services are inactive", 400, "SERVICE_INACTIVE");

    let totalDurationMinutes = 0;

    services.forEach((service) => {
        totalDurationMinutes += service.duration_minutes;
    });

    let endTime: Date;

    endTime = new Date(data.start_time.getTime() + totalDurationMinutes * 60 * 1000);

    const overlapAppointment = await appointmentRepo.findOneBy({
        staff_id: staff.user_id,
        status: In([
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS,
        ]),
        start_time: LessThan(endTime),
        end_time: MoreThan(data.start_time),
    });

    if (overlapAppointment) throw new AppError("Staff already has an appointment during this time", 409, "APPOINTMENT_CONFLICT");

    return await AppDataSource.transaction(async (manager) => {
        const transactionAppointmentRepo = manager.getRepository(Appointment);
        const appointmentServiceRepo = manager.getRepository(AppointmentService);

        const newAppointment = transactionAppointmentRepo.create({
            user_id: ownerId,
            staff_id: staff.user_id,
            start_time: data.start_time,
            end_time: endTime,
            status: AppointmentStatus.PENDING,
        });

        const savedAppointment = await transactionAppointmentRepo.save(newAppointment);

        const appointmentServices = services.map((service) => {
            return appointmentServiceRepo.create({
                appointment_id: savedAppointment.id,
                service_id: service.id,
                service_name: service.name,
                price: service.price,
                duration_minutes: service.duration_minutes,
            });
        });

        const savedAppointmentServices = await appointmentServiceRepo.save(appointmentServices);

        savedAppointment.appointment_services = savedAppointmentServices;

        return savedAppointment;
    });
};

export const getAllAppointments = async (userId: string, role: UserRole, query: GetAppointmentsQueryDto) => {
    const queryBuilder = appointmentRepo.createQueryBuilder("appointment").leftJoinAndSelect("appointment.staff", "staff").leftJoinAndSelect("appointment.appointment_services", "appointment_services");

    if (role === UserRole.CUSTOMER) {
        queryBuilder.andWhere("appointment.user_id = :user_id", {
            user_id: userId,
        });
    }

    if (role === UserRole.STAFF) {
        const staff = await staffService.getStaff(userId);

        if (!staff) throw new AppError("Staff profile not found", 404, "STAFF_NOT_FOUND");

        if (!staff.user.is_active) throw new AppError("Staff is inactive", 403, "FORBIDDEN");

        if (staff.user.role !== UserRole.STAFF) throw new AppError("User is not a staff member", 403, "FORBIDDEN");

        queryBuilder.andWhere("appointment.staff_id = :actor_staff_id", {
            actor_staff_id: staff.user_id,
        });
    }

    if (query.staff_id !== undefined) {
        queryBuilder.andWhere("appointment.staff_id = :filter_staff_id", {
            filter_staff_id: query.staff_id,
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
                appointment_services: true,
            },
        });
    }

    if (role === UserRole.STAFF) {
        return await appointmentRepo.findOne({
            where: {
                id: id,
                staff_id: userId,
            },
            relations: {
                staff: true,
                appointment_services: true,
            },
        });
    }

    return await appointmentRepo.findOne({
        where: {
            id: id,
        },
        relations: {
            staff: true,
            appointment_services: true,
        },
    });
};

export const updateAppointment = async (id: string, userId: string, role: UserRole, data: UpdateAppointmentDto) => {
    const appointment = await getAppointment(id, userId, role);

    if (!appointment) return null;

    if (role === UserRole.CUSTOMER) throw new AppError("Customers cannot update appointments", 403, "FORBIDDEN");

    if (role === UserRole.STAFF) {
        if (data.staff_id !== undefined) throw new AppError("Staff cannot change appointment staff", 403, "FORBIDDEN");

        if (data.service_ids !== undefined) throw new AppError("Staff cannot change appointment services", 403, "FORBIDDEN");

        if (data.start_time !== undefined) throw new AppError("Staff cannot change appointment start time", 403, "FORBIDDEN");

        if (data.status !== undefined && data.status !== AppointmentStatus.IN_PROGRESS && data.status !== AppointmentStatus.COMPLETED) throw new AppError("Staff can only start or complete assigned appointments", 403, "FORBIDDEN");
    }

    if ((appointment.status === AppointmentStatus.IN_PROGRESS || appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) && (data.staff_id !== undefined || data.service_ids !== undefined || data.start_time !== undefined)) throw new AppError("In-progress, completed, or cancelled appointment cannot be modified", 409, "APPOINTMENT_NOT_EDITABLE");

    let staff = appointment.staff;
    let appointmentServices = appointment.appointment_services;
    let startTime = appointment.start_time;
    let endTime = appointment.end_time;
    let status = appointment.status;
    let actualStartedAt = appointment.actual_started_at;
    let actualCompletedAt = appointment.actual_completed_at;

    if (data.staff_id !== undefined) {
        const staffChecker = await staffService.getStaff(data.staff_id);

        if (!staffChecker) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

        if (!staffChecker.user.is_active) throw new AppError("Staff is inactive", 400, "STAFF_INACTIVE");

        if (staffChecker.user.role !== UserRole.STAFF) throw new AppError("User is not a staff member", 400, "INVALID_STAFF_ACCOUNT");

        staff = staffChecker;
    }

    if (data.service_ids !== undefined) {
        const servicesChecker = await serviceService.getServicesByIds(data.service_ids);

        if (servicesChecker.length < data.service_ids.length) throw new AppError("One or more services were not found", 404, "SERVICE_NOT_FOUND");

        if (!servicesChecker.every(service => service.is_active)) throw new AppError("One or more services are inactive", 400, "SERVICE_INACTIVE");

        appointmentServices = servicesChecker.map((service) => {
            return {
                appointment_id: appointment.id,
                service_id: service.id,
                service_name: service.name,
                price: service.price,
                duration_minutes: service.duration_minutes,
            } as AppointmentService;
        });
    }

    if (data.status !== undefined) {
        if (status === AppointmentStatus.COMPLETED || status === AppointmentStatus.CANCELLED) throw new AppError("Invalid appointment status transition", 409, "INVALID_STATUS_TRANSITION");

        if (status === AppointmentStatus.PENDING) {
            if (data.status !== AppointmentStatus.CONFIRMED && data.status !== AppointmentStatus.CANCELLED) throw new AppError("Invalid appointment status transition", 409, "INVALID_STATUS_TRANSITION");
        }

        if (status === AppointmentStatus.CONFIRMED) {
            if (data.status !== AppointmentStatus.IN_PROGRESS && data.status !== AppointmentStatus.CANCELLED) throw new AppError("Invalid appointment status transition", 409, "INVALID_STATUS_TRANSITION");
        }

        if (status === AppointmentStatus.IN_PROGRESS) {
            if (data.status !== AppointmentStatus.COMPLETED && data.status !== AppointmentStatus.CANCELLED) throw new AppError("Invalid appointment status transition", 409, "INVALID_STATUS_TRANSITION");
        }

        if (status === AppointmentStatus.PENDING && data.status === AppointmentStatus.CONFIRMED) {
            const staffChecker = await staffService.getStaff(staff.user_id);

            if (!staffChecker) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

            if (!staffChecker.user.is_active) throw new AppError("Staff is inactive", 409, "STAFF_INACTIVE");

            if (staffChecker.user.role !== UserRole.STAFF) throw new AppError("User is not a staff member", 409, "INVALID_STAFF_ACCOUNT");
        }

        if (status === AppointmentStatus.CONFIRMED && data.status === AppointmentStatus.IN_PROGRESS) {
            actualStartedAt = new Date();
        }

        if (status === AppointmentStatus.IN_PROGRESS && data.status === AppointmentStatus.COMPLETED) {
            actualCompletedAt = new Date();
        }

        status = data.status;
    }

    if (data.start_time !== undefined) {
        startTime = data.start_time;
    }

    if (data.service_ids !== undefined || data.start_time !== undefined) {
        let totalDurationMinutes = 0;

        appointmentServices.forEach((appointmentService) => {
            totalDurationMinutes += appointmentService.duration_minutes;
        });

        endTime = new Date(startTime.getTime() + totalDurationMinutes * 60 * 1000);
    }

    if (status === AppointmentStatus.PENDING || status === AppointmentStatus.CONFIRMED) {
        const overlapAppointment = await appointmentRepo.findOneBy({
            id: Not(appointment.id),
            staff_id: staff.user_id,
            status: In([
                AppointmentStatus.PENDING,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.IN_PROGRESS,
            ]),
            start_time: LessThan(endTime),
            end_time: MoreThan(startTime),
        });

        if (overlapAppointment) throw new AppError("Staff already has an appointment during this time", 409, "APPOINTMENT_CONFLICT");
    }

    return await AppDataSource.transaction(async (manager) => {
        const transactionAppointmentRepo = manager.getRepository(Appointment);
        const appointmentServiceRepo = manager.getRepository(AppointmentService);

        appointment.staff_id = staff.user_id;
        appointment.staff = staff;
        appointment.start_time = startTime;
        appointment.end_time = endTime;
        appointment.status = status;
        appointment.actual_started_at = actualStartedAt;
        appointment.actual_completed_at = actualCompletedAt;

        const savedAppointment = await transactionAppointmentRepo.save(appointment);

        if (data.service_ids !== undefined) {
            await appointmentServiceRepo.delete({
                appointment_id: appointment.id,
            });

            const newAppointmentServices = appointmentServices.map((appointmentService) => {
                return appointmentServiceRepo.create({
                    appointment_id: appointment.id,
                    service_id: appointmentService.service_id,
                    service_name: appointmentService.service_name,
                    price: appointmentService.price,
                    duration_minutes: appointmentService.duration_minutes,
                });
            });

            savedAppointment.appointment_services = await appointmentServiceRepo.save(newAppointmentServices);
        } else {
            savedAppointment.appointment_services = appointmentServices;
        }

        return savedAppointment;
    });
};