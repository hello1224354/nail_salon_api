import { createHmac } from "crypto";
import { MoreThan } from "typeorm";
import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { SecurityEvent } from "./security-event.entity";

const securityEventRepo = AppDataSource.getRepository(SecurityEvent);

export const SecurityEventType = {
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
    ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
    STAFF_CREATED: "STAFF_CREATED",
    STAFF_DISABLED: "STAFF_DISABLED",
} as const;

export function hashSensitive(value: string | null | undefined) {
    if (!value) return null;
    return createHmac("sha256", env.JWT_SECRET).update(value).digest("hex");
}

export async function createSecurityEvent(input: {
    event_type: string;
    request_id: string;
    user_id?: string | null;
    identifier?: string | null;
    ip?: string | null;
    user_agent?: string | null;
    detail?: string | null;
}) {
    const event = securityEventRepo.create({
        event_type: input.event_type,
        user_id: input.user_id ?? null,
        identifier_hash: hashSensitive(input.identifier),
        ip_hash: hashSensitive(input.ip),
        user_agent_hash: hashSensitive(input.user_agent),
        request_id: input.request_id,
        detail: input.detail?.slice(0, 255) ?? null,
    });

    return await securityEventRepo.save(event);
}

export async function countRecentIdentifierEvents(eventType: string, identifier: string, since: Date) {
    const identifierHash = hashSensitive(identifier);

    if (!identifierHash) return 0;

    return await securityEventRepo.count({
        where: {
            event_type: eventType,
            identifier_hash: identifierHash,
            created_at: MoreThan(since),
        },
    });
}


export async function countRecentIpEvents(eventType: string, ip: string, since: Date) {
    const ipHash = hashSensitive(ip);

    if (!ipHash) return 0;

    return await securityEventRepo.count({
        where: {
            event_type: eventType,
            ip_hash: ipHash,
            created_at: MoreThan(since),
        },
    });
}
