import { AppDataSource } from "../../config/database";
import { Service } from "./service.entity";

const serviceRepo = AppDataSource.getRepository(Service);

export const getAllServices = async () => {
    return await serviceRepo.find();
};

export const createService = async (data: Partial<Service>) => {
    return await serviceRepo.insert(data);
};

export const getService = async (id: string) => {
    return await serviceRepo.findOneBy({ id });
};

export const updateService = async (id: string, data: Partial<Service>) => {
    return await serviceRepo.update(id, data);
};

export const deleteService = async (id: string) => {
    return await serviceRepo.delete(id);
};