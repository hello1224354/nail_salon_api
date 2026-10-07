import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { Appointment, AppointmentStatus } from "./appointments.entity";
import { CreateAppointmentDto, GetAppointmentsQueryDto, GetAvailabilityQueryDto, UpdateAppointmentDto } from "./appointments.dto";
import * as staffService from "../staffs/staffs.service";
import * as serviceService from "../services/services.service";
import * as branchService from "../branches/branches.service";
import { EntityManager, In, LessThan, MoreThan, Not, QueryFailedError } from "typeorm";
import { User, UserRole } from "../users/users.entity";
import * as userService from "../users/users.service";
import { AppointmentService } from "./appointment-services.entity";
import { StaffBookingSlot } from "./staff-booking-slots.entity";

const appointmentRepo = AppDataSource.getRepository(Appointment);

const CUSTOMER_MIN_BOOKING_LEAD_TIME_MS = 3 * 60 * 60 * 1000;
const CUSTOMER_MAX_BOOKING_HORIZON_MS = 14 * 24 * 60 * 60 * 1000;
const BUSINESS_TIMEZONE = "Asia/Ho_Chi_Minh";
const BUSINESS_OPEN_MINUTE = 9 * 60;
const BUSINESS_CLOSE_MINUTE = 21 * 60;
const CUSTOMER_MAX_PENDING_APPOINTMENTS = 3;
const BOOKING_SLOT_MS = 15 * 60 * 1000;

function formatMinuteOfDay(minuteOfDay: number) {
    const hour = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getBusinessMinuteOfDay(date: Date) {
    const parts = new Intl.DateTimeFormat("vi-VN", {
        timeZone: BUSINESS_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);

    const getPart = (type: Intl.DateTimeFormatPartTypes) => {
        return parts.find((part) => part.type === type)?.value ?? "";
    };

    const hour = Number(getPart("hour"));
    const minute = Number(getPart("minute"));

    return hour * 60 + minute;
}

function assertFifteenMinuteAligned(startTime: Date) {
    const businessStartMinute = getBusinessMinuteOfDay(startTime);

    if (
        businessStartMinute % 15 !== 0 ||
        startTime.getUTCSeconds() !== 0 ||
        startTime.getUTCMilliseconds() !== 0
    ) {
        throw new AppError(
            "Appointment start time must be on a 15-minute interval",
            400,
            "INVALID_APPOINTMENT_TIME"
        );
    }
}

function getRequiredSlotStarts(startTime: Date, endTime: Date) {
    const slotStarts: Date[] = [];

    for (let slotStart = startTime.getTime(); slotStart < endTime.getTime(); slotStart += BOOKING_SLOT_MS) {
        slotStarts.push(new Date(slotStart));
    }

    return slotStarts;
}

async function tryReserveStaffSlots(manager: EntityManager, staffId: string, slotStarts: Date[]) {
    const staffBookingSlotRepo = manager.getRepository(StaffBookingSlot);

    const slots = slotStarts.map((slotStart) => {
        return staffBookingSlotRepo.create({
            staff_id: staffId,
            slot_start: slotStart,
        });
    });

    try {
        await staffBookingSlotRepo.insert(slots);
        return true;
    } catch (error) {
        if (error instanceof QueryFailedError) {
            const driverError = error.driverError as { code?: string };

            if (driverError.code === "ER_DUP_ENTRY") return false;
        }

        throw error;
    }
}

async function releaseStaffSlots(manager: EntityManager, staffId: string, slotStarts: Date[]) {
    if (slotStarts.length === 0) return;

    const staffBookingSlotRepo = manager.getRepository(StaffBookingSlot);

    await staffBookingSlotRepo.delete({
        staff_id: staffId,
        slot_start: In(slotStarts),
    });
}

async function resolveBookingResources(serviceIds: string[]) {
    const services = await serviceService.getServicesByIds(serviceIds);

    if (services.length < serviceIds.length) throw new AppError("One or more services were not found", 404, "SERVICE_NOT_FOUND");

    const branchId = services[0].branch_id;

    if (!services.every((service) => service.branch_id === branchId)) throw new AppError("All services must belong to the same branch", 400, "BRANCH_MISMATCH");

    const branch = await branchService.getBranch(branchId);

    if (!branch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");

    const staffs = await staffService.getAllStaffs({
        branch_id: branchId,
    });

    return {
        services,
        branch,
        branchId,
        staffs,
    };
}

export const getAvailability = async (data: GetAvailabilityQueryDto) => {
    if (
        getBusinessMinuteOfDay(data.date) !== 0 ||
        data.date.getUTCSeconds() !== 0 ||
        data.date.getUTCMilliseconds() !== 0
    ) {
        throw new AppError("Date must represent 00:00 in business timezone", 400, "VALIDATION_ERROR");
    }

    const {
        services,
        branchId,
        staffs,
    } = await resolveBookingResources(data.service_ids);

    let totalDurationMinutes = 0;

    services.forEach((service) => {
        totalDurationMinutes += service.duration_minutes;
    });

    const durationMs = totalDurationMinutes * 60 * 1000;

    const businessOpenTime = new Date(
        data.date.getTime() + BUSINESS_OPEN_MINUTE * 60 * 1000
    );

    const businessCloseTime = new Date(
        data.date.getTime() + BUSINESS_CLOSE_MINUTE * 60 * 1000
    );

    const now = Date.now();
    const earliestAllowedStart = now + CUSTOMER_MIN_BOOKING_LEAD_TIME_MS;
    const latestAllowedStart = now + CUSTOMER_MAX_BOOKING_HORIZON_MS;

    if (staffs.length === 0) {
        return {
            branch_id: branchId,
            duration_minutes: totalDurationMinutes,
            slots: [],
        };
    }

    const staffIds = staffs.map((staff) => staff.user_id);

    const appointments = await appointmentRepo.findBy({
        staff_id: In(staffIds),
        status: In([
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS,
        ]),
        start_time: LessThan(businessCloseTime),
        end_time: MoreThan(businessOpenTime),
    });

    const slots: Date[] = [];

    for (
        let startTimeMs = businessOpenTime.getTime();
        startTimeMs + durationMs <= businessCloseTime.getTime();
        startTimeMs += BOOKING_SLOT_MS
    ) {
        if (startTimeMs < earliestAllowedStart) continue;

        if (startTimeMs > latestAllowedStart) continue;

        const startTime = new Date(startTimeMs);
        const endTime = new Date(startTimeMs + durationMs);

        const hasAvailableStaff = staffs.some((staff) => {
            return !appointments.some((appointment) => {
                return (
                    appointment.staff_id === staff.user_id &&
                    appointment.start_time.getTime() < endTime.getTime() &&
                    appointment.end_time.getTime() > startTime.getTime()
                );
            });
        });

        if (hasAvailableStaff) {
            slots.push(startTime);
        }
    }

    return {
        branch_id: branchId,
        duration_minutes: totalDurationMinutes,
        slots,
    };
};

export const createAppointment = async (actorId: string, actorRole: UserRole, data: CreateAppointmentDto) => {
    let ownerId: string;

    if (actorRole === UserRole.CUSTOMER) {
        if (data.user_id !== undefined) throw new AppError("Customers cannot specify user_id", 403, "FORBIDDEN");

        ownerId = actorId;

        const now = Date.now();
        const startTime = data.start_time.getTime();

        if (startTime < now + CUSTOMER_MIN_BOOKING_LEAD_TIME_MS) throw new AppError("Customers must book at least 3 hours in advance", 400, "VALIDATION_ERROR");

        if (startTime > now + CUSTOMER_MAX_BOOKING_HORIZON_MS) throw new AppError("Customers cannot book more than 14 days in advance", 400, "VALIDATION_ERROR");
    } else if (actorRole === UserRole.ADMIN) {
        if (data.user_id === undefined) throw new AppError("User_id is required when admin creates an appointment", 400, "VALIDATION_ERROR");

        const targetUser = await userService.getUser(data.user_id);

        if (!targetUser) throw new AppError("User not found", 404, "USER_NOT_FOUND");

        ownerId = data.user_id;
    } else {
        throw new AppError("You do not have permission to perform this action", 403, "FORBIDDEN");
    }

    const {
        services,
        branch,
        branchId,
        staffs,
    } = await resolveBookingResources(data.service_ids);

    let candidateStaffs = staffs;

    if (actorRole === UserRole.CUSTOMER) {
        if (data.staff_id !== undefined) throw new AppError("Customers cannot specify staff_id", 403, "FORBIDDEN");
    }

    if (actorRole === UserRole.ADMIN) {
        if (data.staff_id === undefined) throw new AppError("Staff_id is required when admin creates an appointment", 400, "VALIDATION_ERROR");

        const staff = await staffService.getStaff(data.staff_id);

        if (!staff) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

        if (staff.user.role !== UserRole.STAFF) throw new AppError("User is not a staff member", 400, "INVALID_STAFF_ACCOUNT");

        if (staff.branch_id !== branchId) throw new AppError("All services must belong to the same branch as the staff", 400, "BRANCH_MISMATCH");

        candidateStaffs = [staff];
    }

    let totalDurationMinutes = 0;

    services.forEach((service) => {
        totalDurationMinutes += service.duration_minutes;
    });

    const endTime = new Date(data.start_time.getTime() + totalDurationMinutes * 60 * 1000);

    assertFifteenMinuteAligned(data.start_time);

    if (actorRole === UserRole.CUSTOMER) {
        const businessStartMinute = getBusinessMinuteOfDay(data.start_time);
        const businessEndMinute = getBusinessMinuteOfDay(endTime);

        if (businessStartMinute < BUSINESS_OPEN_MINUTE) throw new AppError(`Appointment must start at or after ${formatMinuteOfDay(BUSINESS_OPEN_MINUTE)}`, 400, "OUTSIDE_BUSINESS_HOURS");

        if (businessEndMinute > BUSINESS_CLOSE_MINUTE) throw new AppError(`Appointment must end by ${formatMinuteOfDay(BUSINESS_CLOSE_MINUTE)}`, 400, "OUTSIDE_BUSINESS_HOURS");
    }

    return await AppDataSource.transaction(async (manager) => {
        const transactionAppointmentRepo = manager.getRepository(Appointment);
        const appointmentServiceRepo = manager.getRepository(AppointmentService);
        const transactionUserRepo = manager.getRepository(User);

        const owner = await transactionUserRepo.findOne({
            where: {
                id: ownerId,
            },
            lock: {
                mode: "pessimistic_write",
            },
        });

        if (!owner) throw new AppError("User not found", 404, "USER_NOT_FOUND");

        if (actorRole === UserRole.CUSTOMER) {
            const pendingAppointmentCount = await transactionAppointmentRepo.countBy({
                customer_phone: owner.phone,
                status: AppointmentStatus.PENDING,
            });

            if (pendingAppointmentCount >= CUSTOMER_MAX_PENDING_APPOINTMENTS) throw new AppError("Customer cannot have more than 3 pending appointments", 429, "TOO_MANY_PENDING_APPOINTMENTS");
        }

        const customerOverlapAppointment = await transactionAppointmentRepo.findOneBy({
            customer_phone: owner.phone,
            status: In([
                AppointmentStatus.PENDING,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.IN_PROGRESS,
            ]),
            start_time: LessThan(endTime),
            end_time: MoreThan(data.start_time),
        });

        if (customerOverlapAppointment) throw new AppError("Customer already has an appointment during this time", 409, "CUSTOMER_APPOINTMENT_CONFLICT");

        const slotStarts = getRequiredSlotStarts(data.start_time, endTime);

        for (const staff of candidateStaffs) {
            const overlapAppointment = await transactionAppointmentRepo.findOneBy({
                staff_id: staff.user_id,
                status: In([
                    AppointmentStatus.PENDING,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.IN_PROGRESS,
                ]),
                start_time: LessThan(endTime),
                end_time: MoreThan(data.start_time),
            });

            if (overlapAppointment) continue;

            const reserved = await tryReserveStaffSlots(
                manager,
                staff.user_id,
                slotStarts
            );

            if (!reserved) continue;

            const newAppointment = transactionAppointmentRepo.create({
                user_id: ownerId,
                customer_full_name: owner.full_name,
                customer_phone: owner.phone,
                customer_email: owner.email,
                staff_id: staff.user_id,
                staff_full_name: staff.user.full_name,
                branch_id: branchId,
                branch_name: branch.name,
                branch_address: branch.address,
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
        }

        if (actorRole === UserRole.ADMIN) throw new AppError("Staff already has an appointment during this time", 409, "APPOINTMENT_CONFLICT");

        throw new AppError("No staff is available for this time slot", 409, "SLOT_UNAVAILABLE");
    });
};

export const getAllAppointments = async (userId: string, role: UserRole, query: GetAppointmentsQueryDto) => {
    const queryBuilder = appointmentRepo.createQueryBuilder("appointment")
        .leftJoinAndSelect("appointment.appointment_services", "appointment_services");

    if (role === UserRole.CUSTOMER) {
        queryBuilder.andWhere("appointment.user_id = :user_id", {
            user_id: userId,
        });
    }

    if (role === UserRole.STAFF) {
        const staff = await staffService.getStaff(userId);

        if (!staff) throw new AppError("Staff profile not found", 404, "STAFF_NOT_FOUND");

        queryBuilder.andWhere("appointment.staff_id = :actor_staff_id", {
            actor_staff_id: staff.user_id,
        });
    }

    if (query.staff_id !== undefined) {
        queryBuilder.andWhere("appointment.staff_id = :filter_staff_id", {
            filter_staff_id: query.staff_id,
        });
    }

    if (query.branch_id !== undefined) {
        queryBuilder.andWhere("appointment.branch_id = :branch_id", {
            branch_id: query.branch_id,
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
                id,
                user_id: userId,
            },
            relations: {
                appointment_services: true,
            },
        });
    }

    if (role === UserRole.STAFF) {
        return await appointmentRepo.findOne({
            where: {
                id,
                staff_id: userId,
            },
            relations: {
                appointment_services: true,
            },
        });
    }

    return await appointmentRepo.findOne({
        where: {
            id,
        },
        relations: {
            appointment_services: true,
        },
    });
};

export const updateAppointment = async (id: string, userId: string, role: UserRole, data: UpdateAppointmentDto) => {
    return await AppDataSource.transaction(async (manager) => {
        const transactionAppointmentRepo = manager.getRepository(Appointment);
        const appointmentServiceRepo = manager.getRepository(AppointmentService);

        const appointment = await transactionAppointmentRepo.findOne({
            where:
                role === UserRole.CUSTOMER
                    ? {
                        id,
                        user_id: userId,
                    }
                    : role === UserRole.STAFF
                        ? {
                            id,
                            staff_id: userId,
                        }
                        : {
                            id,
                        },
            relations: {
                appointment_services: true,
            },
            lock: {
                mode: "pessimistic_write",
            }
        });

        if (!appointment) return null;

        if (role === UserRole.CUSTOMER) throw new AppError("Customers cannot update appointments", 403, "FORBIDDEN");

        if (role === UserRole.STAFF) {
            if (data.staff_id !== undefined) throw new AppError("Staff cannot change appointment staff", 403, "FORBIDDEN");

            if (data.service_ids !== undefined) throw new AppError("Staff cannot change appointment services", 403, "FORBIDDEN");

            if (data.start_time !== undefined) throw new AppError("Staff cannot change appointment start time", 403, "FORBIDDEN");

            if (data.status !== undefined && data.status !== AppointmentStatus.IN_PROGRESS && data.status !== AppointmentStatus.COMPLETED) throw new AppError("Staff can only start or complete assigned appointments", 403, "FORBIDDEN");
        }

        if ((appointment.status === AppointmentStatus.IN_PROGRESS || appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) && (data.staff_id !== undefined || data.service_ids !== undefined || data.start_time !== undefined)) throw new AppError("In-progress, completed, or cancelled appointment cannot be modified", 409, "APPOINTMENT_NOT_EDITABLE");

        let targetStaffId = appointment.staff_id;
        let targetStaffFullName = appointment.staff_full_name;
        let branchId = appointment.branch_id;
        let branchName = appointment.branch_name;
        let branchAddress = appointment.branch_address;
        let appointmentServices = appointment.appointment_services;
        let startTime = appointment.start_time;
        let endTime = appointment.end_time;
        const hasScheduleChanges = data.staff_id !== undefined || data.service_ids !== undefined || data.start_time !== undefined;
        let status = appointment.status;
        let actualStartedAt = appointment.actual_started_at;
        let actualCompletedAt = appointment.actual_completed_at;

        let liveStaff = hasScheduleChanges
            ? await staffService.getStaff(data.staff_id ?? appointment.staff_id)
            : null;

        if (hasScheduleChanges && !liveStaff) {
            throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");
        }

        if (liveStaff && liveStaff.user.role !== UserRole.STAFF) {
            throw new AppError("User is not a staff member", 400, "INVALID_STAFF_ACCOUNT");
        }

        if (data.staff_id !== undefined && liveStaff) {
            targetStaffId = liveStaff.user_id;
            targetStaffFullName = liveStaff.user.full_name;

            const liveBranch = await branchService.getBranch(liveStaff.branch_id);
            if (!liveBranch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");

            branchId = liveBranch.id;
            branchName = liveBranch.name;
            branchAddress = liveBranch.address;
        }

        if (data.staff_id !== undefined && data.service_ids === undefined && branchId !== appointment.branch_id) {
            throw new AppError("Existing services do not belong to the new staff branch", 400, "BRANCH_MISMATCH");
        }

        if (data.service_ids !== undefined) {
            if (!liveStaff) {
                liveStaff = await staffService.getStaff(targetStaffId);
            }

            if (!liveStaff) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

            const liveStaffBranchId = liveStaff.branch_id;
            const servicesChecker = await serviceService.getServicesByIds(data.service_ids);

            if (servicesChecker.length < data.service_ids.length) throw new AppError("One or more services were not found", 404, "SERVICE_NOT_FOUND");

            if (!servicesChecker.every((service) => service.branch_id === liveStaffBranchId)) throw new AppError("All services must belong to the same branch as the staff", 400, "BRANCH_MISMATCH");

            const liveBranch = await branchService.getBranch(liveStaffBranchId);
            if (!liveBranch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");

            branchId = liveBranch.id;
            branchName = liveBranch.name;
            branchAddress = liveBranch.address;

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
                const staffChecker = await staffService.getStaff(targetStaffId);

                if (!staffChecker) throw new AppError("Staff not found", 404, "STAFF_NOT_FOUND");

                if (staffChecker.user.role !== UserRole.STAFF) throw new AppError("User is not a staff member", 409, "INVALID_STAFF_ACCOUNT");

                const liveBranch = await branchService.getBranch(branchId);

                if (!liveBranch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");
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
            assertFifteenMinuteAligned(data.start_time);
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
            const overlapAppointment = await transactionAppointmentRepo.findOneBy({
                id: Not(appointment.id),
                staff_id: targetStaffId,
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

        const oldSlotStarts = getRequiredSlotStarts(
            appointment.start_time,
            appointment.end_time
        );

        const newSlotStarts = getRequiredSlotStarts(
            startTime,
            endTime
        );

        if (hasScheduleChanges) {
            await releaseStaffSlots(
                manager,
                appointment.staff_id,
                oldSlotStarts
            );

            const reserved = await tryReserveStaffSlots(
                manager,
                targetStaffId,
                newSlotStarts
            );

            if (!reserved) {
                throw new AppError(
                    "Staff already has an appointment during this time",
                    409,
                    "APPOINTMENT_CONFLICT"
                );
            }
        }

        if (
            appointment.status !== AppointmentStatus.CANCELLED &&
            status === AppointmentStatus.CANCELLED
        ) {
            await releaseStaffSlots(
                manager,
                appointment.staff_id,
                oldSlotStarts
            );
        }

        appointment.staff_id = targetStaffId;
        appointment.staff_full_name = targetStaffFullName;
        appointment.branch_id = branchId;
        appointment.branch_name = branchName;
        appointment.branch_address = branchAddress;
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

export const deleteAppointment = async (id: string) => {
    return await AppDataSource.transaction(async (manager) => {
        const transactionAppointmentRepo = manager.getRepository(Appointment);
        const appointmentServiceRepo = manager.getRepository(AppointmentService);

        const appointment = await transactionAppointmentRepo.findOne({
            where: { id },
            relations: { appointment_services: true },
            lock: { mode: "pessimistic_write" },
        });

        if (!appointment) return null;

        await releaseStaffSlots(
            manager,
            appointment.staff_id,
            getRequiredSlotStarts(appointment.start_time, appointment.end_time)
        );

        await appointmentServiceRepo.delete({
            appointment_id: appointment.id,
        });

        await transactionAppointmentRepo.remove(appointment);

        return appointment;
    });
};
