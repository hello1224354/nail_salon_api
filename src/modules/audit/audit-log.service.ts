import { AppDataSource } from "../../config/database";
import { UserRole } from "../users/users.entity";
import { AuditLog } from "./audit-log.entity";

const auditLogRepo = AppDataSource.getRepository(AuditLog);

interface CreateAuditLogData {
    user_id: string;
    user_role: UserRole;
    method: string;
    path: string;
    status_code: number;
    request_id: string;
}

export const createAuditLog = async (data: CreateAuditLogData) => {
    const auditLog = auditLogRepo.create(data);

    return await auditLogRepo.save(auditLog);
};