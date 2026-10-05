export type AuthUser = {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    role: string;
    is_active: boolean;
};

const ACCESS_TOKEN_KEY = "ns_nail_access_token";
const AUTH_USER_KEY = "ns_nail_auth_user";
export const AUTH_CHANGED_EVENT = "ns-nail-auth-changed";

function emitAuthChanged() {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function saveSession(accessToken: string, user: AuthUser) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    emitAuthChanged();
}

export function getAccessToken() {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
    const value = sessionStorage.getItem(AUTH_USER_KEY);
    if (!value) return null;

    try {
        return JSON.parse(value) as AuthUser;
    } catch {
        clearSession();
        return null;
    }
}

export function clearSession() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    emitAuthChanged();
}
