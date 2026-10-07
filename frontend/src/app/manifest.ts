import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Serpente Nail Room",
        short_name: "Serpente Nail Room",
        description: "Xem bảng giá và đặt lịch tại Serpente Nail Room, Quận 8.",
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
