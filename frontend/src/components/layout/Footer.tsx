"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { getInstagramUrl, getMapsSearchUrl, localizeBranchName } from "@/lib/studio-data";
import { useBranch } from "@/components/branch/BranchProvider";

const headingClass = "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bba18e]";
const linkClass = "w-fit max-w-full [overflow-wrap:anywhere] text-white/80 transition-colors hover:text-[#d8c2b5]";
const copyClass = "focus-ring rounded-sm text-[11px] text-white/55 underline decoration-white/35 underline-offset-4 transition-colors hover:text-white";

// On tablets and phones, use native mail and dial apps rather than a web-only service.
function prefersNativeContactApps() {
    const userAgent = navigator.userAgent;
    return /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(userAgent)
        || (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1)
        || (window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(hover: none)").matches);
}

async function copyContactText(value: string) {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
            return true;
        }
    } catch {
        // Clipboard permission may be unavailable; try the selection fallback.
    }

    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    try {
        input.select();
        return document.execCommand("copy");
    } catch {
        return false;
    } finally {
        input.remove();
    }
}

export function Footer() {
    const pathname = usePathname();
    const { branches, salonContent: content, contentLoading, contentError } = useBranch();
    const [contactFeedback, setContactFeedback] = useState("");

    const copyContact = async (value: string, description: string) => {
        const copied = await copyContactText(value);
        setContactFeedback(copied
            ? `Đã sao chép ${description}.`
            : `Không thể tự sao chép. ${description}: ${value}`);
    };

    const openEmail = (event: MouseEvent<HTMLAnchorElement>, address: string) => {
        if (prefersNativeContactApps()) return;
        event.preventDefault();
        window.open(
            `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(address)}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    const openPhone = (event: MouseEvent<HTMLAnchorElement>, number: string, description: string) => {
        if (prefersNativeContactApps()) return;
        event.preventDefault();
        void copyContact(number, description);
    };

    if (pathname.startsWith("/admin")) return null;

    const instagramUrl = getInstagramUrl(content?.instagram_handle);
    const contactEmail = content?.contact_email?.trim();

    return (
        <footer className="bg-studio-dark text-white">
            <div className="site-shell px-3 py-12 sm:px-0 sm:py-14 lg:py-16">
                <div className="mx-auto grid w-full grid-cols-[repeat(2,fit-content(45%))] justify-between gap-x-6 gap-y-12 sm:w-[85%] sm:gap-x-10 lg:w-[90%] lg:grid-cols-[repeat(4,fit-content(20%))] lg:gap-x-12">
                    <section className="w-full min-w-0">
                        <h2 className={headingClass}>Khám phá</h2>
                        <nav aria-label="Khám phá" className="mt-5 flex flex-col items-start gap-3 text-sm">
                            <Link className={linkClass} href="/">Trang chủ</Link>
                            <Link className={linkClass} href="/services">Bảng giá</Link>
                        </nav>
                    </section>

                    <section className="w-full min-w-0">
                        <h2 className={headingClass}>Lịch hẹn</h2>
                        <nav aria-label="Lịch hẹn" className="mt-5 flex flex-col items-start gap-3 text-sm">
                            <Link className={linkClass} href="/book">Đặt lịch</Link>
                            <Link className={linkClass} href="/appointments">Lịch của tôi</Link>
                        </nav>
                    </section>

                    <section className="w-full min-w-0">
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

                    <section className="w-full min-w-0">
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
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <a
                                                className={linkClass}
                                                href={phoneHref}
                                                onClick={(event) => openPhone(event, branch.phone!, `số điện thoại ${localizeBranchName(branch.name)}`)}
                                            >
                                                Hotline
                                            </a>
                                            <button
                                                type="button"
                                                className={copyClass}
                                                aria-label={`Sao chép số điện thoại ${localizeBranchName(branch.name)}`}
                                                onClick={() => void copyContact(branch.phone!, `số điện thoại ${localizeBranchName(branch.name)}`)}
                                            >
                                                Sao chép
                                            </button>
                                        </div>
                                    </div>
                                ) : null;
                            })}
                            {contactEmail ? (
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <a
                                        className={linkClass}
                                        href={`mailto:${contactEmail}`}
                                        onClick={(event) => openEmail(event, contactEmail)}
                                    >
                                        Email
                                    </a>
                                    <button
                                        type="button"
                                        className={copyClass}
                                        aria-label="Sao chép địa chỉ email"
                                        onClick={() => void copyContact(contactEmail, "địa chỉ email")}
                                    >
                                        Sao chép
                                    </button>
                                </div>
                            ) : null}
                            {instagramUrl ? (
                                <a className={linkClass} href={instagramUrl} target="_blank" rel="noreferrer">
                                    Instagram
                                </a>
                            ) : null}
                        </div>
                        {contactFeedback ? (
                            <p role="status" aria-live="polite" className="mt-3 text-xs text-white/75 [overflow-wrap:anywhere]">
                                {contactFeedback}
                            </p>
                        ) : null}
                    </section>
                </div>

                <div className="mt-12 border-t border-white/15 pt-5 text-[11px] text-[#bfb0a4]">
                    <span>© 2026 Serpente Nail Room</span>
                </div>
            </div>
        </footer>
    );
}
