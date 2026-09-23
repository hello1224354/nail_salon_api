import { AppDataSource } from "../../config/database";
import { Service } from "./service.entity";
import { In } from "typeorm";
import { CreateServiceDto, GetServicesQueryDto } from "./services.dto";
import { AppError } from "../../common/errors";
import * as branchService from "../branches/branches.service";

const serviceRepo = AppDataSource.getRepository(Service);

export const getAllServices = async (query: GetServicesQueryDto) => {
    const [services, total] = await serviceRepo.findAndCount({
        where: query.branch_id === undefined ? {
            is_active: true,
            branch: {
                is_active: true,
            },
        } : {
            branch_id: query.branch_id,
            is_active: true,
            branch: {
                is_active: true,
            },
        },
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

export const createService = async (data: CreateServiceDto) => {
    const branch = await branchService.getBranch(data.branch_id);

    if (!branch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");

    if (!branch.is_active) throw new AppError("Branch is inactive", 400, "BRANCH_INACTIVE");

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

    service.is_active = false;

    return await serviceRepo.save(service);
};