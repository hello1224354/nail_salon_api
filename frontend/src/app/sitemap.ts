import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
    return ["/", "/services", "/book"].map((path) => ({
        url: new URL(path, SITE_ORIGIN).toString(),
        changeFrequency: "weekly" as const,
        priority: path === "/" ? 1 : 0.8,
    }));
}
