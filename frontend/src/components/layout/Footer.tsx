"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { getInstagramUrl, getMapsSearchUrl, localizeBranchName } from "@/lib/studio-data";
import { useBranch } from "@/components/branch/BranchProvider";

const footerLinkClass = "w-fit text-[14px] leading-6 text-white/90 transition-colors hover:text-white hover:underline hover:underline-offset-4";
const footerInfoLinkClass = "text-white/90 underline-offset-4 transition-colors hover:text-white hover:underline";
const copyClass = "focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-white/25 text-white/90 transition-colors hover:bg-white/15";

type FooterIconName = "pin" | "phone" | "mail" | "globe" | "clock" | "instagram" | "map" | "send";

function FooterIcon({ name, className = "size-[18px]" }: { name: FooterIconName; className?: string }) {
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
            ) : name === "phone" ? (
                <path d="M22 16.8v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.8L7.3 10a16 16 0 0 0 6.7 6.7l1.7-1.7a2 2 0 0 1 1.8-.6l2.8.5a2 2 0 0 1 1.7 1.9Z" />
            ) : name === "mail" ? (
                <><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="m3.5 6 8.5 7 8.5-7" /></>
            ) : name === "globe" ? (
                <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c5 5 5 13 0 18M12 3c-5 5-5 13 0 18" /></>
            ) : name === "clock" ? (
                <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>
            ) : name === "instagram" ? (
                <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>
            ) : name === "map" ? (
                <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15M15 6v15" /></>
            ) : (
                <><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></>
            )}
        </svg>
    );
}

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

    const primaryPhoneBranch = branches.find((branch) => Boolean(branch.phone));
    const primaryMapsBranch = branches.find((branch) => Boolean(branch.address));
    const primaryPhoneHref = primaryPhoneBranch?.phone
        ? "tel:" + primaryPhoneBranch.phone.replace(/[^+\d]/g, "")
        : null;
    const primaryMapsUrl = primaryMapsBranch ? getMapsSearchUrl(primaryMapsBranch.address) : null;

    return (
        <footer className="bg-[#f6f3ee] px-2 py-5 text-white sm:px-4 sm:py-8 lg:px-6">
            <div className="relative mx-auto w-full max-w-[116rem] overflow-hidden rounded-[26px] bg-[linear-gradient(120deg,#119f9b_0%,#0ba7a2_48%,#079894_100%)] shadow-[0_18px_46px_rgba(22,67,64,0.14)] sm:rounded-[38px]">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 1440 440"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 size-full opacity-[0.13]"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                >
                    <path d="M225-90C695 30 864 375 1560 85" />
                    <path d="M385-105C895 75 1085 350 1520-5" />
                    <path d="M745-80C1210 160 1285 265 1565 105" />
                    <path d="M1080-90C1310 110 1400 170 1570 200" />
                </svg>

                <div className="relative z-10 mx-auto max-w-[116rem] px-6 pb-12 pt-11 sm:px-9 sm:pb-14 sm:pt-12 lg:px-12 lg:py-14 2xl:px-16">
                    <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 sm:gap-x-12 xl:grid-cols-[minmax(0,3fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.75fr)] xl:gap-x-11">
                        <section className="min-w-0 sm:col-span-2 xl:col-span-1" aria-label="Thông tin Serpente Nail Room">
                            <div className="flex min-w-0 items-center gap-3">
                                <Image
                                    src="/brand/serpente-logo.svg"
                                    alt=""
                                    width={44}
                                    height={44}
                                    className="size-10 shrink-0 object-contain invert sm:size-11"
                                />
                                <h2 className="min-w-0 font-serif text-xl font-semibold tracking-[-0.015em] text-white sm:text-[23px]">
                                    Serpente Nail Room
                                </h2>
                            </div>

                            <div className="mt-5 space-y-4 text-sm leading-6">
                                {branches.map((branch) => {
                                    const mapsUrl = branch.address ? getMapsSearchUrl(branch.address) : null;
                                    const phoneHref = branch.phone
                                        ? "tel:" + branch.phone.replace(/[^+\d]/g, "")
                                        : null;
                                    const phoneKey = "phone:" + branch.id;

                                    return (
                                        <div key={branch.id} className="min-w-0 space-y-2.5">
                                            {branches.length > 1 ? (
                                                <p className="font-semibold text-white">{localizeBranchName(branch.name)}</p>
                                            ) : null}
                                            {branch.address ? (
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <FooterIcon name="pin" className="mt-1 size-4 shrink-0" />
                                                    {mapsUrl ? (
                                                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={footerInfoLinkClass + " min-w-0 [overflow-wrap:anywhere]"}>
                                                            <span className="font-medium">Địa chỉ:</span> {branch.address}
                                                        </a>
                                                    ) : (
                                                        <span className="min-w-0 text-white/90 [overflow-wrap:anywhere]">
                                                            <span className="font-medium">Địa chỉ:</span> {branch.address}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : null}
                                            {branch.phone && phoneHref ? (
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <FooterIcon name="phone" className="size-4 shrink-0" />
                                                    <a href={phoneHref} onClick={(event) => openPhone(event, branch.phone!, phoneKey)} className={footerInfoLinkClass + " min-w-0 [overflow-wrap:anywhere]"}>
                                                        <span className="font-medium">Điện thoại:</span> {branch.phone}
                                                    </a>
                                                    <CopyContactButton
                                                        copied={Boolean(copiedContacts[phoneKey])}
                                                        label={"số điện thoại " + localizeBranchName(branch.name)}
                                                        onCopy={() => void copyContact(branch.phone!, phoneKey)}
                                                    />
                                                </div>
                                            ) : null}
                                            {branch.opening_hours ? (
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <FooterIcon name="clock" className="mt-1 size-4 shrink-0" />
                                                    <span className="text-white/90"><span className="font-medium">Mở cửa:</span> {branch.opening_hours}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}

                                {contactEmail ? (
                                    <div className="flex min-w-0 items-center gap-3">
                                        <FooterIcon name="mail" className="size-4 shrink-0" />
                                        <a
                                            className={footerInfoLinkClass + " min-w-0 [overflow-wrap:anywhere]"}
                                            href={"mailto:" + contactEmail}
                                            onClick={(event) => openEmail(event, contactEmail)}
                                        >
                                            <span className="font-medium">E-mail:</span> {contactEmail}
                                        </a>
                                        <CopyContactButton
                                            copied={Boolean(copiedContacts.email)}
                                            label="địa chỉ email"
                                            onCopy={() => void copyContact(contactEmail, "email")}
                                        />
                                    </div>
                                ) : null}

                                <div className="flex min-w-0 items-center gap-3">
                                    <FooterIcon name="globe" className="size-4 shrink-0" />
                                    <a href="/" className={footerInfoLinkClass + " [overflow-wrap:anywhere]"}>
                                        serpentenailroom.site
                                    </a>
                                </div>
                                {contentError && !contentLoading ? (
                                    <p role="status" className="text-sm text-white">{contentError}</p>
                                ) : null}
                            </div>

                            <div className="mt-7 flex flex-wrap items-center gap-2.5">
                                {instagramUrl ? (
                                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-white/60 bg-white/10 px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/20">
                                        <FooterIcon name="send" className="size-4" />
                                        Gửi yêu cầu liên hệ
                                    </a>
                                ) : null}
                                {primaryMapsUrl ? (
                                    <a href={primaryMapsUrl} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-white/60 bg-white/10 px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/20">
                                        <FooterIcon name="map" className="size-4" />
                                        Bản đồ chỉ đường
                                    </a>
                                ) : null}
                            </div>
                        </section>

                        <nav aria-label="Khám phá" className="min-w-0 xl:pt-12">
                            <div className="flex flex-col items-start gap-3.5">
                                <Link className={footerLinkClass} href="/">Trang chủ</Link>
                                <Link className={footerLinkClass} href="/services">Bảng giá</Link>
                                <Link className={footerLinkClass} href="/book">Đặt lịch</Link>
                                <Link className={footerLinkClass} href="/appointments">Lịch của tôi</Link>
                            </div>
                        </nav>

                        <nav aria-label="Liên kết hữu ích" className="min-w-0 xl:pt-12">
                            <div className="flex flex-col items-start gap-3.5">
                                <a href="#footer-contact" className={footerLinkClass}>Liên hệ</a>
                                {branches.map((branch) => {
                                    const mapsUrl = branch.address ? getMapsSearchUrl(branch.address) : null;
                                    return mapsUrl ? (
                                        <a
                                            key={branch.id}
                                            href={mapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={footerLinkClass}
                                        >
                                            {localizeBranchName(branch.name)}
                                        </a>
                                    ) : null;
                                })}
                                {contactEmail ? (
                                    <a href={"mailto:" + contactEmail} onClick={(event) => openEmail(event, contactEmail)} className={footerLinkClass}>
                                        Email
                                    </a>
                                ) : null}
                                {primaryPhoneBranch?.phone && primaryPhoneHref ? (
                                    <a href={primaryPhoneHref} onClick={(event) => openPhone(event, primaryPhoneBranch.phone!, "phone:" + primaryPhoneBranch.id)} className={footerLinkClass}>
                                        Hotline
                                    </a>
                                ) : null}
                                {instagramUrl ? (
                                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                                        Instagram
                                    </a>
                                ) : null}
                            </div>
                        </nav>

                        <section id="footer-contact" aria-label="Kết nối với chúng tôi" className="min-w-0 sm:col-span-2 xl:col-span-1 xl:pt-12">
                            <h3 className="whitespace-normal text-[14px] font-semibold text-white">Kết nối với chúng tôi</h3>
                            <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                {instagramUrl ? (
                                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram" className="focus-ring inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-white/30 text-white transition-colors hover:bg-white/15">
                                        <FooterIcon name="instagram" className="size-[22px]" />
                                    </a>
                                ) : null}
                                {contactEmail ? (
                                    <a href={"mailto:" + contactEmail} onClick={(event) => openEmail(event, contactEmail)} aria-label="Email" title="Email" className="focus-ring inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-white/30 text-white transition-colors hover:bg-white/15">
                                        <FooterIcon name="mail" className="size-[22px]" />
                                    </a>
                                ) : null}
                                {primaryPhoneBranch?.phone && primaryPhoneHref ? (
                                    <a href={primaryPhoneHref} onClick={(event) => openPhone(event, primaryPhoneBranch.phone!, "phone:" + primaryPhoneBranch.id)} aria-label="Hotline" title="Hotline" className="focus-ring inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-white/30 text-white transition-colors hover:bg-white/15">
                                        <FooterIcon name="phone" className="size-[22px]" />
                                    </a>
                                ) : null}
                                {primaryMapsUrl ? (
                                    <a href={primaryMapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Bản đồ chỉ đường" title="Bản đồ chỉ đường" className="focus-ring inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-white/30 text-white transition-colors hover:bg-white/15">
                                        <FooterIcon name="map" className="size-[22px]" />
                                    </a>
                                ) : null}
                            </div>
                        </section>
                    </div>
                </div>

                <div className="pointer-events-none absolute -bottom-12 -left-10 size-28 rounded-full bg-[#df9e7c]/85" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-9 -left-12 size-24 rounded-full bg-[#58a878]/95" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-12 -right-10 size-28 rounded-full bg-[#df9e7c]/85" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-9 -right-12 size-24 rounded-full bg-[#58a878]/95" aria-hidden="true" />
                <div className="relative z-10 border-t border-white/10 bg-[#078b88]/90 px-6 py-4 text-[12px] text-white/85 sm:px-10 lg:px-16 lg:py-[18px]">
                    <div className="mx-auto w-full max-w-[116rem] pl-12 sm:pl-14 lg:pl-20">
                        © 2026 Serpente Nail Room
                    </div>
                </div>
            </div>
        </footer>
    );
}
