import { In } from "typeorm";
import { AppDataSource } from "../../config/database";
import { Branch } from "./branches.entity";
import { CreateBranchDto, GetBranchesQueryDto, UpdateBranchDto } from "./branches.dto";
import { Service } from "../services/service.entity";
import { Staff } from "../staffs/staffs.entity";
import { User } from "../users/users.entity";
import { StaffBookingSlot } from "../appointments/staff-booking-slots.entity";

const branchRepo = AppDataSource.getRepository(Branch);

export const getAllBranches = async (query: GetBranchesQueryDto) => {
    const [branches, total] = await branchRepo.findAndCount({
        order: { created_at: "ASC" },
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

export const getAllBranchesForAdmin = getAllBranches;

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

export const deleteBranch = async (id: number) => {
    return await AppDataSource.transaction(async (manager) => {
        const repo = manager.getRepository(Branch);
        const branch = await repo.findOneBy({ id });
        if (!branch) return null;

        const staffRepo = manager.getRepository(Staff);
        const staffs = await staffRepo.findBy({ branch_id: id });
        const staffIds = staffs.map((staff) => staff.user_id);

        if (staffIds.length > 0) {
            await manager.getRepository(StaffBookingSlot).delete({ staff_id: In(staffIds) });
            await staffRepo.delete({ user_id: In(staffIds) });
            await manager.getRepository(User).delete({ id: In(staffIds) });
        }

        await manager.getRepository(Service).delete({ branch_id: id });
        await repo.remove(branch);

        return branch;
    });
};
