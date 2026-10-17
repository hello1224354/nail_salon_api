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
        <div className="relative">
            <div ref={emblaRef} className="overflow-hidden bg-transparent">
                <div className="flex">
                {offers.map((offer, index) => (
                    <article
                        key={`${offer.name}-${index}`}
                        className="min-w-0 flex-[0_0_100%]"
                        aria-label={`Ưu đãi ${index + 1} trên ${offers.length}`}
                    >
                        <div className="grid min-w-0 gap-[clamp(1.25rem,3vw,3rem)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
                            <div className="py-2 lg:py-10">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                                    Đang áp dụng
                                </p>
                                <h1 className="mt-4 max-w-md font-serif text-[clamp(2.25rem,5vw,4.625rem)] leading-[1.03] tracking-[-0.03em]">
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
                                    <div className="mt-7 flex items-center gap-2.5" aria-label="Chọn ưu đãi">
                                        {offers.map((_, dotIndex) => (
                                            <button
                                                key={dotIndex}
                                                type="button"
                                                aria-label={`Xem ưu đãi ${dotIndex + 1}`}
                                                aria-current={dotIndex === selectedIndex ? "true" : undefined}
                                                className={`focus-ring rounded-full transition-all ${
                                                    dotIndex === selectedIndex
                                                        ? "h-2 w-7 bg-accent"
                                                        : "size-2 bg-accent/35 hover:bg-accent/60"
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

        </div>
    );
}
