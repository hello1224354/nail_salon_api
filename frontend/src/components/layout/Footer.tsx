"use client";

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
            <div className="site-shell py-12 sm:py-14 lg:py-16">
                <div className="mx-auto grid w-full gap-x-10 gap-y-10 md:w-[90%] md:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)] lg:gap-x-14 xl:w-[78%]">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bba18e]">
                            Khám phá
                        </p>
                        <nav aria-label="Khám phá" className="mt-5 flex flex-col gap-3 text-sm text-white/90">
                            <Link className="w-fit transition-colors hover:text-[#d8c2b5]" href="/">Trang chủ</Link>
                            <Link className="w-fit transition-colors hover:text-[#d8c2b5]" href="/services">Bảng giá</Link>
                            <Link className="w-fit transition-colors hover:text-[#d8c2b5]" href="/appointments">Lịch của tôi</Link>
                        </nav>
                        <Link
                            href="/book"
                            className="focus-ring mt-6 inline-flex w-fit items-center gap-3 rounded-full border border-[#9a7767]/70 bg-white/5 px-5 py-2.5 text-xs font-semibold tracking-[0.03em] text-white transition-colors hover:border-[#c6aa97] hover:bg-white/10"
                        >
                            Đặt lịch
                            <span aria-hidden="true" className="text-sm leading-none text-[#d7bdab]">↗</span>
                        </Link>
                    </div>

                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bba18e]">
                            Liên hệ
                        </p>
                        {contentError && !contentLoading ? <p role="status" className="mt-2 text-xs text-[#f2bcb2]">{contentError}</p> : null}
                        <div className="mt-5 space-y-7">
                            {branches.map((branch) => {
                                const branchMapsUrl = getMapsSearchUrl(branch.address);
                                const phoneHref = branch.phone
                                    ? `tel:${branch.phone.replace(/[^+\d]/g, "")}`
                                    : null;

                                return (
                                    <div key={branch.id} className="space-y-3">
                                        <p className="font-serif text-[clamp(1.4rem,2vw,1.8rem)] leading-tight tracking-[-0.025em] text-white">
                                            {localizeBranchName(branch.name)}
                                        </p>
                                        <div className="space-y-3 text-sm leading-6 text-white/80">
                                            {branch.address ? (
                                                branchMapsUrl ? (
                                                    <a
                                                        href={branchMapsUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block max-w-[56ch] [overflow-wrap:anywhere] transition-colors hover:text-[#d8c2b5]"
                                                    >
                                                        {branch.address}
                                                    </a>
                                                ) : (
                                                    <p className="max-w-[56ch] [overflow-wrap:anywhere]">{branch.address}</p>
                                                )
                                            ) : null}
                                            {(branch.phone || branch.opening_hours) ? (
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px] text-white/75">
                                                    {branch.phone && phoneHref ? (
                                                        <a className="w-fit transition-colors hover:text-[#d8c2b5]" href={phoneHref}>
                                                            {branch.phone}
                                                        </a>
                                                    ) : null}
                                                    {branch.opening_hours ? <p>Mở cửa: {branch.opening_hours}</p> : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}

                            {(content?.contact_email || instagramUrl) ? (
                                <div className="flex flex-wrap items-center gap-x-7 gap-y-2 pt-1 text-[13px] text-white/80">
                                    {content?.contact_email ? (
                                        <a
                                            className="w-fit max-w-full [overflow-wrap:anywhere] transition-colors hover:text-[#d8c2b5]"
                                            href={`mailto:${content.contact_email}`}
                                        >
                                            {content.contact_email}
                                        </a>
                                    ) : null}
                                    {instagramUrl ? (
                                        <a href={instagramUrl} target="_blank" rel="noreferrer" className="w-fit max-w-full [overflow-wrap:anywhere] transition-colors hover:text-[#d8c2b5]">
                                            Instagram
                                        </a>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-12 flex w-full items-center justify-between gap-4 border-t border-white/15 pt-5 text-[11px] text-[#bfb0a4] md:w-[90%] xl:w-[78%]">
                    <span>© 2026 Serpente Nail Room</span>
                    <span className="text-right uppercase tracking-[0.14em]">Nail Studio</span>
                </div>
            </div>
        </footer>
    );
}
