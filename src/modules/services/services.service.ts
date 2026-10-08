import { AppDataSource } from "../../config/database";
import { Service } from "./service.entity";
import { In } from "typeorm";
import { CreateServiceDto, GetServicesQueryDto, UpdateServiceDto } from "./services.dto";
import { AppError } from "../../common/errors";
import * as branchService from "../branches/branches.service";

const serviceRepo = AppDataSource.getRepository(Service);

export const getAllServices = async (query: GetServicesQueryDto) => {
    const [services, total] = await serviceRepo.findAndCount({
        where: query.branch_id === undefined ? {} : { branch_id: query.branch_id },
        order: { created_at: "DESC" },
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

export const getAllServicesForAdmin = getAllServices;

export const createService = async (data: CreateServiceDto) => {
    const branch = await branchService.getBranch(data.branch_id);

    if (!branch) throw new AppError("Branch not found", 404, "BRANCH_NOT_FOUND");

    const newService = serviceRepo.create({
        ...data,
        display_name: data.name,
        price_min: data.price,
        price_max: data.price,
        booking_enabled: data.booking_enabled,
    });
    return await serviceRepo.save(newService);
};

export const getService = async (id: string) => {
    return await serviceRepo.findOneBy({ id });
};

export const getServicesByIds = async (ids: string[]) => {
    return await serviceRepo.findBy({ id: In(ids) });
};

export const updateService = async (id: string, data: UpdateServiceDto) => {
    const service = await getService(id);
    if (!service) return null;

    serviceRepo.merge(service, data);

    if (data.name !== undefined) {
        service.display_name = data.name;
    }

    if (data.price !== undefined) {
        service.price_min = data.price;
        service.price_max = data.price;
    }

    if (service.booking_enabled && service.duration_minutes === null) {
        throw new AppError("Bookable service requires a duration", 400, "VALIDATION_ERROR");
    }

    return await serviceRepo.save(service);
};

export const deleteService = async (id: string) => {
    const service = await getService(id);
    if (!service) return null;

    await serviceRepo.remove(service);
    return service;
};
