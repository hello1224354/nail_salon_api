import { apiRequest, type Branch, type BranchList, type SalonContent } from "@/lib/api";

export async function getPrimaryBranch(): Promise<Branch | null> {
    try {
        const data = await apiRequest<BranchList>("/api/branches?page=1&limit=1", {
            cache: "no-store",
        });

        return data.branches[0] ?? null;
    } catch {
        return null;
    }
}

export async function getSalonContent(): Promise<SalonContent | null> {
    try {
        return await apiRequest<SalonContent>("/api/site-content", {
            cache: "no-store",
        });
    } catch {
        return null;
    }
}
