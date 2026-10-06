import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RouteMotion } from "@/components/layout/RouteMotion";

export const metadata: Metadata = {
    applicationName: "Serpente Nail Room",
    title: {
        default: "Serpente Nail Room",
        template: "%s | Serpente Nail Room",
    },
    description: "Khám phá dịch vụ và đặt lịch chăm sóc móng tại Serpente Nail Room.",
    keywords: ["nail studio", "chăm sóc móng", "sơn gel", "nail art", "đặt lịch làm móng"],
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: "Serpente Nail Room",
        description: "Khám phá dịch vụ và đặt lịch chăm sóc móng tại Serpente Nail Room.",
        siteName: "Serpente Nail Room",
        locale: "vi_VN",
        type: "website",
    },
};

export const viewport: Viewport = {
    themeColor: "#f6f3ee",
    colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="vi" className="h-full antialiased">
            <body className="flex min-h-screen flex-col bg-cream text-ink">
                <Header />
                <main className="flex-1">
                    <RouteMotion>{children}</RouteMotion>
                </main>
                <Footer />
            </body>
        </html>
    );
}
