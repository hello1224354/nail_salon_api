import { Request, Response } from "express";
import { env } from "../../config/env";

const REFRESH_COOKIE_NAME = env.NODE_ENV === "production" ? "__Secure-ns_refresh" : "ns_refresh";

function baseCookieAttributes() {
    const attributes = [
        `${REFRESH_COOKIE_NAME}=`,
        "HttpOnly",
        "Path=/api/users/session",
        "SameSite=Lax",
    ];

    if (env.NODE_ENV === "production") {
        attributes.push("Secure");
    }

    return attributes;
}

export function setRefreshCookie(
    res: Response,
    refreshToken: string,
    expiresAt: Date,
    persistent = true
) {
    const [name, ...attributes] = baseCookieAttributes();
    const persistenceAttributes = persistent
        ? [
              `Max-Age=${Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))}`,
              `Expires=${expiresAt.toUTCString()}`,
          ]
        : [];

    res.setHeader("Set-Cookie", [
        `${name}${refreshToken}`,
        ...attributes,
        ...persistenceAttributes,
        "Priority=High",
    ].join("; "));
}

export function clearRefreshCookie(res: Response) {
    const [name, ...attributes] = baseCookieAttributes();

    res.setHeader("Set-Cookie", [
        name,
        ...attributes,
        "Max-Age=0",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        "Priority=High",
    ].join("; "));
}

export function readRefreshCookie(req: Request) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    for (const part of cookieHeader.split(";")) {
        const trimmed = part.trim();
        const separator = trimmed.indexOf("=");
        if (separator <= 0) continue;

        const name = trimmed.slice(0, separator);
        if (name !== REFRESH_COOKIE_NAME) continue;

        return trimmed.slice(separator + 1) || null;
    }

    return null;
}
