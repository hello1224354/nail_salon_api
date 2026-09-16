import { AppDataSource } from "../../config/database";
import { Staff } from "./staffs.entity";
import { CreateStaffDto } from "./staffs.dto";
import * as userService from "../users/users.service";
import { UserRole } from "../users/users.entity";

const staffRepo = AppDataSource.getRepository(Staff);

export const getAllStaffs = async () => {
    return await staffRepo.find();
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

    staffRepo.merge(staff, data);

    return await staffRepo.save(staff);
};

export const deleteStaff = async (userId: string) => {
    const staff = await getStaff(userId);

    if (!staff) return null;

    return await staffRepo.remove(staff);
};