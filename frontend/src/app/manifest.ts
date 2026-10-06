import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Serpente Nail Room",
        short_name: "Serpente Nail Room",
        description: "Đặt lịch và khám phá dịch vụ chăm sóc móng tại Serpente Nail Room.",
        start_url: "/",
        display: "standalone",
        background_color: "#f6f3ee",
        theme_color: "#f6f3ee",
        lang: "vi",
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
        ],
    };
}
