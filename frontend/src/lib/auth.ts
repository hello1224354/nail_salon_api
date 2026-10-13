export type AuthUser = {
    id: string;
    full_name: string;
    email: string | null;
    role: string;
};

type RefreshResponse = {
    success?: {
        data?: {
            access_token?: string;
            user?: AuthUser;
        };
    };
};

export const AUTH_CHANGED_EVENT = "ns-nail-auth-changed";

let accessToken: string | null = null;
let authUser: AuthUser | null = null;
let refreshPromise: Promise<boolean> | null = null;
let sessionEpoch = 0;

function emitAuthChanged() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    }
}

export function saveSession(nextAccessToken: string, user: AuthUser) {
    // A login or successful refresh invalidates responses from older refresh
    // attempts. Otherwise an older 401 can clear a newer successful login.
    sessionEpoch += 1;
    accessToken = nextAccessToken;
    authUser = user;
    emitAuthChanged();
}

export function getAccessToken() {
    return accessToken;
}

export function getAuthUser() {
    return authUser;
}

export function clearSession() {
    // A pending refresh must never restore a session after logout.
    sessionEpoch += 1;
    accessToken = null;
    authUser = null;
    emitAuthChanged();
}

async function requestRefreshOnce() {
    const response = await fetch("/api/users/session/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
        cache: "no-store",
    });

    const body = (await response.json().catch(() => null)) as
        | RefreshResponse
        | { error?: { code?: string } }
        | null;

    return { response, body };
}

async function performRefresh() {
    if (typeof window === "undefined") return false;

    const refreshEpoch = sessionEpoch;

    try {
        // Serialize refresh cookie rotations across open tabs where Web Locks
        // are supported. Each tab sees the latest Set-Cookie before rotating.
        let result = await requestRefreshOnce();

        if (refreshEpoch !== sessionEpoch) return Boolean(accessToken && authUser);

        const refreshErrorCode =
            result.body && "error" in result.body
                ? result.body.error?.code
                : undefined;

        if (
            result.response.status === 409 &&
            refreshErrorCode === "REFRESH_RACE"
        ) {
            await new Promise((resolve) => window.setTimeout(resolve, 150));

            if (refreshEpoch !== sessionEpoch) return Boolean(accessToken && authUser);

            result = await requestRefreshOnce();

            if (refreshEpoch !== sessionEpoch) return Boolean(accessToken && authUser);
        }

        const data =
            result.body && "success" in result.body
                ? result.body.success?.data
                : undefined;

        if (
            !result.response.ok ||
            !data ||
            typeof data.access_token !== "string" ||
            !data.user
        ) {
            // Only a definitive invalid/revoked session expires client auth.
            // 429, 5xx, unexpected server responses and refresh races are
            // transient; never destroy a valid access token due to them.
            const code = result.body && "error" in result.body
                ? result.body.error?.code
                : undefined;
            const expired = result.response.status === 401 && (
                code === "INVALID_REFRESH_SESSION" ||
                code === "REFRESH_TOKEN_REUSE" ||
                code === "TOKEN_REVOKED"
            );
            if (expired && refreshEpoch === sessionEpoch) clearSession();
            return false;
        }

        if (refreshEpoch !== sessionEpoch) return Boolean(accessToken && authUser);

        saveSession(data.access_token, data.user);
        return true;
    } catch {
        // Network loss is not logout. The existing access token may still
        // work, and the refresh cookie may succeed once connectivity returns.
        return false;
    }
}

export async function refreshSession() {
    if (!refreshPromise) {
        const perform = () => performRefresh();
        // Browser-managed lock works across tabs under the same origin.
        // Keep the per-tab promise deduplication for browsers without locks.
        refreshPromise = (typeof navigator !== "undefined" && navigator.locks
            ? navigator.locks.request("serpente:refresh-session", perform)
            : perform()).finally(() => {
            refreshPromise = null;
        });
    }

    const restored = await refreshPromise;
    return restored || Boolean(accessToken && authUser);
}

export async function restoreSession() {
    if (accessToken && authUser) return true;
    return await refreshSession();
}

export async function logoutSession() {
    clearSession();

    if (typeof window !== "undefined") {
        try {
            await fetch("/api/users/session/logout", {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
                cache: "no-store",
            });
        } catch {
            // Local state is already cleared; server-side revocation can only happen once connectivity returns.
        }
    }
}