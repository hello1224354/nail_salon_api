export type AuthUser = {
    id: string;
    full_name: string;
    phone: string;
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
        let result = await requestRefreshOnce();

        if (refreshEpoch !== sessionEpoch) return false;

        const refreshErrorCode =
            result.body && "error" in result.body
                ? result.body.error?.code
                : undefined;

        if (
            result.response.status === 409 &&
            refreshErrorCode === "REFRESH_RACE"
        ) {
            await new Promise((resolve) => window.setTimeout(resolve, 150));

            if (refreshEpoch !== sessionEpoch) return false;

            result = await requestRefreshOnce();

            if (refreshEpoch !== sessionEpoch) return false;
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
            if (refreshEpoch === sessionEpoch) clearSession();
            return false;
        }

        if (refreshEpoch !== sessionEpoch) return false;

        saveSession(data.access_token, data.user);
        return true;
    } catch {
        if (refreshEpoch === sessionEpoch) clearSession();
        return false;
    }
}

export async function refreshSession() {
    if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
        });
    }

    return await refreshPromise;
}

export async function restoreSession() {
    if (accessToken && authUser) return true;
    return await refreshSession();
}

export async function logoutSession() {
    sessionEpoch += 1;
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