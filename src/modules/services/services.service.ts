import { AppDataSource } from "../../config/database";
import { Service } from "./service.entity";
import { In } from "typeorm";
import { GetServicesQueryDto } from "./services.dto";

const serviceRepo = AppDataSource.getRepository(Service);

export const getAllServices = async (query: GetServicesQueryDto) => {
    const [services, total] = await serviceRepo.findAndCount({
        order: {
            created_at: "DESC",
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });

    return {
        services,
        total,
        page: query.page,
        limit: query.limit,
        total_pages: Math.ceil(total / query.limit),
    };
};

export const createService = async (data: Partial<Service>) => {
    const newService = serviceRepo.create(data);
    return await serviceRepo.save(newService);
};

export const getService = async (id: string) => {
    return await serviceRepo.findOneBy({ id });
};

export const getServicesByIds = async (ids: string[]) => {
    return await serviceRepo.findBy({
        id: In(ids),
    });
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