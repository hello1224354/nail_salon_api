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
};

export function CurrentOffers({ offers }: CurrentOffersProps) {
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
        if (!emblaApi) return;
        emblaApi.on("select", syncSelectedIndex);
        emblaApi.on("reInit", syncSelectedIndex);
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const syncMotionPreference = () => {
            if (mediaQuery.matches) {
                autoplay.stop();
            } else {
                autoplay.play();
            }
        };

        syncMotionPreference();
        mediaQuery.addEventListener("change", syncMotionPreference);

        return () => {
            emblaApi.off("select", syncSelectedIndex);
            emblaApi.off("reInit", syncSelectedIndex);
            mediaQuery.removeEventListener("change", syncMotionPreference);
            autoplay.stop();
        };
    }, [autoplay, emblaApi, syncSelectedIndex]);

    if (offers.length === 0) return null;

    return (
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
                                    Ưu đãi hiện tại
                                </p>
                                <h1 className="mt-4 max-w-md font-serif text-[42px] leading-[0.96] tracking-[-0.03em] sm:text-6xl lg:text-[74px]">
                                    Ưu đãi
                                    <br />
                                    hiện tại.
                                </h1>

                                <div className="mt-7 max-w-md">
                                    <h2 className="font-serif text-2xl sm:text-3xl">{offer.name}</h2>
                                    <p className="mt-2 text-sm leading-6 text-muted">{offer.details}</p>
                                    <p className="mt-1 text-xs text-muted">{offer.validDates}</p>
                                </div>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link
                                        href="/book"
                                        className="focus-ring rounded-full bg-ink px-6 py-3 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
                                    >
                                        Đặt lịch ngay
                                    </Link>
                                    <Link
                                        href="/services"
                                        className="focus-ring rounded-full border border-line bg-surface px-6 py-3 text-xs font-semibold text-ink transition-colors hover:border-accent/50"
                                    >
                                        Xem dịch vụ
                                    </Link>
                                </div>

                                <div className="mt-7 flex items-center gap-2" aria-label="Điều khiển băng chuyền ưu đãi">
                                    {offers.map((_, dotIndex) => (
                                        <button
                                            key={dotIndex}
                                            type="button"
                                            aria-label={`Chuyển đến ưu đãi ${dotIndex + 1}`}
                                            aria-current={dotIndex === selectedIndex ? "true" : undefined}
                                            className={`focus-ring rounded-full transition-all ${
                                                dotIndex === selectedIndex
                                                    ? "h-1.5 w-5 bg-accent"
                                                    : "size-1.5 bg-accent/35 hover:bg-accent/60"
                                            }`}
                                            onClick={() => emblaApi?.scrollTo(dotIndex)}
                                        />
                                    ))}
                                    <span className="mx-1 h-4 w-px bg-line" />
                                    <button
                                        type="button"
                                        aria-label="Ưu đãi trước"
                                        className="focus-ring flex size-7 items-center justify-center rounded-full text-muted hover:bg-white/60"
                                        onClick={() => emblaApi?.scrollPrev()}
                                    >
                                        ←
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Ưu đãi tiếp theo"
                                        className="focus-ring flex size-7 items-center justify-center rounded-full text-muted hover:bg-white/60"
                                        onClick={() => emblaApi?.scrollNext()}
                                    >
                                        →
                                    </button>
                                </div>
                            </div>

                            <div className="relative aspect-[1.08/1] overflow-hidden rounded-[20px] bg-transparent lg:aspect-[1.2/1]">
                                <Image
                                    src={offer.image}
                                    alt="Bộ móng tông màu trung tính"
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
    );
}
