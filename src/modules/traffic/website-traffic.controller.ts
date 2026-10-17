import { Request, Response } from "express";
import { getWebsiteTrafficSummary, parseVisitSessionId, recordVisit } from "./website-traffic.service";

export async function pulse(req: Request, res: Response) {
    const sessionId = parseVisitSessionId((req.body as Record<string, unknown> | null)?.session_id);
    await recordVisit(sessionId);
    return res.status(204).end();
}

export async function summary(_req: Request, res: Response) {
    const data = await getWebsiteTrafficSummary();
    return res.status(200).json({ success: { message: "Website traffic summary", data } });
}
