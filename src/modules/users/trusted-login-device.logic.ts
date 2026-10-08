import type { TrustedLoginDevice } from "./trusted-login-device.entity";
import type { User } from "./users.entity";

/** Authorization is always based on a server-stored device proof, not a client role claim. */
export function matchesTrustedLoginDevice(
    record: TrustedLoginDevice | null,
    user: Pick<User, "id" | "token_version" | "role">,
    userAgentHash: string | null,
    nowMs: number,
): boolean {
    return Boolean(
        record &&
        record.user_id === user.id &&
        record.token_version === user.token_version &&
        record.role === user.role &&
        record.user_agent_hash === userAgentHash &&
        record.revoked_at === null &&
        record.expires_at.getTime() > nowMs
    );
}
