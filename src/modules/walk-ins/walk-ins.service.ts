import { In } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { Staff } from "../staffs/staffs.entity";
import { Service } from "../services/service.entity";
import { UserRole } from "../users/users.entity";
import { CreateWalkInDto } from "./walk-ins.dto";
import { WalkInVisit } from "./walk-in-visit.entity";
import { WalkInVisitService } from "./walk-in-visit-service.entity";

export async function createWalkIn(actorId: string, data: CreateWalkInDto) {
    return AppDataSource.transaction(async manager => {
        const staff = await manager.getRepository(Staff).findOne({
            where: { user_id: actorId },
            relations: { user: true, branch: true },
        });
        if (!staff || !staff.branch || staff.user.role !== UserRole.STAFF) {
            throw new AppError("Staff profile not found", 403, "FORBIDDEN");
        }
        const ids = data.services.map(item => item.service_id);
        const services = await manager.getRepository(Service).findBy({ id: In(ids) });
        if (services.length !== ids.length || services.some(item => item.branch_id !== staff.branch_id)) {
            throw new AppError("All services must belong to the employee's branch", 400, "BRANCH_MISMATCH");
        }
        const byId = new Map(services.map(service => [service.id, service]));
        const visitRepo = manager.getRepository(WalkInVisit);
        const visit = await visitRepo.save(visitRepo.create({
            staff_id: actorId,
            staff_full_name: staff.user.full_name,
            branch_id: staff.branch_id,
            branch_name: staff.branch.name,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_email: data.customer_email,
        }));
        visit.services = await manager.getRepository(WalkInVisitService).save(
            data.services.map(item => ({
                visit_id: visit.id,
                service_id: item.service_id,
                service_name: byId.get(item.service_id)!.display_name || byId.get(item.service_id)!.name,
                reference_price: byId.get(item.service_id)!.price,
                actual_price: item.actual_price,
            })),
        );
        return visit;
    });
}

export async function listWalkIns(actorId: string, role: UserRole) {
    if (role !== UserRole.STAFF && role !== UserRole.ADMIN) {
        throw new AppError("Staff or admin access required", 403, "FORBIDDEN");
    }
    const repo = AppDataSource.getRepository(WalkInVisit);
    const [visits, total] = await repo.findAndCount({
        where: role === UserRole.STAFF ? { staff_id: actorId } : {},
        relations: { services: true },
        order: { served_at: "DESC" },
        take: 100,
    });
    return { visits, total };
}
