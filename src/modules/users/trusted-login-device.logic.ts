import { createHash } from "crypto";
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

/** Stable account-scoped cookie key; never expose the account id in the cookie name. */
export function trustedCookieName(baseName: string, userId: string): string {
    const suffix = createHash("sha256").update(userId).digest("hex").slice(0, 32);
    return `${baseName}_${suffix}`;
}

function readCookie(header: string | undefined, name: string): string | null {
    for (const part of (header ?? "").split(";")) {
        const cookie = part.trim();
        const i = cookie.indexOf("=");
        if (i > 0 && cookie.slice(0, i) === name) return cookie.slice(i + 1) || null;
    }
    return null;
}

/** Account-scoped proof takes priority; legacy shared cookies remain usable until expiry. */
export function readAccountTrustCookie(
    header: string | undefined,
    baseName: string,
    userId: string,
): string | null {
    return readCookie(header, trustedCookieName(baseName, userId))
        ?? readCookie(header, baseName);
}
