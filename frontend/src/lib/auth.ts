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
            const code = result.body && "error" in result.body
                ? result.body.error?.code
                : undefined;
            const expired = result.response.status === 401 && (
                code === "SESSION_INVALID" ||
                code === "INVALID_REFRESH_SESSION" ||
                code === "REFRESH_TOKEN_REUSE" ||
                code === "TOKEN_REVOKED"
            );
            if (expired) {
                if (refreshEpoch === sessionEpoch) clearSession();
                return false;
            }
            throw new Error("Không kết nối được phiên đăng nhập. Vui lòng thử lại.");
        }

        if (refreshEpoch !== sessionEpoch) return Boolean(accessToken && authUser);

        saveSession(data.access_token, data.user);
        return true;
    } catch (error) {
        // Network/server errors must not redirect to login or clear cookies.
        throw error;
    }
}

export async function refreshSession() {
    if (!refreshPromise) {
        // Avoid two tabs rotating the same HttpOnly refresh cookie at once.
        // Safari versions without Web Locks retain per-tab deduplication.
        const lockedRefresh = async (): Promise<boolean> => {
            if (typeof navigator !== "undefined" && navigator.locks) {
                return await navigator.locks.request("serpente:refresh-session", async () => {
                    return await performRefresh();
                });
            }
            return await performRefresh();
        };
        refreshPromise = lockedRefresh().finally(() => {
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