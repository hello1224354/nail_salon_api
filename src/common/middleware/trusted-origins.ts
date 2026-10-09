/**
 * List only exact, explicitly configured website origins.
 * Do not infer trusted origins from request Host, Referer, or wildcard domains.
 */
export function trustedOrigins(primary: string, additional = ""): string[] {
    const values = [primary, ...additional.split(",")].map(origin => origin.trim()).filter(Boolean);
    const validated = values.map(origin => {
        let url: URL;
        try {
            url = new URL(origin);
        } catch {
            throw new Error("Invalid trusted origin configuration");
        }
        if (!["https:", "http:"].includes(url.protocol) || url.origin !== origin ||
            url.username || url.password || url.pathname !== "/" ||
            url.search || url.hash) {
            throw new Error("Trusted origins must be exact HTTP(S) origins without paths");
        }
        return url.origin;
    });
    return [...new Set(validated)];
}

export function isTrustedOrigin(origin: string | undefined, allowed: readonly string[]): boolean {
    return typeof origin === "string" && allowed.includes(origin);
}
