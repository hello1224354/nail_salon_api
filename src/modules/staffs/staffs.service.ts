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
        where: query.branch_id === undefined
            ? { user: { role: UserRole.STAFF } }
            : { branch_id: query.branch_id, user: { role: UserRole.STAFF } },
        relations: { user: true, branch: true },
        order: { created_at: "ASC" },
    });
};

export const getAllStaffsForAdmin = getAllStaffs;

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

        staff.branch_id = data.branch_id;
    }

    return await staffRepo.save(staff);
};

export const deleteStaff = async (userId: string) => {
    const staff = await getStaff(userId);
    if (!staff) return null;

    await userService.deleteUser(userId);
    return staff;
};
