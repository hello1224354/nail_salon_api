import { AppDataSource } from "../../config/database";
import { Staff } from "./staffs.entity";

const staffService = AppDataSource.getRepository(Staff);

export const getAllStaffs = async () => {
    return await staffService.find();
}

export const getStaff = async (id: string) => {
    return await staffService.findOneBy({ id });
}

export const updateStaff = async (id: string, data: Partial<Staff>) => {
    return await staffService.update(id, data);
}

export const deleteStaff = async (id: string) => {
    return await staffService.delete(id);
}

export const createStaff = async (data: Partial<Staff>) => {
    return await staffService.save(data);
}