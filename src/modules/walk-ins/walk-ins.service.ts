import { In } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AppError } from "../../common/errors";
import { Staff } from "../staffs/staffs.entity";
import { Service } from "../services/service.entity";
import { UserRole } from "../users/users.entity";
import { CreateWalkInDto } from "./walk-ins.dto";
import { WalkInVisit } from "./walk-in-visit.entity";
import { WalkInVisitService } from "./walk-in-visit-service.entity";
import { monthWindow } from "../appointments/admin-month-summary";
import type { WalkInListQuery } from "./walk-ins.query";

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

export async function listWalkIns(actorId: string, role: UserRole, query: WalkInListQuery) {
    if (role !== UserRole.STAFF && role !== UserRole.ADMIN) {
        throw new AppError("Staff or admin access required", 403, "FORBIDDEN");
    }
    if (role === UserRole.STAFF && (query.month !== undefined ||
        query.branch_id !== undefined || query.from !== undefined || query.to !== undefined)) {
        throw new AppError("Advanced filters are available to admins only", 403, "FORBIDDEN");
    }
    const repo = AppDataSource.getRepository(WalkInVisit);
    const where = role === UserRole.STAFF ? { staff_id: actorId } : undefined;
    const qb = repo.createQueryBuilder("visit")
        .leftJoinAndSelect("visit.services", "services")
        .orderBy("visit.served_at", "DESC").addOrderBy("visit.id", "DESC");
    if (where) qb.where("visit.staff_id = :staffId", { staffId: actorId });
    if (role === UserRole.ADMIN) {
        if (query.month !== undefined) {
            const { start, end } = monthWindow(query.month);
            qb.andWhere("visit.served_at >= :monthFrom AND visit.served_at < :monthTo", {
                monthFrom: start, monthTo: end,
            });
        }
        if (query.branch_id !== undefined) qb.andWhere("visit.branch_id = :branchId", { branchId: query.branch_id });
        if (query.from !== undefined) qb.andWhere("visit.served_at >= :from", { from: query.from });
        if (query.to !== undefined) qb.andWhere("visit.served_at < :to", { to: query.to });
    }
    const limit = role === UserRole.ADMIN ? query.limit : 100;
    const page = role === UserRole.ADMIN ? query.page : 1;
    qb.skip((page - 1) * limit).take(limit);
    const [visits, total] = await qb.getManyAndCount();
    return { visits, total, page, limit, total_pages: Math.ceil(total / limit) };
}

/**
 * Only administrative corrections are allowed: identity and recorded actual
 * charges. Branch, worker, service membership and visit date stay immutable.
 */
export async function updateWalkIn(id: string, data: CreateWalkInDto) {
    return AppDataSource.transaction(async manager => {
        const visitRepo = manager.getRepository(WalkInVisit);
        const visit = await visitRepo.findOne({
            where: { id }, relations: { services: true },
            lock: { mode: "pessimistic_write" },
        });
        if (!visit) return null;
        const previous = new Map(visit.services.map(row => [row.service_id, row]));
        if (previous.size !== data.services.length ||
            data.services.some(row => !previous.has(row.service_id))) {
            throw new AppError("Walk-in services cannot be changed; edit recorded prices only", 400, "SERVICE_MISMATCH");
        }
        visit.customer_name = data.customer_name;
        visit.customer_phone = data.customer_phone;
        visit.customer_email = data.customer_email;
        await visitRepo.save(visit);
        for (const selected of data.services) {
            const line = previous.get(selected.service_id)!;
            line.actual_price = selected.actual_price;
            await manager.getRepository(WalkInVisitService).save(line);
        }
        return visit;
    });
}

export async function deleteWalkIn(id: string) {
    return AppDataSource.transaction(async manager => {
        const repo = manager.getRepository(WalkInVisit);
        const visit = await repo.findOne({
            where: { id }, relations: { services: true }, lock: { mode: "pessimistic_write" },
        });
        if (!visit) return null;
        await repo.remove(visit);
        return visit;
    });
}
