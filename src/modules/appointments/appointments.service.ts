import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { Appointment, AppointmentStatus } from "./appointments.entity";
import { CreateAppointmentDto, GetAppointmentsQueryDto, GetAvailabilityQueryDto, UpdateAppointmentDto } from "./appointments.dto";
import * as staffService from "../staffs/staffs.service";
import * as serviceService from "../services/services.service";
import * as branchService from "../branches/branches.service";
import { EntityManager, In, LessThan, MoreThan, Not, QueryFailedError } from "typeorm";
import { User, UserRole } from "../users/users.entity";
import { AppointmentService } from "./appointment-services.entity";
import { StaffBookingSlot } from "./staff-booking-slots.entity";
import { randomUUID } from "crypto";

const appointmentRepo = AppDataSource.getRepository(Appointment);

const CUSTOMER_MIN_BOOKING_LEAD_TIME_MS = 3 * 60 * 60 * 1000;
const CUSTOMER_MAX_BOOKING_HORIZON_MS = 14 * 24 * 60 * 60 * 1000;
const BUSINESS_TIMEZONE = "Asia/Ho_Chi_Minh";
const BUSINESS_OPEN_MINUTE = 9 * 60;
const BUSINESS_CLOSE_MINUTE = 20 * 60 + 30;
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

    if (services.some((service) => !service.booking_enabled || service.duration_minutes === null)) {
        throw new AppError(
            "One or more services are not available for online booking yet",
            409,
            "SERVICE_NOT_BOOKABLE"
        );
    }

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
        totalDurationMinutes += service.duration_minutes!;
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
            party_size: data.party_size,
            max_party_size: 0,
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

        let availableStaffCount = 0;

        for (const staff of staffs) {
            const hasOverlap = appointments.some((appointment) => {
                return (
                    appointment.staff_id === staff.user_id &&
                    appointment.start_time.getTime() < endTime.getTime() &&
                    appointment.end_time.getTime() > startTime.getTime()
                );
            });

            if (!hasOverlap) {
                availableStaffCount += 1;
            }

            if (availableStaffCount >= data.party_size) {
                slots.push(startTime);
                break;
            }
        }
    }

    return {
        branch_id: branchId,
        duration_minutes: totalDurationMinutes,
        party_size: data.party_size,
        max_party_size: staffs.length,
        slots,
    };
};

export const createAppointment = async (actorId: string, actorRole: UserRole, data: CreateAppointmentDto) => {
    if (actorRole !== UserRole.CUSTOMER) {
        throw new AppError("Only customers can create appointments", 403, "FORBIDDEN");
    }

    if (data.user_id !== undefined || data.customer_email !== undefined || data.staff_id !== undefined) {
        throw new AppError("Customers cannot specify another customer or staff", 403, "FORBIDDEN");
    }

    const now = Date.now();
    const startTime = data.start_time.getTime();

    if (startTime < now + CUSTOMER_MIN_BOOKING_LEAD_TIME_MS) {
        throw new AppError("Customers must book at least 3 hours in advance", 400, "VALIDATION_ERROR");
    }

    if (startTime > now + CUSTOMER_MAX_BOOKING_HORIZON_MS) {
        throw new AppError("Customers cannot book more than 14 days in advance", 400, "VALIDATION_ERROR");
    }

    const ownerId = actorId;
    const { services, branch, branchId, staffs } = await resolveBookingResources(data.service_ids);
    const candidateStaffs = staffs;

    let totalDurationMinutes = 0;

    services.forEach((service) => {
        totalDurationMinutes += service.duration_minutes!;
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
            const pendingBookingCountRaw = await transactionAppointmentRepo
                .createQueryBuilder("appointment")
                .select(
                    "COUNT(DISTINCT COALESCE(appointment.booking_group_id, appointment.id))",
                    "count"
                )
                .where("appointment.user_id = :ownerId", {
                    ownerId,
                })
                .andWhere("appointment.status = :pendingStatus", {
                    pendingStatus: AppointmentStatus.PENDING,
                })
                .getRawOne<{ count: string }>();

            const pendingBookingCount = Number(pendingBookingCountRaw?.count ?? 0);

            if (pendingBookingCount >= CUSTOMER_MAX_PENDING_APPOINTMENTS) {
                throw new AppError(
                    "Customer cannot have more than 3 pending booking requests",
                    429,
                    "TOO_MANY_PENDING_APPOINTMENTS"
                );
            }
        }

        if (data.party_size > candidateStaffs.length) {
            throw new AppError(
                "Not enough staff is available for this group size",
                409,
                "SLOT_UNAVAILABLE"
            );
        }

        const slotStarts = getRequiredSlotStarts(data.start_time, endTime);
        const reservedStaffs: typeof candidateStaffs = [];

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

            reservedStaffs.push(staff);

            if (reservedStaffs.length === data.party_size) {
                break;
            }
        }

        if (reservedStaffs.length < data.party_size) {
            throw new AppError(
                "Not enough staff is available for this group size at this time",
                409,
                "SLOT_UNAVAILABLE"
            );
        }

        const bookingGroupId = randomUUID();
        const savedAppointments: Appointment[] = [];

        for (const staff of reservedStaffs) {
            const newAppointment = transactionAppointmentRepo.create({
                user_id: ownerId,
                booking_group_id: bookingGroupId,
                party_size: data.party_size,
                customer_full_name: owner.full_name,
                customer_phone: data.customer_phone,
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
                    duration_minutes: service.duration_minutes!,
                });
            });

            savedAppointment.appointment_services = await appointmentServiceRepo.save(
                appointmentServices
            );

            savedAppointments.push(savedAppointment);
        }

        return savedAppointments[0];
    });
};

// All timestamps are stored as UTC DATETIME. A Vietnam business day starts
// at 17:00 UTC on the previous calendar day; Vietnam does not observe DST.
function vietnamDayWindow(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: BUSINESS_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);
    const value = (type: "year" | "month" | "day") => parts.find((part) => part.type === type)?.value;
    const today = `${value("year")}-${value("month")}-${value("day")}`;
    const start = new Date(`${today}T00:00:00+07:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
}

export const getAdminTodaySummary = async () => {
    const { start, end } = vietnamDayWindow();

    // Appointment counts belong to the day scheduled to start, independently
    // of pagination or currently selected filters in the admin appointment list.
    const counts = await appointmentRepo.createQueryBuilder("appointment")
        .select("COUNT(*)", "total")
        .addSelect("SUM(CASE WHEN appointment.status = :pending THEN 1 ELSE 0 END)", "pending")
        .addSelect("SUM(CASE WHEN appointment.status = :confirmed THEN 1 ELSE 0 END)", "confirmed")
        .addSelect("SUM(CASE WHEN appointment.status = :completed THEN 1 ELSE 0 END)", "completed")
        .addSelect("SUM(CASE WHEN appointment.status = :cancelled THEN 1 ELSE 0 END)", "cancelled")
        .where("appointment.start_time >= :start AND appointment.start_time < :end", { start, end })
        .setParameters({
            pending: AppointmentStatus.PENDING,
            confirmed: AppointmentStatus.CONFIRMED,
            completed: AppointmentStatus.COMPLETED,
            cancelled: AppointmentStatus.CANCELLED,
        })
        .getRawOne<Record<string, string | null>>();

    // Revenue is the booked service-price snapshot of appointments actually
    // completed during this business day, not a claim that payment was received.
    // Compute independently: a joined query would multiply appointment counts.
    const revenue = await appointmentRepo.createQueryBuilder("appointment")
        .innerJoin("appointment.appointment_services", "service")
        .select("COALESCE(SUM(service.price), 0)", "revenue")
        .where("appointment.status = :completed", { completed: AppointmentStatus.COMPLETED })
        .andWhere("appointment.actual_completed_at >= :start AND appointment.actual_completed_at < :end", { start, end })
        .getRawOne<{ revenue: string }>();

    return {
        total: Number(counts?.total ?? 0),
        pending: Number(counts?.pending ?? 0),
        confirmed: Number(counts?.confirmed ?? 0),
        completed: Number(counts?.completed ?? 0),
        cancelled: Number(counts?.cancelled ?? 0),
        revenue: Number(revenue?.revenue ?? 0),
    };
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
        if (role === UserRole.STAFF && data.customer_phone !== undefined) {
            throw new AppError("Staff cannot change customer contact information", 403, "FORBIDDEN");
        }
        if (role === UserRole.ADMIN && data.customer_phone !== undefined &&
            [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED].includes(appointment.status)) {
            throw new AppError("Closed appointment contact information cannot be modified", 409, "APPOINTMENT_NOT_EDITABLE");
        }

        if (role === UserRole.STAFF) {
            if (data.staff_id !== undefined) throw new AppError("Staff cannot change appointment staff", 403, "FORBIDDEN");

            if (data.service_ids !== undefined) throw new AppError("Staff cannot change appointment services", 403, "FORBIDDEN");

            if (data.start_time !== undefined) throw new AppError("Staff cannot change appointment start time", 403, "FORBIDDEN");

            if (data.status !== undefined && data.status !== AppointmentStatus.IN_PROGRESS && data.status !== AppointmentStatus.COMPLETED) throw new AppError("Staff can only start or complete assigned appointments", 403, "FORBIDDEN");
        }

        if (
            data.status === AppointmentStatus.CANCELLED &&
            (data.staff_id !== undefined || data.service_ids !== undefined || data.start_time !== undefined)
        ) {
            throw new AppError(
                "Cancelling an appointment cannot be combined with staff, service, or start time changes",
                400,
                "INVALID_CANCEL_REQUEST"
            );
        }

        if ((appointment.status === AppointmentStatus.IN_PROGRESS || appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) && (data.staff_id !== undefined || data.service_ids !== undefined || data.start_time !== undefined)) throw new AppError("In-progress, completed, or cancelled appointment cannot be modified", 409, "APPOINTMENT_NOT_EDITABLE");

        if (data.customer_phone !== undefined) {
            appointment.customer_phone = data.customer_phone;
        }

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

            if (servicesChecker.some((service) => !service.booking_enabled || service.duration_minutes === null)) {
                throw new AppError(
                    "One or more services are not available for online booking yet",
                    409,
                    "SERVICE_NOT_BOOKABLE"
                );
            }

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
                    duration_minutes: service.duration_minutes!,
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
                const now = new Date();

                if (now.getTime() < appointment.start_time.getTime()) {
                    throw new AppError(
                        "Appointment cannot start before its scheduled time",
                        409,
                        "APPOINTMENT_NOT_STARTED_YET"
                    );
                }

                actualStartedAt = now;
            }

            if (status === AppointmentStatus.IN_PROGRESS && data.status === AppointmentStatus.COMPLETED) {
                const now = new Date();

                if (now.getTime() < appointment.start_time.getTime()) {
                    throw new AppError(
                        "Appointment cannot complete before its scheduled time",
                        409,
                        "APPOINTMENT_NOT_STARTED_YET"
                    );
                }

                actualCompletedAt = now;
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

        const becameTerminal =
            appointment.status !== AppointmentStatus.COMPLETED &&
            appointment.status !== AppointmentStatus.CANCELLED &&
            (status === AppointmentStatus.COMPLETED || status === AppointmentStatus.CANCELLED);

        if (becameTerminal) {
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
