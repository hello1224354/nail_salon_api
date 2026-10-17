import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { InstagramContact } from "@/components/layout/InstagramContact";
import { RouteMotion } from "@/components/layout/RouteMotion";
import { BranchProvider } from "@/components/branch/BranchProvider";
import { WebsiteVisitTracker } from "@/components/traffic/WebsiteVisitTracker";
import { SITE_ORIGIN } from "@/lib/site-url";

// Self-host one Vietnamese-capable display font on every device.
// This ensures consistent typography without device-specific fallback metrics.
const displayFont = Noto_Sans({
    subsets: ["latin", "vietnamese"],
    display: "swap",
    variable: "--font-display-loaded",
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_ORIGIN),
    applicationName: "Serpente Nail Room",
    title: {
        default: "Serpente Nail Room",
        template: "%s | Serpente Nail Room",
    },
    description: "Xem bảng giá, mẫu móng và đặt lịch tại Serpente Nail Room, Quận 8.",
    keywords: ["Serpente Nail Room", "tiệm nail Quận 8", "bảng giá nail", "đặt lịch làm móng", "sơn gel"],
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: "Serpente Nail Room",
        description: "Xem bảng giá, mẫu móng và đặt lịch tại Serpente Nail Room, Quận 8.",
        siteName: "Serpente Nail Room",
        locale: "vi_VN",
        type: "website",
    },
};

export const viewport: Viewport = {
    themeColor: "#f6f3ee",
    colorScheme: "light",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    // CSP uses a fresh nonce for every response. The HTML and Next.js hydration
    // scripts must be rendered within that same request, never at build time.
    await connection();

    return (
        <html lang="vi" className={`${displayFont.variable} h-full antialiased`}>
            <body className="flex min-h-screen flex-col bg-cream text-ink">
                <WebsiteVisitTracker />
                <BranchProvider>
                    <Header />
                    <div className="relative grid flex-1">
                        <div className="col-start-1 row-start-1 flex min-w-0 flex-col">
                            <main className="flex-1">
                                <RouteMotion>{children}</RouteMotion>
                            </main>
                            <Footer />
                        </div>
                        <InstagramContact />
                    </div>
                </BranchProvider>
            </body>
        </html>
    );
}
