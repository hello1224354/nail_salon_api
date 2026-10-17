"use client";

import { useEffect } from "react";

/**
 * Count one visit per browser tab/session, not every route change or refresh.
 * Active traffic means this tab sent a heartbeat in the last five minutes.
 */
export function WebsiteVisitTracker() {
    useEffect(() => {
        let sessionId = "";
        try {
            const key = "serpente_site_visit_session";
            sessionId = sessionStorage.getItem(key) ?? "";
            if (!sessionId) {
                sessionId = crypto.randomUUID();
                sessionStorage.setItem(key, sessionId);
            }
        } catch {
            sessionId = crypto.randomUUID();
        }
        const ping = () => {
            if (document.visibilityState !== "visible") return;
            void fetch("/api/traffic/pulse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId }),
                cache: "no-store",
                keepalive: true,
            }).catch(() => undefined);
        };
        ping();
        const interval = window.setInterval(ping, 60_000);
        document.addEventListener("visibilitychange", ping);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", ping);
        };
    }, []);

    return null;
}
