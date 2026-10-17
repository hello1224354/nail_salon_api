import { In } from "typeorm";
import { AppDataSource } from "../../config/database";
import { Staff } from "../staffs/staffs.entity";
import { User } from "../users/users.entity";
import { Branch } from "./branches.entity";
import { Offer } from "../offers/offer.entity";
import { AppointmentStaffAssignment } from "../appointments/appointment-staff-assignment.entity";
import { AppError } from "../../common/errors";
import { CreateBranchDto, GetBranchesQueryDto, UpdateBranchDto } from "./branches.dto";

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
        const transactionBranchRepo = manager.getRepository(Branch);
        const transactionStaffRepo = manager.getRepository(Staff);
        const transactionUserRepo = manager.getRepository(User);

        const branch = await transactionBranchRepo.findOne({
            where: { id },
            lock: { mode: "pessimistic_write" },
        });

        if (!branch) return null;

        if (await manager.getRepository(Offer).exists({ where: { branch_id: id } })) {
            throw new AppError(
                "This branch still has offers. Reassign or delete those offers first.",
                409, "BRANCH_HAS_OFFERS"
            );
        }

        const staffs = await transactionStaffRepo.find({
            where: { branch_id: id },
            select: { user_id: true },
        });

        const staffUserIds = staffs.map((staff) => staff.user_id);

        if (staffUserIds.length > 0) {
            const linkedAppointments = await manager.getRepository(AppointmentStaffAssignment).count({
                where: { staff_id: In(staffUserIds) },
            });
            if (linkedAppointments > 0) {
                throw new AppError(
                    "This branch has employees assigned to appointments. Reassign active work and retain historical records.",
                    409,
                    "BRANCH_HAS_ASSIGNED_STAFF",
                );
            }
            await transactionUserRepo.delete({
                id: In(staffUserIds),
            });
        }

        await transactionBranchRepo.remove(branch);

        return branch;
    });
};
