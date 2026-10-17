import { AppDataSource } from "../../config/database";
import { WebsiteVisit } from "./website-visit.entity";
import { AppError } from "../../common/errors";

/** A visit is one browser-tab session, not a page view. */
export function parseVisitSessionId(value: unknown): string {
    if (typeof value !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        throw new AppError("Invalid visit session", 400, "VALIDATION_ERROR");
    }
    return value.toLowerCase();
}

export async function recordVisit(sessionId: string): Promise<void> {
    await AppDataSource.getRepository(WebsiteVisit).query(
        "INSERT INTO website_visits (session_id, first_seen_at, last_seen_at) " +
        "VALUES (?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)) " +
        "ON DUPLICATE KEY UPDATE last_seen_at = CURRENT_TIMESTAMP(3)",
        [sessionId]
    );
}

export async function getWebsiteTrafficSummary() {
    const data = await AppDataSource.getRepository(WebsiteVisit)
        .createQueryBuilder("visit")
        .select("COUNT(*)", "total_visits")
        .addSelect("COALESCE(SUM(CASE WHEN visit.last_seen_at >= :since THEN 1 ELSE 0 END), 0)", "online_visits")
        .setParameter("since", new Date(Date.now() - 5 * 60 * 1000))
        .getRawOne<{ total_visits: string; online_visits: string }>();
    return {
        total_visits: Number(data?.total_visits ?? 0),
        online_visits: Number(data?.online_visits ?? 0),
    };
}
