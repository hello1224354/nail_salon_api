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
            playOnInit: true,
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
            if (mediaQuery.matches) autoplay.stop();
            else autoplay.play();
        };

        syncMotionPreference();
        mediaQuery.addEventListener("change", syncMotionPreference);

        return () => {
            emblaApi.off("select", syncSelectedIndex);
            emblaApi.off("reInit", syncSelectedIndex);
            mediaQuery.removeEventListener("change", syncMotionPreference);
            autoplay.stop();
        };
    }, [autoplay, emblaApi, offers.length, syncSelectedIndex]);

    if (offers.length === 0) {
        return (
            <section className="overflow-hidden rounded-[28px] border border-line bg-surface">
                <div className="grid min-h-[420px] gap-10 p-7 sm:p-10 lg:grid-cols-[1fr_0.72fr] lg:items-center lg:p-14">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                            Ưu đãi
                        </p>
                        <h1 className="mt-4 max-w-xl font-serif text-[46px] leading-[0.96] tracking-[-0.035em] sm:text-6xl lg:text-[74px]">
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

                    <div className="relative overflow-hidden rounded-[24px] bg-tint p-8 sm:p-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Sắp ra mắt</p>
                        <p className="mt-4 font-serif text-4xl leading-tight">Chương trình dành riêng cho khách của Serpente.</p>
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
            <div ref={emblaRef} className="overflow-hidden bg-transparent">
                <div className="flex">
                {offers.map((offer, index) => (
                    <article
                        key={`${offer.name}-${index}`}
                        className="min-w-0 flex-[0_0_100%]"
                        aria-label={`Ưu đãi ${index + 1} trên ${offers.length}`}
                    >
                        <div className="grid gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
                            <div className="py-2 lg:py-10">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                                    Đang áp dụng
                                </p>
                                <h1 className="mt-4 max-w-md font-serif text-[42px] leading-[0.96] tracking-[-0.03em] sm:text-6xl lg:text-[74px]">
                                    Ưu đãi
                                    <br />
                                    tại Serpente.
                                </h1>

                                <div className="mt-7 max-w-md">
                                    <h2 className="font-serif text-2xl sm:text-3xl">{offer.name}</h2>
                                    <p className="mt-2 text-sm leading-6 text-muted">{offer.details}</p>
                                    <p className="mt-2 text-xs text-muted">{offer.validDates}</p>
                                </div>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link href="/book" className="focus-ring rounded-full bg-ink px-6 py-3 text-xs font-semibold text-white">
                                        Đặt lịch
                                    </Link>
                                    <Link href="/services" className="focus-ring rounded-full border border-line bg-surface px-6 py-3 text-xs font-semibold text-ink">
                                        Xem bảng giá
                                    </Link>
                                </div>

                                {offers.length > 1 ? (
                                    <div className="mt-7 flex items-center gap-2" aria-label="Chọn ưu đãi">
                                        {offers.map((_, dotIndex) => (
                                            <button
                                                key={dotIndex}
                                                type="button"
                                                aria-label={`Xem ưu đãi ${dotIndex + 1}`}
                                                aria-current={dotIndex === selectedIndex ? "true" : undefined}
                                                className={`focus-ring rounded-full transition-all ${
                                                    dotIndex === selectedIndex
                                                        ? "h-1.5 w-5 bg-accent"
                                                        : "size-1.5 bg-accent/35 hover:bg-accent/60"
                                                }`}
                                                onClick={() => emblaApi?.scrollTo(dotIndex)}
                                            />
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            <div className="relative aspect-[1.08/1] overflow-hidden rounded-[20px] bg-tint lg:aspect-[1.2/1]">
                                <Image
                                    src={offer.image}
                                    alt={offer.name}
                                    fill
                                    priority={index === 0}
                                    sizes="(max-width: 1024px) 100vw, 58vw"
                                    className="motion-image object-cover"
                                />
                            </div>
                        </div>
                    </article>
                ))}
                </div>
            </div>

            {offers.length > 1 ? (
                <div className="pointer-events-none absolute inset-x-2 top-1/2 z-20 flex -translate-y-1/2 items-center justify-between sm:inset-x-3">
                    <button
                        type="button"
                        aria-label="Ưu đãi trước"
                        className="focus-ring pointer-events-auto flex size-11 items-center justify-center rounded-full border border-line bg-surface/95 font-semibold text-ink shadow-[0_10px_30px_rgba(48,40,35,0.12)] backdrop-blur-sm transition hover:bg-tint"
                        onClick={() => emblaApi?.scrollPrev()}
                    >
                        <span aria-hidden="true" className="text-[28px] leading-none">←</span>
                    </button>
                    <button
                        type="button"
                        aria-label="Ưu đãi tiếp theo"
                        className="focus-ring pointer-events-auto flex size-11 items-center justify-center rounded-full border border-line bg-surface/95 font-semibold text-ink shadow-[0_10px_30px_rgba(48,40,35,0.12)] backdrop-blur-sm transition hover:bg-tint"
                        onClick={() => emblaApi?.scrollNext()}
                    >
                        <span aria-hidden="true" className="text-[28px] leading-none">→</span>
                    </button>
                </div>
            ) : null}
        </div>
    );
}
