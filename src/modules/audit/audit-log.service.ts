import { createHmac } from "crypto";
import { MoreThan } from "typeorm";
import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { UserRole } from "../users/users.entity";
import { AuditLog } from "./audit-log.entity";

const auditLogRepo = AppDataSource.getRepository(AuditLog);

export const AuditEventType = {
    HTTP_MUTATION: "HTTP_MUTATION",
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILED: "LOGIN_FAILED",
    LOGIN_RATE_LIMITED: "LOGIN_RATE_LIMITED",
    MFA_CHALLENGE_SENT: "MFA_CHALLENGE_SENT",
    MFA_FAILED: "MFA_FAILED",
    LOGOUT: "LOGOUT",
    REFRESH_SESSION: "REFRESH_SESSION",
    REFRESH_TOKEN_REUSE: "REFRESH_TOKEN_REUSE",
    PASSWORD_CHANGED: "PASSWORD_CHANGED",
    PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
    PASSWORD_RESET_COMPLETED: "PASSWORD_RESET_COMPLETED",
    STAFF_CREATED: "STAFF_CREATED",
    STAFF_DELETED: "STAFF_DELETED",
} as const;

interface CreateAuditLogData {
    event_type: string;
    request_id: string;
    user_id?: string | null;
    user_role?: UserRole | null;
    method?: string | null;
    path?: string | null;
    status_code?: number | null;
    identifier?: string | null;
    ip?: string | null;
    user_agent?: string | null;
    detail?: string | null;
}

export function hashSensitive(value: string | null | undefined) {
    if (!value) return null;
    return createHmac("sha256", env.JWT_SECRET).update(value).digest("hex");
}

export const createAuditLog = async (data: CreateAuditLogData) => {
    const auditLog = auditLogRepo.create({
        event_type: data.event_type,
        user_id: data.user_id ?? null,
        user_role: data.user_role ?? null,
        method: data.method ?? null,
        path: data.path ?? null,
        status_code: data.status_code ?? null,
        request_id: data.request_id,
        identifier_hash: hashSensitive(data.identifier),
        ip_hash: hashSensitive(data.ip),
        user_agent_hash: hashSensitive(data.user_agent),
        detail: data.detail?.slice(0, 255) ?? null,
    });

    return await auditLogRepo.save(auditLog);
};

export async function countRecentIdentifierAuditEvents(eventType: string, identifier: string, since: Date) {
    const identifierHash = hashSensitive(identifier);

    if (!identifierHash) return 0;

    return await auditLogRepo.count({
        where: {
            event_type: eventType,
            identifier_hash: identifierHash,
            created_at: MoreThan(since),
        },
    });
}

export async function countRecentIpAuditEvents(eventType: string, ip: string, since: Date) {
    const ipHash = hashSensitive(ip);

    if (!ipHash) return 0;

    return await auditLogRepo.count({
        where: {
            event_type: eventType,
            ip_hash: ipHash,
            created_at: MoreThan(since),
        },
    });
}
