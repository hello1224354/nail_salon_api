import { Request, Response } from "express";
import { env } from "../../config/env";

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

export function readTrustedLoginCookie(req: Request): string | null {
    for (const raw of (req.headers.cookie ?? "").split(";")) {
        const part = raw.trim();
        const separator = part.indexOf("=");
        if (separator > 0 && part.slice(0, separator) === COOKIE_NAME) {
            return part.slice(separator + 1) || null;
        }
    }
    return null;
}

export function setTrustedLoginCookie(res: Response, proof: string, expiresAt: Date) {
    const seconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    res.append("Set-Cookie", [
        `${COOKIE_NAME}=${proof}`,
        ...attributes(),
        `Max-Age=${seconds}`,
        `Expires=${expiresAt.toUTCString()}`,
    ].join("; "));
}

export function clearTrustedLoginCookie(res: Response) {
    res.append("Set-Cookie", [
        `${COOKIE_NAME}=`,
        ...attributes(),
        "Max-Age=0",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ].join("; "));
}
