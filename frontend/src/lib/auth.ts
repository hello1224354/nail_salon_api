export type AuthUser = {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    role: string;
    is_active: boolean;
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

async function performRefresh() {
    if (typeof window === "undefined") return false;

    try {
        const response = await fetch("/api/users/session/refresh", {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
            cache: "no-store",
        });

        const body = (await response.json().catch(() => null)) as RefreshResponse | null;
        const data = body?.success?.data;

        if (
            !response.ok ||
            !data ||
            typeof data.access_token !== "string" ||
            !data.user
        ) {
            clearSession();
            return false;
        }

        saveSession(data.access_token, data.user);
        return true;
    } catch {
        clearSession();
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
            // Clear local in-memory state even if the network request fails.
        }
    }

    clearSession();
}