"use client";

import { usePathname } from "next/navigation";
import { useBranch } from "@/components/branch/BranchProvider";

export function InstagramContact() {
    const pathname = usePathname();
    const { salonContent } = useBranch();
    const handle = salonContent?.instagram_handle?.replace(/^@/, "").trim();
    const messageUrl = handle ? `https://ig.me/m/${encodeURIComponent(handle)}` : null;

    // Keep the operational dashboard free of customer-facing contact controls.
    if (pathname.startsWith("/admin") || !messageUrl) return null;

    return (
        <aside className="instagram-contact-dock" aria-label="Liên hệ Serpente">
            <a
                href={messageUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Nhắn tin Instagram cho Serpente để gửi mẫu nail và hỏi giá (mở tab mới)"
                title="Gửi mẫu nail, hỏi giá qua Instagram"
                className="focus-ring group inline-flex size-14 items-center justify-center gap-2.5 rounded-full border border-white/35 bg-[#8e5d58] text-white shadow-[0_8px_30px_rgba(48,40,35,0.24)] transition-colors hover:bg-[#764942] hover:shadow-[0_10px_34px_rgba(48,40,35,0.28)] sm:w-auto sm:min-w-14 sm:px-5"
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.85"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-6 shrink-0"
                >
                    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
                    <circle cx="12" cy="12" r="4.3" />
                    <circle cx="17.6" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
                <span className="hidden whitespace-nowrap text-xs font-semibold sm:inline">
                    Gửi mẫu · Hỏi giá
                </span>
            </a>
        </aside>
    );
}
