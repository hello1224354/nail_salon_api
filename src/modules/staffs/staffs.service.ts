import { AppDataSource } from "../../config/database";
import { Staff } from "./staffs.entity";
import { CreateStaffDto, GetStaffsQueryDto } from "./staffs.dto";
import * as userService from "../users/users.service";
import { UserRole } from "../users/users.entity";
import { AppError } from "../../common/errors";
import * as branchService from "../branches/branches.service";

const staffRepo = AppDataSource.getRepository(Staff);

export const getAllStaffs = async (query: GetStaffsQueryDto) => {
    const [staffs, total] = await staffRepo.findAndCount({
        where: query.branch_id === undefined ? {} : {
            branch_id: query.branch_id,
        },
        relations: {
            user: true,
        },
        order: {
            created_at: "ASC",
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });

    return {
        staffs,
        total,
        page: query.page,
        limit: query.limit,
        total_pages: Math.ceil(total / query.limit),
    };
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

export const updateStaff = async (userId: string, data: Partial<Staff>) => {
    const staff = await getStaff(userId);

    if (!staff) return null;

    if (data.branch_id !== undefined) {
        const branch = await branchService.getBranch(data.branch_id);

        if (!branch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");
    }

    staffRepo.merge(staff, data);

    return await staffRepo.save(staff);
};

export const deleteStaff = async (userId: string) => {
    const staff = await getStaff(userId);

    if (!staff) return null;

    return await staffRepo.remove(staff);
};