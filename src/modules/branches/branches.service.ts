import { AppDataSource } from "../../config/database";
import { Branch } from "./branches.entity";
import { CreateBranchDto, GetBranchesQueryDto, UpdateBranchDto } from "./branches.dto";

const branchRepo = AppDataSource.getRepository(Branch);

export const getAllBranches = async (query: GetBranchesQueryDto) => {
    const [branches, total] = await branchRepo.findAndCount({
        order: {
            created_at: "ASC",
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
    });

    return {
        branches,
        total,
        page: query.page,
        limit: query.limit,
        total_pages: Math.ceil(total / query.limit),
    };
};

export const getBranch = async (id: number) => {
    return await branchRepo.findOneBy({ id });
};

export const createBranch = async (data: CreateBranchDto) => {
    const branch = branchRepo.create(data);

    return await branchRepo.save(branch);
};

export const updateBranch = async (id: number, data: UpdateBranchDto) => {
    const branch = await getBranch(id);

    if (!branch) return null;

    branchRepo.merge(branch, data);

    return await branchRepo.save(branch);
};