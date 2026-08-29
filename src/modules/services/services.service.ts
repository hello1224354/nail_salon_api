import { AppDataSource } from "../../config/database";
import { Service } from "./service.entity";

const serviceRepo = AppDataSource.getRepository(Service);

export const getAllServices = async () => {
    return await serviceRepo.find();
};

export const createService = async (data: Partial<Service>) => {
    const newService = serviceRepo.create(data);
    return await serviceRepo.save(newService);
};

export const getService = async (id: string) => {
    return await serviceRepo.findOneBy({ id });
};

export const updateService = async (id: string, data: Partial<Service>) => {
    const service = await getService(id);
    if (!service) return null;
    serviceRepo.merge(service, data);
    return await serviceRepo.save(service);
};

export const deleteService = async (id: string) => {
    const service = await getService(id);
    if (!service) return null;
    return await serviceRepo.remove(service);
};