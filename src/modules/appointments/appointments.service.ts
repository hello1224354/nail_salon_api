import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { Appointment, AppointmentStatus } from "./appointments.entity";
import { CreateAppointmentDto, GetAppointmentsQueryDto, GetAvailabilityQueryDto, UpdateAppointmentDto } from "./appointments.dto";
import * as staffService from "../staffs/staffs.service";
import * as serviceService from "../services/services.service";
import * as branchService from "../branches/branches.service";
import { Between, EntityManager, In, IsNull, LessThan, MoreThan, QueryFailedError } from "typeorm";
import { User, UserRole } from "../users/users.entity";
import { AppointmentService } from "./appointment-services.entity";
import { StaffBookingSlot } from "./staff-booking-slots.entity";
import { AppointmentStaffAssignment } from "./appointment-staff-assignment.entity";
import { randomUUID } from "crypto";
import { notifyAdminsOfNewBooking } from "./booking-notification.service";
import { Staff } from "../staffs/staffs.entity";
import { isWithinStaffWorkingHours } from "../staffs/staff-working-hours";
import { getVietnamMinuteOfDay } from "./booking-time";

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

const getBusinessMinuteOfDay = getVietnamMinuteOfDay;

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

    // Reservation slots, not appointment rows, represent occupied employee capacity.
    // One appointment may occupy the same interval for several employees.
    const reservedSlots = await AppDataSource.getRepository(StaffBookingSlot).find({
        where: {
            staff_id: In(staffIds),
            slot_start: Between(businessOpenTime, new Date(businessCloseTime.getTime() - 1)),
        },
    });
    const occupied = new Set(reservedSlots.map(slot => slot.staff_id + ":" + slot.slot_start.getTime()));

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
            if (!isWithinStaffWorkingHours(staff, getBusinessMinuteOfDay(startTime), getBusinessMinuteOfDay(endTime))) continue;
            const hasOverlap = getRequiredSlotStarts(startTime, endTime)
                .some(slot => occupied.has(staff.user_id + ":" + slot.getTime()));

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
    // ADMIN can book for themselves via the public flow, subject to the same
    // rules as CUSTOMER. Neither role may impersonate another user or pick staff.
    if (actorRole !== UserRole.CUSTOMER && actorRole !== UserRole.ADMIN) {
        throw new AppError("Only customers and admins can create personal appointments", 403, "FORBIDDEN");
    }

    if (data.user_id !== undefined || data.customer_email !== undefined || data.staff_id !== undefined) {
        throw new AppError("Public bookings cannot specify another customer or staff", 403, "FORBIDDEN");
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

    const businessStartMinute = getBusinessMinuteOfDay(data.start_time);
    const businessEndMinute = getBusinessMinuteOfDay(endTime);

    if (businessStartMinute < BUSINESS_OPEN_MINUTE) throw new AppError(`Appointment must start at or after ${formatMinuteOfDay(BUSINESS_OPEN_MINUTE)}`, 400, "OUTSIDE_BUSINESS_HOURS");

    if (businessEndMinute > BUSINESS_CLOSE_MINUTE) throw new AppError(`Appointment must end by ${formatMinuteOfDay(BUSINESS_CLOSE_MINUTE)}`, 400, "OUTSIDE_BUSINESS_HOURS");

    const created = await AppDataSource.transaction(async (manager) => {
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

        {
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
        const transactionStaffRepo = manager.getRepository(Staff);

        for (const staff of candidateStaffs) {
            // A locking read ensures ADMIN shift edits cannot race this assignment.
            const liveSchedule = await transactionStaffRepo.findOne({
                where: { user_id: staff.user_id },
                lock: { mode: "pessimistic_read" },
            });
            if (!liveSchedule || !isWithinStaffWorkingHours(liveSchedule, businessStartMinute, businessEndMinute)) continue;
            const activeUser = await manager.getRepository(User).findOne({
                where: { id: staff.user_id, is_active: true },
                lock: { mode: "pessimistic_read" },
            });
            if (!activeUser) continue;
            // The unique (staff_id, slot_start) key checks the real inventory
            // across all appointments, including legacy reservations.
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
        const primary = reservedStaffs[0];
        // Exactly one appointment per customer submission, regardless of party_size.
        const appointment = await transactionAppointmentRepo.save(transactionAppointmentRepo.create({
            user_id: ownerId,
            booking_group_id: bookingGroupId,
            party_size: data.party_size,
            customer_full_name: owner.full_name,
            customer_phone: data.customer_phone,
            customer_email: owner.email,
            staff_id: primary.user_id,
            staff_full_name: primary.user.full_name,
            branch_id: branchId,
            branch_name: branch.name,
            branch_address: branch.address,
            start_time: data.start_time,
            end_time: endTime,
            status: AppointmentStatus.PENDING,
        }));
        const assignments = reservedStaffs.map(staff => ({
            appointment_id: appointment.id,
            staff_id: staff.user_id,
            staff_full_name: staff.user.full_name,
        }));
        appointment.staff_assignments = await manager.getRepository(AppointmentStaffAssignment).save(assignments);
        appointment.appointment_services = await appointmentServiceRepo.save(services.map(service =>
            appointmentServiceRepo.create({
                appointment_id: appointment.id,
                service_id: service.id,
                service_name: service.name,
                price: service.price,
                duration_minutes: service.duration_minutes!,
            })
        ));
        return {
            appointment,
            assignedStaffNames: reservedStaffs.map(staff => staff.user.full_name),
        };
    });

    // Notify only after the booking transaction commits. Email cannot invalidate a booking.
    // Group bookings generate one email per ADMIN recipient, not one per staff assignment.
    void notifyAdminsOfNewBooking({
        bookingGroupId: created.appointment.booking_group_id!,
        customerName: created.appointment.customer_full_name,
        customerPhone: created.appointment.customer_phone,
        customerEmail: created.appointment.customer_email,
        branchName: created.appointment.branch_name,
        branchAddress: created.appointment.branch_address,
        startTime: created.appointment.start_time,
        endTime: created.appointment.end_time,
        partySize: created.appointment.party_size,
        staffNames: created.assignedStaffNames,
        services: services.map((service) => ({
            name: service.name,
            price: service.price,
            durationMinutes: service.duration_minutes!,
        })),
    }).catch((error) => {
        console.error("New booking admin notification failed", {
            bookingGroupId: created.appointment.booking_group_id,
            error,
        });
    });

    return created.appointment;
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
        .andWhere("appointment.merged_into_id IS NULL")
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
        .select("COALESCE(SUM(service.price * appointment.party_size), 0)", "revenue")
        .where("appointment.status = :completed", { completed: AppointmentStatus.COMPLETED })
        .andWhere("appointment.merged_into_id IS NULL")
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
        .leftJoinAndSelect("appointment.appointment_services", "appointment_services")
        .leftJoinAndSelect("appointment.staff_assignments", "staff_assignments")
        .where("appointment.merged_into_id IS NULL");

    if (role === UserRole.CUSTOMER || (role === UserRole.ADMIN && query.scope === "mine")) {
        queryBuilder.andWhere("appointment.user_id = :user_id", {
            user_id: userId,
        });
    }

    if (role === UserRole.STAFF) {
        const staff = await staffService.getStaff(userId);

        if (!staff) throw new AppError("Staff profile not found", 404, "STAFF_NOT_FOUND");

        queryBuilder.andWhere("EXISTS (SELECT 1 FROM appointment_staff_assignments asa WHERE asa.appointment_id = appointment.id AND asa.staff_id = :actor_staff_id)", { actor_staff_id: staff.user_id });
    }

    if (query.staff_id !== undefined) {
        queryBuilder.andWhere("EXISTS (SELECT 1 FROM appointment_staff_assignments asf WHERE asf.appointment_id = appointment.id AND asf.staff_id = :filter_staff_id)", { filter_staff_id: query.staff_id });
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

    if (query.booking_code !== undefined) {
        if (role !== UserRole.ADMIN) {
            throw new AppError("Booking reference search is available to admins only", 403, "FORBIDDEN");
        }
        // Booking confirmation uses the first 8 chars of booking_group_id,
        // or the appointment id for legacy records without a booking group.
        // Prefix matching uses the existing booking_group_id index.
        queryBuilder.andWhere(
            "(appointment.booking_group_id LIKE :booking_code OR (appointment.booking_group_id IS NULL AND appointment.id LIKE :booking_code))",
            { booking_code: query.booking_code + "%" },
        );
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
    const appointment = await appointmentRepo.findOne({
        where: { id, merged_into_id: IsNull() },
        relations: { appointment_services: true, staff_assignments: true },
    });
    if (!appointment) return null;
    if (role === UserRole.CUSTOMER && appointment.user_id !== userId) return null;
    if (role === UserRole.STAFF && !appointment.staff_assignments.some(s => s.staff_id === userId)) return null;
    return appointment;
};

export const updateAppointment = async (id: string, userId: string, role: UserRole, data: UpdateAppointmentDto) => {
    return AppDataSource.transaction(async (manager) => {
        const appointments = manager.getRepository(Appointment);
        const appointmentServicesRepo = manager.getRepository(AppointmentService);
        const assignmentRepo = manager.getRepository(AppointmentStaffAssignment);
        const appointment = await appointments.findOne({
            where: role === UserRole.CUSTOMER
                ? { id, user_id: userId, merged_into_id: IsNull() }
                : { id, merged_into_id: IsNull() },
            relations: { appointment_services: true, staff_assignments: true },
            lock: { mode: "pessimistic_write" },
        });
        if (!appointment) return null;
        if (role === UserRole.CUSTOMER) throw new AppError("Customers cannot update appointments", 403, "FORBIDDEN");
        if (role === UserRole.STAFF) {
            if (!appointment.staff_assignments.some(assigned => assigned.staff_id === userId)) {
                throw new AppError("Staff cannot update an unassigned appointment", 403, "FORBIDDEN");
            }
            if (data.staff_id !== undefined || data.branch_id !== undefined ||
                data.service_ids !== undefined || data.start_time !== undefined ||
                data.customer_phone !== undefined) {
                throw new AppError("Staff can only update assigned appointment status", 403, "FORBIDDEN");
            }
            if (data.status !== AppointmentStatus.IN_PROGRESS && data.status !== AppointmentStatus.COMPLETED) {
                throw new AppError("Staff can only start or complete an assigned appointment", 403, "FORBIDDEN");
            }
        }

        const scheduleChanged = data.branch_id !== undefined || data.staff_id !== undefined ||
            data.service_ids !== undefined || data.start_time !== undefined;
        if (scheduleChanged && ![AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(appointment.status)) {
            throw new AppError("In-progress, completed, or cancelled appointments cannot be modified", 409, "APPOINTMENT_NOT_EDITABLE");
        }
        if (data.customer_phone !== undefined) {
            if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED].includes(appointment.status)) {
                throw new AppError("Closed appointment contact information cannot be modified", 409, "APPOINTMENT_NOT_EDITABLE");
            }
            appointment.customer_phone = data.customer_phone;
        }

        if (data.status !== undefined) {
            const allowed: Record<AppointmentStatus, AppointmentStatus[]> = {
                [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
                [AppointmentStatus.CONFIRMED]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
                [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
                [AppointmentStatus.COMPLETED]: [],
                [AppointmentStatus.CANCELLED]: [],
            };
            if (!allowed[appointment.status].includes(data.status)) {
                throw new AppError("Invalid appointment status transition", 409, "INVALID_STATUS_TRANSITION");
            }
            if (data.status === AppointmentStatus.CONFIRMED) {
                const branch = await branchService.getBranch(appointment.branch_id);
                if (!branch || appointment.staff_assignments.length !== appointment.party_size) {
                    throw new AppError("Booking has invalid branch or staff capacity", 409, "SLOT_UNAVAILABLE");
                }
            }
            if (data.status === AppointmentStatus.IN_PROGRESS || data.status === AppointmentStatus.COMPLETED) {
                if (Date.now() < appointment.start_time.getTime()) {
                    throw new AppError("Appointment cannot start or complete before its scheduled time", 409, "APPOINTMENT_NOT_STARTED_YET");
                }
                if (data.status === AppointmentStatus.IN_PROGRESS) appointment.actual_started_at = new Date();
                if (data.status === AppointmentStatus.COMPLETED) appointment.actual_completed_at = new Date();
            }
            if (data.status === AppointmentStatus.COMPLETED || data.status === AppointmentStatus.CANCELLED) {
                const slots = getRequiredSlotStarts(appointment.start_time, appointment.end_time);
                for (const assignment of appointment.staff_assignments) {
                    await releaseStaffSlots(manager, assignment.staff_id, slots);
                }
            }
            appointment.status = data.status;
        }

        if (scheduleChanged) {
            const targetBranchId = data.branch_id ?? appointment.branch_id;
            const branch = await branchService.getBranch(targetBranchId);
            if (!branch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");
            if (targetBranchId !== appointment.branch_id && data.service_ids === undefined) {
                throw new AppError("Select services from the new branch", 400, "BRANCH_MISMATCH");
            }
            let chosenServices = appointment.appointment_services;
            if (data.service_ids !== undefined) {
                const current = await serviceService.getServicesByIds(data.service_ids);
                if (current.length !== data.service_ids.length) {
                    throw new AppError("One or more services were not found", 404, "SERVICE_NOT_FOUND");
                }
                if (current.some(service => service.branch_id !== targetBranchId)) {
                    throw new AppError("Services must belong to the selected branch", 400, "BRANCH_MISMATCH");
                }
                if (current.some(service => !service.booking_enabled || service.duration_minutes === null)) {
                    throw new AppError("Service is not available for booking", 409, "SERVICE_NOT_BOOKABLE");
                }
                chosenServices = current.map(service => ({
                    appointment_id: appointment.id,
                    service_id: service.id,
                    service_name: service.name,
                    price: service.price,
                    duration_minutes: service.duration_minutes!,
                } as AppointmentService));
            }
            const startTime = data.start_time ?? appointment.start_time;
            assertFifteenMinuteAligned(startTime);
            if (startTime.getTime() <= Date.now()) {
                throw new AppError("Appointment start time must be in the future", 400, "VALIDATION_ERROR");
            }
            const minutes = chosenServices.reduce((sum, service) => sum + service.duration_minutes, 0);
            const endTime = new Date(startTime.getTime() + minutes * 60_000);
            const startMinute = getBusinessMinuteOfDay(startTime);
            const endMinute = getBusinessMinuteOfDay(endTime);
            if (startMinute < BUSINESS_OPEN_MINUTE || endMinute > BUSINESS_CLOSE_MINUTE ||
                endTime.getTime() <= startTime.getTime()) {
                throw new AppError("Appointment is outside business hours", 409, "OUTSIDE_BUSINESS_HOURS");
            }
            const staffCandidates = await staffService.getAllStaffs({ branch_id: targetBranchId });
            if (data.staff_id !== undefined && !staffCandidates.some(staff => staff.user_id === data.staff_id)) {
                throw new AppError("Selected staff is not in this branch", 400, "BRANCH_MISMATCH");
            }
            const sortedCandidates = data.staff_id === undefined
                ? staffCandidates
                : [...staffCandidates].sort((a, b) => Number(b.user_id === data.staff_id) - Number(a.user_id === data.staff_id));
            const oldSlots = getRequiredSlotStarts(appointment.start_time, appointment.end_time);
            for (const assignment of appointment.staff_assignments) {
                await releaseStaffSlots(manager, assignment.staff_id, oldSlots);
            }
            const newSlots = getRequiredSlotStarts(startTime, endTime);
            const assigned: typeof staffCandidates = [];
            for (const candidate of sortedCandidates) {
                // Keep ADMIN shift edits and booking allocations serializable.
                const locked = await manager.getRepository(Staff).findOne({
                    where: { user_id: candidate.user_id },
                    lock: { mode: "pessimistic_read" },
                });
                if (!locked || !isWithinStaffWorkingHours(locked, startMinute, endMinute)) continue;
                const activeUser = await manager.getRepository(User).findOne({
                    where: { id: candidate.user_id, is_active: true },
                    lock: { mode: "pessimistic_read" },
                });
                if (!activeUser) continue;
                if (!await tryReserveStaffSlots(manager, candidate.user_id, newSlots)) continue;
                assigned.push(candidate);
                if (assigned.length === appointment.party_size) break;
            }
            // An explicitly selected employee must be part of the assignment.
            if (assigned.length !== appointment.party_size ||
                (data.staff_id !== undefined && !assigned.some(s => s.user_id === data.staff_id))) {
                throw new AppError("Not enough available staff for the appointment", 409, "SLOT_UNAVAILABLE");
            }
            await assignmentRepo.delete({ appointment_id: appointment.id });
            appointment.staff_assignments = await assignmentRepo.save(assigned.map(staff => ({
                appointment_id: appointment.id,
                staff_id: staff.user_id,
                staff_full_name: staff.user.full_name,
            })));
            appointment.staff_id = assigned[0].user_id;
            appointment.staff_full_name = assigned[0].user.full_name;
            appointment.branch_id = branch.id;
            appointment.branch_name = branch.name;
            appointment.branch_address = branch.address;
            appointment.start_time = startTime;
            appointment.end_time = endTime;
            if (data.service_ids !== undefined) {
                await appointmentServicesRepo.delete({ appointment_id: appointment.id });
                appointment.appointment_services = await appointmentServicesRepo.save(
                    chosenServices.map(s => appointmentServicesRepo.create({
                        appointment_id: appointment.id,
                        service_id: s.service_id,
                        service_name: s.service_name,
                        price: s.price,
                        duration_minutes: s.duration_minutes,
                    }))
                );
            }
        }
        return appointments.save(appointment);
    });
};

export const deleteAppointment = async (id: string) => {
    return await AppDataSource.transaction(async (manager) => {
        const transactionAppointmentRepo = manager.getRepository(Appointment);
        const appointmentServiceRepo = manager.getRepository(AppointmentService);

        const appointment = await transactionAppointmentRepo.findOne({
            where: { id, merged_into_id: IsNull() },
            relations: { appointment_services: true },
            lock: { mode: "pessimistic_write" },
        });

        if (!appointment) return null;

        // A single group booking owns reservations for every assigned employee.
        const assignments = await manager.getRepository(AppointmentStaffAssignment).findBy({
            appointment_id: appointment.id,
        });
        for (const assignment of assignments) {
            await releaseStaffSlots(manager, assignment.staff_id,
                getRequiredSlotStarts(appointment.start_time, appointment.end_time));
        }

        await appointmentServiceRepo.delete({
            appointment_id: appointment.id,
        });

        await transactionAppointmentRepo.remove(appointment);

        return appointment;
    });
};
