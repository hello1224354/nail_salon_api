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
                        <h1 className="mt-4 max-w-xl font-serif text-[clamp(2.3rem,5vw,4.625rem)] leading-[1.03] tracking-[-0.035em]">
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
                                <div className="order-2 flex min-w-0 flex-col justify-center bg-[#e9ddd2] px-6 py-9 sm:px-10 sm:py-12 lg:order-1 lg:min-h-[32rem] lg:px-[clamp(2.5rem,4.3vw,5.25rem)] lg:py-14">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#856451] sm:text-[11px]">
                                        Serpente <span aria-hidden="true" className="mx-2 text-[#b29480]">—</span> Ưu đãi
                                    </p>

                                    <h1 className="mt-7 max-w-[16ch] font-serif text-[clamp(2.25rem,4vw,3.8rem)] font-medium leading-[1.1] tracking-[-0.045em] text-[#302823] [overflow-wrap:anywhere]">
                                        {offer.name}
                                    </h1>

                                    <div aria-hidden="true" className="mt-7 h-px w-16 bg-[#ab8974]" />
                                    <p className="mt-6 max-w-[42ch] whitespace-pre-line text-sm leading-7 text-[#55473f] sm:text-[15px]">
                                        {offer.details}
                                    </p>

                                    <div className="mt-7 flex items-start gap-2.5 text-xs leading-5 text-[#765e50] sm:text-[13px]">
                                        <svg
                                            aria-hidden="true"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="mt-0.5 size-[16px] shrink-0"
                                        >
                                            <rect x="3" y="5" width="18" height="16" rx="2" />
                                            <path d="M7 3v4M17 3v4M3 10h18" />
                                        </svg>
                                        <span>{offer.validDates}</span>
                                    </div>

                                    <div className="mt-9 flex flex-wrap items-center gap-3">
                                        <Link
                                            href="/book"
                                            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-[#302823] px-6 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#51423a]"
                                        >
                                            Đặt lịch
                                        </Link>
                                        <Link
                                            href="/services"
                                            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-[#bea797] bg-white/25 px-6 py-3 text-xs font-semibold text-[#302823] transition-colors hover:bg-white/55"
                                        >
                                            Xem bảng giá
                                        </Link>
                                    </div>

                                    {offers.length > 1 ? (
                                        <div className="mt-10 flex items-center gap-4" aria-label="Chọn ưu đãi">
                                            <span aria-hidden="true" className="text-[11px] font-medium tabular-nums text-[#765e50]">
                                                {String(selectedIndex + 1).padStart(2, "0")} / {String(offers.length).padStart(2, "0")}
                                            </span>
                                            <div className="flex items-center gap-2.5">
                                                {offers.map((_, dotIndex) => (
                                                    <button
                                                        key={dotIndex}
                                                        type="button"
                                                        aria-label={`Xem ưu đãi ${dotIndex + 1}`}
                                                        aria-current={dotIndex === selectedIndex ? "true" : undefined}
                                                        className={`focus-ring rounded-full transition-all ${
                                                            dotIndex === selectedIndex
                                                                ? "h-1.5 w-8 bg-[#795847]"
                                                                : "size-1.5 bg-[#bda597] hover:bg-[#92705b]"
                                                        }`}
                                                        onClick={() => emblaApi?.scrollTo(dotIndex)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="relative order-1 min-h-[19rem] bg-[#d9c5ba] sm:min-h-[24rem] lg:order-2 lg:min-h-[32rem]">
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
    );
}
