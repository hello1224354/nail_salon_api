import { Request, Response } from "express";
import { env } from "../../config/env";
import { readAccountTrustCookie, trustedCookieName } from "./trusted-login-device.logic";

const COOKIE_NAME = env.NODE_ENV === "production" ? "__Secure-ns_login_trust" : "ns_login_trust";
const PATH = "/api/users/login";

function attributes() {
    return [
        "HttpOnly",
        `Path=${PATH}`,
        "SameSite=Lax",
        ...(env.NODE_ENV === "production" ? ["Secure"] : []),
        "Priority=High",
    ];
}

export function readTrustedLoginCookie(req: Request, userId: string): string | null {
    return readAccountTrustCookie(req.headers.cookie, COOKIE_NAME, userId);
}

export function setTrustedLoginCookie(res: Response, userId: string, proof: string, expiresAt: Date) {
    const seconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    res.append("Set-Cookie", [
        `${trustedCookieName(COOKIE_NAME, userId)}=${proof}`,
        ...attributes(),
        `Max-Age=${seconds}`,
        `Expires=${expiresAt.toUTCString()}`,
    ].join("; "));
}

export function clearTrustedLoginCookie(res: Response, userId: string) {
    res.append("Set-Cookie", [
        `${trustedCookieName(COOKIE_NAME, userId)}=`,
        ...attributes(),
        "Max-Age=0",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ].join("; "));
}
