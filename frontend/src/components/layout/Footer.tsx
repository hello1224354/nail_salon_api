"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { apiRequest, type SalonContent } from "@/lib/api";
import { getInstagramUrl, getMapsSearchUrl, localizeBranchName } from "@/lib/studio-data";
import { useBranch } from "@/components/branch/BranchProvider";

export function Footer() {
    const pathname = usePathname();
    const [content, setContent] = useState<SalonContent | null>(null);
    const { branches, selectedBranchId } = useBranch();

    useEffect(() => {
        if (selectedBranchId === null) return;

        let cancelled = false;

        async function loadFooterData() {
            try {
                const salonContent = await apiRequest<SalonContent>(
                    `/api/site-content?branch_id=${selectedBranchId}`
                );

                if (!cancelled) setContent(salonContent);
            } catch {
                // Footer vẫn hiển thị thông tin chi nhánh từ BranchProvider nếu site content tạm thời lỗi.
            }
        }

        void loadFooterData();

        return () => {
            cancelled = true;
        };
    }, [selectedBranchId]);

    if (pathname.startsWith("/admin")) return null;

    const instagramUrl = getInstagramUrl(content?.instagram_handle);

    return (
        <footer className="bg-studio-dark text-white">
            <div className="site-shell py-12 lg:py-14">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.25fr_0.65fr_1.1fr] lg:gap-16">
                    <div className="md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <Image
                                src="/brand/serpente-logo.svg"
                                alt=""
                                width={32}
                                height={32}
                                className="size-8 shrink-0 object-contain"
                            />
                            <span className="font-serif text-2xl">{content?.display_name || "Serpente Nail Room"}</span>
                        </div>
                        <p className="mt-4 max-w-sm text-sm leading-6 text-[#cdbfb3]">
                            Chọn mẫu bạn thích, Serpente chăm chút từng chi tiết để bộ móng lên tay thật vừa ý.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                            {instagramUrl ? (
                                <a href={instagramUrl} target="_blank" rel="noreferrer" className="hover:text-[#d8c2b5]">
                                    Instagram
                                </a>
                            ) : null}
                            {content?.facebook_name ? <span className="text-white/65">{content.facebook_name}</span> : null}
                            {content?.tiktok_name ? <span className="text-white/65">{content.tiktok_name}</span> : null}
                        </div>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bba18e]">
                            Khám phá
                        </p>
                        <nav className="mt-4 flex flex-col gap-2.5 text-sm">
                            <Link className="w-fit hover:text-[#d8c2b5]" href="/">Trang chủ</Link>
                            <Link className="w-fit hover:text-[#d8c2b5]" href="/services">Bảng giá</Link>
                            <Link className="w-fit hover:text-[#d8c2b5]" href="/book">Đặt lịch</Link>
                            <Link className="w-fit hover:text-[#d8c2b5]" href="/appointments">Lịch của tôi</Link>
                        </nav>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bba18e]">
                            Liên hệ
                        </p>
                        <div className="mt-4 space-y-5">
                            {branches.map((branch) => {
                                const branchMapsUrl = getMapsSearchUrl(branch.address);
                                const phoneHref = branch.phone
                                    ? `tel:${branch.phone.replace(/[^+\d]/g, "")}`
                                    : null;

                                return (
                                    <div key={branch.id} className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                                        <p className="font-serif text-xl text-white">
                                            {localizeBranchName(branch.name)}
                                        </p>
                                        <div className="mt-2 space-y-1.5 text-sm leading-6 text-white/90">
                                            {branch.address ? (
                                                branchMapsUrl ? (
                                                    <a
                                                        href={branchMapsUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block hover:text-[#d8c2b5]"
                                                    >
                                                        {branch.address}
                                                    </a>
                                                ) : (
                                                    <p>{branch.address}</p>
                                                )
                                            ) : null}
                                            {branch.phone && phoneHref ? (
                                                <a className="block w-fit hover:text-[#d8c2b5]" href={phoneHref}>
                                                    {branch.phone}
                                                </a>
                                            ) : null}
                                            {branch.opening_hours ? <p>Mở cửa: {branch.opening_hours}</p> : null}
                                        </div>
                                    </div>
                                );
                            })}

                            {content?.contact_email ? (
                                <a
                                    className="block w-fit text-sm text-white/90 hover:text-[#d8c2b5]"
                                    href={`mailto:${content.contact_email}`}
                                >
                                    {content.contact_email}
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-2 border-t border-white/15 pt-5 text-[11px] text-[#bfb0a4] sm:flex-row sm:items-center sm:justify-between">
                    <span>© 2026 Serpente Nail Room</span>
                    <span>Đặt lịch trực tuyến · Tiệm xác nhận lại trước giờ hẹn</span>
                </div>
            </div>
        </footer>
    );
}
