import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "NS Nail Studio",
        short_name: "NS Nail Studio",
        description: "Đặt lịch và khám phá dịch vụ chăm sóc móng tại NS Nail Studio.",
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
