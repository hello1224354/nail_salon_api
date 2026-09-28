import { AppDataSource } from "../../config/database";
import { Staff } from "./staffs.entity";
import { CreateStaffDto, GetStaffsQueryDto, UpdateStaffDto } from "./staffs.dto";
import * as userService from "../users/users.service";
import { UserRole } from "../users/users.entity";
import { AppError } from "../../common/errors";
import * as branchService from "../branches/branches.service";

const staffRepo = AppDataSource.getRepository(Staff);

export const getAllStaffs = async (query: GetStaffsQueryDto) => {
    return await staffRepo.find({
        where: query.branch_id === undefined ? {
            user: {
                is_active: true,
                role: UserRole.STAFF,
            },
            branch: {
                is_active: true,
            },
        } : {
            branch_id: query.branch_id,
            user: {
                is_active: true,
                role: UserRole.STAFF,
            },
            branch: {
                is_active: true,
            },
        },
        relations: {
            user: true,
        },
        order: {
            created_at: "ASC",
        },
    });
};

export const getStaff = async (userId: string) => {
    return await staffRepo.findOne({
        where: {
            user_id: userId,
        },
        relations: {
            user: true,
        },
    });
};

export const createStaff = async (data: CreateStaffDto) => {
    const branch = await branchService.getBranch(data.branch_id);

    if (!branch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");

    if (!branch.is_active) throw new AppError("Branch is inactive", 400, "BRANCH_INACTIVE");

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
        });

        return await repo.save(newStaff);
    });
};

export const updateStaff = async (userId: string, data: UpdateStaffDto) => {
    const staff = await getStaff(userId);

    if (!staff) return null;

    if (data.branch_id !== undefined) {
        const branch = await branchService.getBranch(data.branch_id);

        if (!branch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");

        if (!branch.is_active) throw new AppError("Branch is inactive", 400, "BRANCH_INACTIVE");

        staff.branch_id = data.branch_id;
    }

    if (data.is_active !== undefined) {
        const user = await userService.setUserActive(userId, data.is_active);

        if (!user) return null;

        staff.user.is_active = user.is_active;
    }

    return await staffRepo.save(staff);
};

export const deleteStaff = async (userId: string) => {
    const staff = await getStaff(userId);

    if (!staff) return null;

    await userService.setUserActive(userId, false);

    staff.user.is_active = false;

    return staff;
};