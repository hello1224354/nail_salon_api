"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export type Offer = {
    name: string;
    details: string;
    validDates: string;
    image: string;
    instagramPostUrl?: string | null;
    branchId: number | null;
};

type CurrentOffersProps = {
    offers: Offer[];
    instagramHandle?: string | null;
};

export function CurrentOffers({ offers, instagramHandle }: CurrentOffersProps) {
    const [autoplay] = useState(() =>
        Autoplay({
            delay: 4800,
            playOnInit: false,
            stopOnInteraction: false,
            stopOnMouseEnter: false,
        })
    );
    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: offers.length > 1,
            align: "start",
        },
        [autoplay]
    );
    const [selectedIndex, setSelectedIndex] = useState(0);

    const syncSelectedIndex = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi || offers.length === 0) return;

        emblaApi.on("select", syncSelectedIndex);
        emblaApi.on("reInit", syncSelectedIndex);

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const syncMotionPreference = () => {
            // Embla does not initialize Autoplay when there is only one scroll snap.
            // Calling play() in that state can throw inside the plugin.
            if (mediaQuery.matches || emblaApi.scrollSnapList().length <= 1) autoplay.stop();
            else autoplay.play();
        };

        syncMotionPreference();
        emblaApi.on("reInit", syncMotionPreference);
        mediaQuery.addEventListener("change", syncMotionPreference);

        return () => {
            emblaApi.off("select", syncSelectedIndex);
            emblaApi.off("reInit", syncSelectedIndex);
            emblaApi.off("reInit", syncMotionPreference);
            mediaQuery.removeEventListener("change", syncMotionPreference);
            autoplay.stop();
        };
    }, [autoplay, emblaApi, offers.length, syncSelectedIndex]);

    if (offers.length === 0) {
        return (
            <section className="overflow-hidden rounded-[28px] border border-line bg-surface">
                <div className="grid min-w-0 gap-[clamp(1.5rem,3vw,2.5rem)] p-[clamp(1.25rem,3vw,3.5rem)] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-center">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                            Ưu đãi
                        </p>
                        <h1 className="mt-4 max-w-xl font-serif text-[clamp(2.3rem,5vw,4.625rem)] leading-[1.2] tracking-[-0.015em]">
                            Ưu đãi mới
                            <br />
                            sẽ có tại đây.
                        </h1>
                        <p className="mt-6 max-w-lg text-sm leading-6 text-muted">
                            Hiện Serpente chưa có chương trình ưu đãi đang áp dụng. Khi có chương trình mới, tiệm sẽ cập nhật ngay trên trang này.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="/services"
                                className="focus-ring rounded-full bg-ink px-6 py-3 text-xs font-semibold text-white"
                            >
                                Xem bảng giá
                            </Link>
                            <Link
                                href="/book"
                                className="focus-ring rounded-full border border-line bg-surface px-6 py-3 text-xs font-semibold text-ink"
                            >
                                Đặt lịch
                            </Link>
                        </div>
                    </div>

                    <div className="relative min-w-0 rounded-[24px] bg-tint p-[clamp(1.25rem,3vw,2.5rem)]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Sắp ra mắt</p>
                        <p className="fluid-card-title mt-4 font-serif">Chương trình dành riêng cho khách của Serpente.</p>
                        <div className="mt-12 h-px bg-accent/20" />
                        <p className="mt-5 text-xs leading-5 text-muted">
                            {instagramHandle
                                ? `Theo dõi @${instagramHandle.replace(/^@/, "")} để xem mẫu móng và thông báo mới từ tiệm.`
                                : "Mẫu móng và thông báo mới sẽ được cập nhật trên các kênh chính thức của tiệm."}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div className="relative">
            <section
                aria-label="Các chương trình ưu đãi đang áp dụng"
            className="overflow-hidden rounded-[24px] border border-[#d9c8bc] bg-[#e9ddd2] shadow-[0_18px_55px_rgba(48,40,35,0.09)] sm:rounded-[28px]"
        >
            <div ref={emblaRef} className="overflow-hidden">
                <div className="flex">
                    {offers.map((offer, index) => (
                        <article
                            key={`${offer.name}-${index}`}
                            className="min-w-0 flex-[0_0_100%]"
                            aria-label={`Ưu đãi ${index + 1} trên ${offers.length}`}
                        >
                            <div className="grid min-w-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                                <div className="relative isolate order-2 flex min-w-0 flex-col overflow-hidden bg-[linear-gradient(145deg,#eddfd3_0%,#e7d6c8_100%)] px-7 pb-9 pt-9 sm:px-10 sm:pb-10 sm:pt-10 lg:order-1 lg:min-h-[30rem] lg:px-[clamp(2.5rem,4.3vw,5.25rem)] lg:py-12">
                                    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[#aa806d]/70" />

                                    <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                                        <div className="flex items-center gap-3">
                                            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[#946e59]" />
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#795949] sm:text-[11px]">
                                                Ưu đãi đang được áp dụng
                                            </p>
                                        </div>

                                        <div className="flex flex-1 flex-col justify-start pb-8 pt-7 sm:pt-8 lg:pb-10 lg:pt-8">
                                            <div className="w-full max-w-[16ch] font-serif text-[clamp(2.75rem,4.4vw,4.75rem)]">
                                                <h1 className="font-medium leading-[1.2] tracking-[-0.015em] text-[#302823] [overflow-wrap:anywhere]">
                                                    {offer.name}
                                                </h1>
                                                <p className="mt-6 whitespace-pre-line border-l-2 border-[#ba9882] pl-4 font-sans text-sm leading-7 text-[#55473f] [overflow-wrap:anywhere] sm:text-[15px]">
                                                    {offer.details}
                                                </p>
                                            </div>
                                            {offer.instagramPostUrl?.startsWith("https://www.instagram.com/") ? (
                                                <a
                                                    href={offer.instagramPostUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="focus-ring mt-6 inline-flex w-fit items-center gap-2.5 border-b border-[#96705d] pb-1.5 text-sm font-semibold text-[#49372c] transition-colors hover:border-[#2f2621] hover:text-[#2f2621]"
                                                    aria-label={`Xem chi tiết ưu đãi ${offer.name} trên Instagram (mở tab mới)`}
                                                >
                                                    <span>Xem chi tiết ưu đãi</span>
                                                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
                                                        <path d="M7 17 17 7M8 7h9v9" />
                                                    </svg>
                                                </a>
                                            ) : null}
                                        </div>

                                        <div className="flex items-start gap-3 border-t border-[#c6ae9d]/80 pt-5">
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#b99b88] text-[#745a4b]">
                                                <svg
                                                    aria-hidden="true"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="size-[19px]"
                                                >
                                                    <rect x="3" y="5" width="18" height="16" rx="2" />
                                                    <path d="M7 3v4M17 3v4M3 10h18" />
                                                </svg>
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#856451]">
                                                    Thời gian áp dụng
                                                </p>
                                                <p className="mt-1 text-[13px] leading-6 text-[#55473f] sm:text-sm">
                                                    {offer.validDates}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative order-1 min-h-[19rem] bg-[#d9c5ba] sm:min-h-[24rem] lg:order-2 lg:min-h-[30rem]">
                                    <Image
                                        src={offer.image}
                                        alt={offer.name}
                                        fill
                                        priority={index === 0}
                                        sizes="(max-width: 1023px) 100vw, 54vw"
                                        className="motion-image object-cover"
                                    />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
            </section>

            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                    <Link
                        href="/book"
                        className="focus-ring inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#302823] px-9 py-4 text-[15px] font-semibold text-white shadow-[0_7px_18px_rgba(48,40,35,0.12)] transition-colors hover:bg-[#51423a] sm:min-h-[60px] sm:w-auto sm:min-w-[185px]"
                    >
                        Đặt lịch
                    </Link>
                    <Link
                        href="/services"
                        className="focus-ring inline-flex min-h-14 w-full items-center justify-center rounded-full border border-[#aa8977] bg-transparent px-9 py-4 text-[15px] font-semibold text-[#302823] transition-colors hover:bg-[#efe4dc] sm:min-h-[60px] sm:w-auto sm:min-w-[185px]"
                    >
                        Xem bảng giá
                    </Link>
                </div>

                {offers.length > 1 ? (
                    <div className="flex items-center justify-center gap-2.5 sm:justify-end" aria-label="Chọn ưu đãi">
                        {offers.map((_, dotIndex) => (
                            <button
                                key={dotIndex}
                                type="button"
                                aria-label={`Xem ưu đãi ${dotIndex + 1}`}
                                aria-current={dotIndex === selectedIndex ? "true" : undefined}
                                className={`focus-ring rounded-full transition-all duration-300 ${
                                    dotIndex === selectedIndex
                                        ? "h-2 w-7 bg-accent"
                                        : "size-2 bg-accent/30 hover:bg-accent/60"
                                }`}
                                onClick={() => emblaApi?.scrollTo(dotIndex)}
                            />
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
