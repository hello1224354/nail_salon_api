import { AppDataSource } from "../../config/database";
import bcrypt from "bcryptjs";
import { IsNull } from "typeorm";
import { getVietnamMinuteOfDay } from "../appointments/booking-time";
import { RefreshSession } from "../users/refresh-session.entity";
import { Staff } from "./staffs.entity";
import { CreateStaffDto, GetStaffsQueryDto, UpdateStaffDto } from "./staffs.dto";
import * as userService from "../users/users.service";
import { User, UserRole } from "../users/users.entity";
import { AppError } from "../../common/errors";
import * as branchService from "../branches/branches.service";
import { Branch } from "../branches/branches.entity";
import { Appointment, AppointmentStatus } from "../appointments/appointments.entity";
import { isWithinStaffWorkingHours, assertValidWorkingHours } from "./staff-working-hours";

const staffRepo = AppDataSource.getRepository(Staff);

export const getAllStaffs = async (query: GetStaffsQueryDto) => {
    return await staffRepo.find({
        where: query.branch_id === undefined ? {
            user: { role: UserRole.STAFF, is_active: true },
        } : {
            branch_id: query.branch_id,
            user: { role: UserRole.STAFF, is_active: true },
        },
        relations: { user: true },
        order: { created_at: "ASC" },
    });
};

export const getAllStaffsForAdmin = async (query: GetStaffsQueryDto) => {
    return await staffRepo.find({
        where: query.branch_id === undefined ? {
            user: { role: UserRole.STAFF, is_active: true },
        } : {
            branch_id: query.branch_id,
            user: { role: UserRole.STAFF, is_active: true },
        },
        relations: { user: true, branch: true },
        order: { created_at: "ASC" },
    });
};

export const getStaff = async (userId: string) => {
    return await staffRepo.findOne({
        where: { user_id: userId },
        relations: { user: true, branch: true },
    });
};

export const createStaff = async (data: CreateStaffDto) => {
    const branch = await branchService.getBranch(data.branch_id);

    if (!branch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");

    return await AppDataSource.transaction(async (manager) => {
        const user = await userService.createUser(
            {
                full_name: data.full_name,
                phone: data.phone,
                email: data.email,
                password: data.password,
            },
            UserRole.STAFF,
            manager
        );

        const repo = manager.getRepository(Staff);
        const newStaff = repo.create({
            user_id: user.id,
            branch_id: data.branch_id,
            work_start_time: data.work_start_time,
            work_end_time: data.work_end_time,
        });

        return await repo.save(newStaff);
    });
};

export const updateStaff = async (userId: string, data: UpdateStaffDto) => {
    return AppDataSource.transaction(async (manager) => {
        const users = manager.getRepository(User);
        const staffs = manager.getRepository(Staff);
        const staff = await staffs.findOne({ where: { user_id: userId }, lock: { mode: "pessimistic_write" } });
        if (!staff) return null;
        const user = await users.findOne({ where: { id: userId, role: UserRole.STAFF, is_active: true }, lock: { mode: "pessimistic_write" } });
        if (!user) throw new AppError("Only staff accounts can be updated here", 403, "FORBIDDEN");

        if (data.branch_id !== undefined) {
            const branch = await manager.getRepository(Branch).findOneBy({ id: data.branch_id });
            if (!branch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");
            staff.branch_id = data.branch_id;
        }

        if (data.work_start_time !== undefined || data.work_end_time !== undefined) {
            const workStart = data.work_start_time ?? staff.work_start_time;
            const workEnd = data.work_end_time ?? staff.work_end_time;
            assertValidWorkingHours(workStart, workEnd);
            // A schedule change must not silently place an existing appointment outside the shift.
            const futureAppointments = await manager.getRepository(Appointment)
                .createQueryBuilder("appointment")
                .innerJoin("appointment.staff_assignments", "assigned", "assigned.staff_id = :userId", { userId })
                .where("appointment.merged_into_id IS NULL")
                .andWhere("appointment.status IN (:...statuses)", { statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] })
                .andWhere("appointment.end_time > :now", { now: new Date() })
                .getMany();
            for (const appointment of futureAppointments) {
                const start = getVietnamMinuteOfDay(appointment.start_time);
                const end = getVietnamMinuteOfDay(appointment.end_time);
                if (!isWithinStaffWorkingHours({ work_start_time: workStart, work_end_time: workEnd }, start, end)) {
                    throw new AppError("Existing upcoming appointments fall outside the proposed working hours", 409, "STAFF_SCHEDULE_CONFLICT");
                }
            }
            staff.work_start_time = workStart;
            staff.work_end_time = workEnd;
        }

        const emailChanged = data.email !== undefined && data.email !== user.email;
        if (data.email && emailChanged) {
            const duplicate = await users.findOneBy({ email: data.email });
            if (duplicate && duplicate.id !== user.id) throw new AppError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");
            user.email = data.email;
        }
        if (data.phone && data.phone !== user.phone) {
            const duplicate = await users.findOneBy({ phone: data.phone });
            if (duplicate && duplicate.id !== user.id) throw new AppError("Phone already exists", 409, "PHONE_ALREADY_EXISTS");
            user.phone = data.phone;
        }
        if (data.full_name !== undefined) user.full_name = data.full_name;
        if (data.password !== undefined) {
            user.password_hash = await bcrypt.hash(data.password, 12);
        }

        if (emailChanged || data.password !== undefined) {
            user.token_version += 1;
            await manager.getRepository(RefreshSession).update(
                { user_id: user.id, revoked_at: IsNull() },
                { revoked_at: new Date() }
            );
        }

        await users.save(user);
        await staffs.save(staff);
        return staff;
    });
};

export const deleteStaff = async (userId: string) => {
    // Preserve assignment/appointment history and foreign keys. "Delete" archives
    // the staff account, removing it from booking candidates and staff lists.
    return AppDataSource.transaction(async (manager) => {
        const users = manager.getRepository(User);
        const staffs = manager.getRepository(Staff);

        const staff = await staffs.findOne({
            where: { user_id: userId },
            lock: { mode: "pessimistic_write" },
        });
        if (!staff) return null;

        const user = await users.findOne({
            where: { id: userId, role: UserRole.STAFF },
            lock: { mode: "pessimistic_write" },
        });
        if (!user || !user.is_active) return null;

        const upcoming = await manager.getRepository(Appointment)
            .createQueryBuilder("appointment")
            .innerJoin("appointment.staff_assignments", "assignment", "assignment.staff_id = :userId", { userId })
            .where("appointment.merged_into_id IS NULL")
            .andWhere("appointment.status IN (:...statuses)", {
                statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS],
            })
            .andWhere("appointment.end_time > :now", { now: new Date() })
            .getCount();
        if (upcoming > 0) {
            throw new AppError("Staff has active or upcoming appointments", 409, "STAFF_HAS_UPCOMING_BOOKINGS");
        }

        user.is_active = false;
        user.token_version += 1;
        await users.save(user);

        await manager.getRepository(RefreshSession).update(
            { user_id: userId, revoked_at: IsNull() },
            { revoked_at: new Date() },
        );

        staff.user = user;
        return staff;
    });
};
