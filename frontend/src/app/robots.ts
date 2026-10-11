import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: ["/", "/services", "/book"],
            disallow: ["/api/", "/admin", "/staff", "/account", "/appointments", "/login", "/register", "/forgot-password"],
        },
        sitemap: new URL("/sitemap.xml", SITE_ORIGIN).toString(),
    };
}
