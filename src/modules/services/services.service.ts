import { AppDataSource } from "../../config/database";
import { Service } from "./service.entity";
import { ServiceCategory } from "./service-category.entity";
import { parseNewServiceGroup } from "./service-categories";
import { In } from "typeorm";
import { CreateServiceDto, GetServicesQueryDto, UpdateServiceDto } from "./services.dto";
import { AppError } from "../../common/errors";
import * as branchService from "../branches/branches.service";
import { buildServiceUpdate } from "./service-update";

const serviceRepo = AppDataSource.getRepository(Service);
const groupRepo = AppDataSource.getRepository(ServiceCategory);

export const getServiceCategories = async (): Promise<string[]> => {
    const rows = await groupRepo.find({ order: { name: "ASC" } });
    return rows.map(row => row.name);
};

export const createServiceCategory = async (value: unknown): Promise<string> => {
    const name = parseNewServiceGroup(value);
    try {
        await groupRepo.insert({ name });
    } catch (cause) {
        const dbError = cause as { driverError?: { code?: string } };
        if (dbError.driverError?.code === "ER_DUP_ENTRY") {
            throw new AppError("Service group already exists", 409, "CATEGORY_EXISTS");
        }
        throw cause;
    }
    return name;
};

async function requireCategoryExists(name: string) {
    if (!await groupRepo.exists({ where: { name } })) {
        throw new AppError("Choose an existing service group", 400, "CATEGORY_NOT_FOUND");
    }
}


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
    await requireCategoryExists(data.category);

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

    if (data.category !== undefined) await requireCategoryExists(data.category);
    serviceRepo.merge(service, buildServiceUpdate(service, data));

    return await serviceRepo.save(service);
};

export const deleteService = async (id: string) => {
    const service = await getService(id);
    if (!service) return null;

    await serviceRepo.remove(service);
    return service;
};
