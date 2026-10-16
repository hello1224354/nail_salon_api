"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { getInstagramUrl, getMapsSearchUrl, localizeBranchName } from "@/lib/studio-data";
import { useBranch } from "@/components/branch/BranchProvider";

const headingClass = "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bba18e]";
const linkClass = "w-fit max-w-full [overflow-wrap:anywhere] text-white/80 transition-colors hover:text-[#d8c2b5]";
const copyClass = "focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md text-white/65 transition-colors hover:bg-white/10 hover:text-white";

function CopyContactButton({
    copied,
    label,
    onCopy,
}: {
    copied: boolean;
    label: string;
    onCopy: () => void;
}) {
    const description = `${copied ? "Đã sao chép" : "Sao chép"} ${label}`;

    return (
        <button
            type="button"
            className={copyClass}
            aria-label={description}
            title={description}
            onClick={onCopy}
        >
            {copied ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">
                    <path d="m20 6-11 11-5-5" />
                </svg>
            ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">
                    <rect x="8" y="8" width="13" height="13" rx="2" />
                    <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                </svg>
            )}
        </button>
    );
}

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
    const [copiedContacts, setCopiedContacts] = useState<Record<string, boolean>>({});
    const copyResetTimers = useRef<Record<string, number>>({});

    useEffect(() => {
        const timers = copyResetTimers.current;
        return () => {
            Object.values(timers).forEach((timer) => window.clearTimeout(timer));
        };
    }, []);

    const copyContact = async (value: string, key: string) => {
        const copied = await copyContactText(value);
        const previousTimer = copyResetTimers.current[key];
        if (previousTimer !== undefined) {
            window.clearTimeout(previousTimer);
            delete copyResetTimers.current[key];
        }

        setCopiedContacts((previous) => ({ ...previous, [key]: copied }));

        if (copied) {
            copyResetTimers.current[key] = window.setTimeout(() => {
                setCopiedContacts((previous) => ({ ...previous, [key]: false }));
                delete copyResetTimers.current[key];
            }, 2000);
        }
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

    const openPhone = (event: MouseEvent<HTMLAnchorElement>, number: string, key: string) => {
        if (prefersNativeContactApps()) return;
        event.preventDefault();
        void copyContact(number, key);
    };

    if (pathname.startsWith("/admin")) return null;

    const instagramUrl = getInstagramUrl(content?.instagram_handle);
    const contactEmail = content?.contact_email?.trim();

    return (
        <footer className="bg-studio-dark text-white">
            <div className="site-shell py-12 sm:py-14 lg:py-16">
                <div className="mx-auto grid w-full grid-cols-2 gap-x-5 gap-y-10 sm:w-[90%] sm:gap-x-10 sm:gap-y-12 lg:max-w-[78rem] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.75fr)_minmax(0,1.55fr)_minmax(0,0.9fr)] lg:gap-x-10 xl:gap-x-12">
                    <section className="col-span-2 min-w-0 sm:col-span-1">
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                            <Image
                                src="/brand/serpente-logo.svg"
                                alt=""
                                width={36}
                                height={36}
                                className="size-9 shrink-0 object-contain invert sm:size-10 lg:size-11"
                            />
                            <span className="min-w-0 font-serif text-[18px] leading-tight tracking-[-0.025em] text-white sm:text-[19px] lg:text-[18px] xl:text-[21px]">
                                Serpente Nail Room
                            </span>
                        </div>
                    </section>

                    <section className="min-w-0">
                        <h2 className={headingClass}>Khám phá</h2>
                        <nav aria-label="Khám phá" className="mt-5 flex flex-col items-start gap-3 text-sm">
                            <Link className={linkClass} href="/">Trang chủ</Link>
                            <Link className={linkClass} href="/services">Bảng giá</Link>
                            <Link className={linkClass} href="/book">Đặt lịch</Link>
                            <Link className={linkClass} href="/appointments">Lịch của tôi</Link>
                        </nav>
                    </section>

                    <section className="col-span-2 min-w-0 sm:col-span-1">
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

                    <section className="col-start-2 row-start-2 min-w-0 sm:col-start-auto sm:row-start-auto">
                        <h2 className={headingClass}>Kết nối</h2>
                        {contentError && !contentLoading ? (
                            <p role="status" className="mt-2 text-xs text-[#f2bcb2]">{contentError}</p>
                        ) : null}
                        <div className="mt-5 flex flex-col items-start gap-2 text-sm leading-6">
                            {branches.map((branch) => {
                                const phoneHref = branch.phone
                                    ? `tel:${branch.phone.replace(/[^+\d]/g, "")}`
                                    : null;

                                const phoneKey = `phone:${branch.id}`;

                                return branch.phone && phoneHref ? (
                                    <div key={branch.id} className="min-w-0">
                                        {branches.length > 1 ? (
                                            <p className="text-xs text-white/60">{localizeBranchName(branch.name)}</p>
                                        ) : null}
                                        <div className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1">
                                            <a
                                                className={linkClass}
                                                href={phoneHref}
                                                onClick={(event) => openPhone(event, branch.phone!, phoneKey)}
                                            >
                                                Hotline
                                            </a>
                                            <CopyContactButton
                                                copied={Boolean(copiedContacts[phoneKey])}
                                                label={`số điện thoại ${localizeBranchName(branch.name)}`}
                                                onCopy={() => void copyContact(branch.phone!, phoneKey)}
                                            />
                                        </div>
                                    </div>
                                ) : null;
                            })}
                            {contactEmail ? (
                                <div className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1">
                                    <a
                                        className={linkClass}
                                        href={`mailto:${contactEmail}`}
                                        onClick={(event) => openEmail(event, contactEmail)}
                                    >
                                        Email
                                    </a>
                                    <CopyContactButton
                                        copied={Boolean(copiedContacts.email)}
                                        label="địa chỉ email"
                                        onCopy={() => void copyContact(contactEmail, "email")}
                                    />
                                </div>
                            ) : null}
                            {instagramUrl ? (
                                <a className={linkClass} href={instagramUrl} target="_blank" rel="noreferrer">
                                    Instagram
                                </a>
                            ) : null}
                        </div>
                    </section>
                </div>

                <div className="mx-auto mt-12 w-full border-t border-white/15 pt-5 text-[11px] text-[#bfb0a4] sm:w-[90%] lg:max-w-[78rem]">
                    <span>© 2026 Serpente Nail Room</span>
                </div>
            </div>
        </footer>
    );
}
