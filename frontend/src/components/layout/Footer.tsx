"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { getMapsSearchUrl, localizeBranchName } from "@/lib/studio-data";
import { useBranch } from "@/components/branch/BranchProvider";

const headingClass = "text-[12px] font-semibold uppercase tracking-[0.16em] text-[#c9aa94]";
const linkClass = "w-fit max-w-full text-[14px] text-white/85 transition-colors hover:text-white hover:underline hover:underline-offset-4";
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

type FooterDetailIconName = "pin" | "clock" | "phone" | "mail" | "instagram" | "arrow";

function FooterDetailIcon({ name, className = "size-[18px]" }: { name: FooterDetailIconName; className?: string }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {name === "pin" ? (
                <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.7" /></>
            ) : name === "clock" ? (
                <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>
            ) : name === "phone" ? (
                <path d="M22 16.8v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.8L7.3 10a16 16 0 0 0 6.7 6.7l1.7-1.7a2 2 0 0 1 1.8-.6l2.8.5a2 2 0 0 1 1.7 1.9Z" />
            ) : name === "mail" ? (
                <><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="m3.5 6 8.5 7 8.5-7" /></>
            ) : name === "instagram" ? (
                <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>
            ) : (
                <><path d="M7 17 17 7M8 7h9v9" /></>
            )}
        </svg>
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

    const instagramHandle = content?.instagram_handle?.replace(/^@/, "").trim();
    const instagramMessageUrl = instagramHandle
        ? `https://ig.me/m/${encodeURIComponent(instagramHandle)}`
        : null;
    const contactEmail = content?.contact_email?.trim();

    return (
        <footer className="bg-studio-dark text-white">
            <div className="site-shell py-12 sm:py-14 lg:py-16">
                <div className="mx-auto grid w-full max-w-[84rem] grid-cols-1 gap-x-10 gap-y-11 md:grid-cols-2 md:gap-x-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.65fr)_minmax(0,1fr)] lg:gap-x-16 xl:gap-x-20">
                    <section className="min-w-0 md:col-span-2 lg:col-span-1" aria-label="Thông tin tiệm">
                        <Link href="/" aria-label="Serpente Nail Room — về trang chủ" className="focus-ring inline-flex max-w-full items-center gap-3">
                            <Image
                                src="/brand/serpente-logo.svg"
                                alt=""
                                width={44}
                                height={44}
                                className="size-10 shrink-0 object-contain sm:size-11"
                            />
                            <span className="min-w-0 font-serif text-xl leading-tight tracking-[-0.025em] text-white sm:text-[23px]">
                                Serpente Nail Room
                            </span>
                        </Link>

                        <div className="mt-6 space-y-5">
                            {branches.map((branch) => {
                                const mapsUrl = branch.address ? getMapsSearchUrl(branch.address) : null;
                                const phoneHref = branch.phone
                                    ? `tel:${branch.phone.replace(/[^+\d]/g, "")}`
                                    : null;
                                const phoneKey = `phone:${branch.id}`;

                                return (
                                    <div key={branch.id} className="min-w-0 space-y-3.5 text-sm leading-6">
                                        {branch.address ? (
                                            <div className="flex min-w-0 items-start gap-3">
                                                <FooterDetailIcon name="pin" className="mt-1 size-4 shrink-0 text-[#c4a994]" />
                                                {mapsUrl ? (
                                                    <a
                                                        href={mapsUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="min-w-0 text-white/80 transition-colors hover:text-white hover:underline hover:underline-offset-4 [overflow-wrap:anywhere]"
                                                    >
                                                        {branch.address}
                                                    </a>
                                                ) : (
                                                    <p className="min-w-0 text-white/80 [overflow-wrap:anywhere]">{branch.address}</p>
                                                )}
                                            </div>
                                        ) : null}

                                        {branch.opening_hours ? (
                                            <div className="flex min-w-0 items-start gap-3">
                                                <FooterDetailIcon name="clock" className="mt-1 size-4 shrink-0 text-[#c4a994]" />
                                                <span className="text-white/80">{branch.opening_hours}</span>
                                            </div>
                                        ) : null}

                                        {branch.phone && phoneHref ? (
                                            <div className="flex min-w-0 items-center gap-2 text-white/80">
                                                <FooterDetailIcon name="phone" className="size-4 shrink-0 text-[#c4a994]" />
                                                <a
                                                    href={phoneHref}
                                                    onClick={(event) => openPhone(event, branch.phone!, phoneKey)}
                                                    className="min-w-0 [overflow-wrap:anywhere] transition-colors hover:text-white"
                                                >
                                                    {branch.phone}
                                                </a>
                                                <CopyContactButton
                                                    copied={Boolean(copiedContacts[phoneKey])}
                                                    label={`số điện thoại ${localizeBranchName(branch.name)}`}
                                                    onCopy={() => void copyContact(branch.phone!, phoneKey)}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}

                            {contactEmail ? (
                                <div className="flex min-w-0 items-center gap-2 text-sm text-white/80">
                                    <FooterDetailIcon name="mail" className="size-4 shrink-0 text-[#c4a994]" />
                                    <a
                                        href={`mailto:${contactEmail}`}
                                        onClick={(event) => openEmail(event, contactEmail)}
                                        className="min-w-0 [overflow-wrap:anywhere] transition-colors hover:text-white"
                                    >
                                        {contactEmail}
                                    </a>
                                    <CopyContactButton
                                        copied={Boolean(copiedContacts.email)}
                                        label="địa chỉ email"
                                        onCopy={() => void copyContact(contactEmail, "email")}
                                    />
                                </div>
                            ) : null}

                            {contentError && !contentLoading ? (
                                <p role="status" className="text-xs text-[#f2bcb2]">{contentError}</p>
                            ) : null}
                        </div>
                    </section>

                    <nav aria-label="Truy cập nhanh" className="min-w-0">
                        <h2 className={headingClass}>Truy cập nhanh</h2>
                        <div className="mt-6 flex flex-col items-start gap-4">
                            <Link className={linkClass} href="/services">Bảng giá dịch vụ</Link>
                            <Link className={linkClass} href="/book">Đặt lịch hẹn</Link>
                            <Link className={linkClass} href="/appointments">Lịch của tôi</Link>
                        </div>
                    </nav>

                    <section className="min-w-0">
                        <h2 className={headingClass}>Tư vấn &amp; báo giá</h2>
                        <p className="mt-6 max-w-[22rem] text-sm leading-7 text-white/80">
                            Giá dịch vụ trên website chỉ mang tính chất tham khảo và có thể thay đổi tùy theo mẫu móng.
                        </p>
                        {instagramMessageUrl ? (
                            <a
                                href={instagramMessageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="focus-ring mt-5 inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-md border border-[#b9957c] bg-[#986a58]/25 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:border-[#ddc2b0] hover:bg-[#986a58]/45"
                            >
                                <FooterDetailIcon name="instagram" className="size-[19px] shrink-0" />
                                <span>Gửi mẫu nail để được tư vấn</span>
                                <FooterDetailIcon name="arrow" className="size-4 shrink-0" />
                            </a>
                        ) : null}
                    </section>
                </div>

                <div className="mx-auto mt-12 w-full max-w-[84rem] border-t border-white/15 pt-5 text-[11px] text-[#c4b5aa]">
                    <span>© 2026 Serpente Nail Room</span>
                </div>
            </div>
        </footer>
    );
}
