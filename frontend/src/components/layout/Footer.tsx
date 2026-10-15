"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getInstagramUrl, getMapsSearchUrl, localizeBranchName } from "@/lib/studio-data";
import { useBranch } from "@/components/branch/BranchProvider";

export function Footer() {
    const pathname = usePathname();
    const { branches, salonContent: content, contentLoading, contentError } = useBranch();

    if (pathname.startsWith("/admin")) return null;

    const instagramUrl = getInstagramUrl(content?.instagram_handle);

    return (
        <footer className="bg-studio-dark text-white">
            <div className="site-shell py-12 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] lg:py-14 lg:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]">
                <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.65fr)_minmax(0,1.15fr)] xl:gap-12">
                    <div className="min-w-0 md:col-start-1 md:row-span-2 md:self-center xl:row-span-1">
                        <div className="flex items-center gap-4 sm:gap-5">
                            <Image
                                src="/brand/serpente-logo.svg"
                                alt=""
                                width={80}
                                height={80}
                                className="size-14 shrink-0 object-contain sm:size-16 xl:size-20"
                            />
                            <span className="min-w-0 font-serif text-3xl leading-[1.12] tracking-[-0.025em] sm:text-[2.125rem] lg:text-[clamp(2rem,2.4vw,3rem)]">{content?.display_name || "Serpente Nail Room"}</span>
                        </div>
                        {contentError && !contentLoading ? <p role="status" className="mt-2 text-xs text-[#f2bcb2]">{contentError}</p> : null}

                    </div>

                    <div className="min-w-0 md:col-start-2 xl:col-start-auto">
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

                    <div className="min-w-0 md:col-start-2 xl:col-start-auto">
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

                            {(content?.contact_email || instagramUrl) ? (
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                                    {content?.contact_email ? (
                                        <a
                                            className="w-fit text-white/90 hover:text-[#d8c2b5]"
                                            href={`mailto:${content.contact_email}`}
                                        >
                                            {content.contact_email}
                                        </a>
                                    ) : null}
                                    {instagramUrl ? (
                                        <a href={instagramUrl} target="_blank" rel="noreferrer" className="w-fit text-white/90 hover:text-[#d8c2b5]">
                                            Instagram
                                        </a>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-2 border-t border-white/15 pt-5 text-[11px] text-[#bfb0a4] sm:flex-row sm:items-center sm:justify-between">
                    <span>© 2026 Serpente Nail Room</span>
                </div>
            </div>
        </footer>
    );
}
