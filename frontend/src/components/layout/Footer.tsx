"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { getInstagramUrl, getMapsSearchUrl, localizeBranchName } from "@/lib/studio-data";
import { useBranch } from "@/components/branch/BranchProvider";

const headingClass = "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bba18e]";
const linkClass = "w-fit max-w-full [overflow-wrap:anywhere] text-white/80 transition-colors hover:text-[#d8c2b5]";

export function Footer() {
    const pathname = usePathname();
    const { branches, salonContent: content, contentLoading, contentError } = useBranch();

    if (pathname.startsWith("/admin")) return null;

    const instagramUrl = getInstagramUrl(content?.instagram_handle);

    return (
        <footer className="bg-studio-dark text-white">
            <div className="site-shell py-12 sm:py-14 lg:py-16">
                <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-12">
                    <section className="min-w-0">
                        <h2 className={headingClass}>Khám phá</h2>
                        <nav aria-label="Khám phá" className="mt-5 flex flex-col items-start gap-3 text-sm">
                            <Link className={linkClass} href="/">Trang chủ</Link>
                            <Link className={linkClass} href="/services">Bảng giá</Link>
                        </nav>
                    </section>

                    <section className="min-w-0">
                        <h2 className={headingClass}>Lịch hẹn</h2>
                        <nav aria-label="Lịch hẹn" className="mt-5 flex flex-col items-start gap-3 text-sm">
                            <Link className={linkClass} href="/book">Đặt lịch</Link>
                            <Link className={linkClass} href="/appointments">Lịch của tôi</Link>
                        </nav>
                    </section>

                    <section className="min-w-0">
                        <h2 className={headingClass}>Chi nhánh</h2>
                        <div className="mt-5 space-y-6">
                            {branches.map((branch) => {
                                const branchMapsUrl = getMapsSearchUrl(branch.address);

                                return (
                                    <div key={branch.id} className="space-y-2 text-sm leading-6">
                                        <p className="font-medium text-white">{localizeBranchName(branch.name)}</p>
                                        {branch.address ? (
                                            branchMapsUrl ? (
                                                <a
                                                    href={branchMapsUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block [overflow-wrap:anywhere] text-white/75 transition-colors hover:text-[#d8c2b5]"
                                                >
                                                    {branch.address}
                                                </a>
                                            ) : (
                                                <p className="[overflow-wrap:anywhere] text-white/75">{branch.address}</p>
                                            )
                                        ) : null}
                                        {branch.opening_hours ? (
                                            <p className="text-white/75">Mở cửa: {branch.opening_hours}</p>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="min-w-0">
                        <h2 className={headingClass}>Kết nối</h2>
                        {contentError && !contentLoading ? (
                            <p role="status" className="mt-2 text-xs text-[#f2bcb2]">{contentError}</p>
                        ) : null}
                        <div className="mt-5 flex flex-col items-start gap-3 text-sm leading-6">
                            {branches.map((branch) => {
                                const phoneHref = branch.phone
                                    ? `tel:${branch.phone.replace(/[^+\d]/g, "")}`
                                    : null;

                                return branch.phone && phoneHref ? (
                                    <div key={branch.id} className="min-w-0">
                                        {branches.length > 1 ? (
                                            <p className="text-xs text-white/60">{localizeBranchName(branch.name)}</p>
                                        ) : null}
                                        <a className={linkClass} href={phoneHref}>{branch.phone}</a>
                                    </div>
                                ) : null;
                            })}
                            {content?.contact_email ? (
                                <a className={linkClass} href={`mailto:${content.contact_email}`}>
                                    {content.contact_email}
                                </a>
                            ) : null}
                            {instagramUrl ? (
                                <a className={linkClass} href={instagramUrl} target="_blank" rel="noreferrer">
                                    Instagram
                                </a>
                            ) : null}
                        </div>
                    </section>
                </div>

                <div className="mt-12 border-t border-white/15 pt-5 text-[11px] text-[#bfb0a4]">
                    <span>© 2026 Serpente Nail Room</span>
                </div>
            </div>
        </footer>
    );
}
