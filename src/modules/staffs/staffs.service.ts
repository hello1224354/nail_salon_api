import { AppDataSource } from "../../config/database";
import { Staff } from "./staffs.entity";

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

export const getStaffByUserId = async (userId: string) => {
    return await staffRepo.findOneBy({
        user_id: userId,
    });
};

export const createStaff = async (data: Partial<Staff>) => {
    const newStaff = staffRepo.create(data);
    return await staffRepo.save(newStaff);
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