import { AppDataSource } from "../../config/database";
import { Staff } from "./staffs.entity";

const staffRepo = AppDataSource.getRepository(Staff);

export const getAllStaffs = async () => {
    return await staffRepo.find();
};

export const getStaff = async (id: string) => {
    return await staffRepo.findOneBy({ id });
};

export const createStaff = async (data: Partial<Staff>) => {
    const newStaff = staffRepo.create(data);
    return await staffRepo.save(newStaff);
};

export const updateStaff = async (id: string, data: Partial<Staff>) => {
    const staff = await getStaff(id);
    if (!staff) return null;
    staffRepo.merge(staff, data);
    return await staffRepo.save(staff);
};

export const deleteStaff = async (id: string) => {
    const staff = await getStaff(id);
    if (!staff) return null;
    return await staffRepo.remove(staff);
};