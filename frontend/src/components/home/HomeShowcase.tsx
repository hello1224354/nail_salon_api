"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { CustomerReview, SalonContent } from "@/lib/api";
import { getInstagramUrl, getMapsSearchUrl } from "@/lib/studio-data";

const MOBILE_QUERY = "(max-width: 767px)";

const HOT_TREND_IMAGES = [
    "https://drive.google.com/thumbnail?id=1DtS5RGDSSeLd0J9KYaZk4PA5je8cj8UX&sz=w1600",
    "https://drive.google.com/thumbnail?id=1dwTteuoTGfVvijHDYS8C1E4Ko2ZjYfMc&sz=w1600",
    "https://drive.google.com/thumbnail?id=1pg5xQFyq5Yx4jjqDuDcvAIBBM3iC4W6g&sz=w1600",
    "https://drive.google.com/thumbnail?id=1a2H_0PJmRFW2G0dA-pT_A-YCN4-u0Fxh&sz=w1600",
    "https://drive.google.com/thumbnail?id=15c9T9QBS-MO1EZ5AL4oV2sJDB-F6IyIn&sz=w1600",
    "https://drive.google.com/thumbnail?id=1EJKxKhza6gfg5OZkkt_cKqbyy3dPhVPv&sz=w1600",
    "https://drive.google.com/thumbnail?id=1jQn9zhQrVXYBzNKcxEjwZiHrC4kgklIC&sz=w1600",
    "https://drive.google.com/thumbnail?id=1HHeURR4Vfuxg-4b3yBcuSF2nY3bP05Zh&sz=w1600",
] as const;

function useIsMobile() {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_QUERY);
        const sync = () => setIsMobile(mediaQuery.matches);

        sync();
        mediaQuery.addEventListener("change", sync);

        return () => mediaQuery.removeEventListener("change", sync);
    }, []);

    return isMobile;
}

function useAutoCarousel(itemCount: number, delay: number) {
    const [autoplay] = useState(() =>
        Autoplay({
            delay,
            playOnInit: itemCount > 1,
            stopOnInteraction: false,
            stopOnMouseEnter: false,
        })
    );

    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: itemCount > 1,
            align: "start",
            containScroll: false,
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

        syncSelectedIndex();
        emblaApi.on("select", syncSelectedIndex);
        emblaApi.on("reInit", syncSelectedIndex);

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const syncMotionPreference = () => {
            if (reducedMotion.matches || itemCount <= 1) autoplay.stop();
            else autoplay.play();
        };

        syncMotionPreference();
        reducedMotion.addEventListener("change", syncMotionPreference);

        return () => {
            emblaApi.off("select", syncSelectedIndex);
            emblaApi.off("reInit", syncSelectedIndex);
            reducedMotion.removeEventListener("change", syncMotionPreference);
            autoplay.stop();
        };
    }, [autoplay, emblaApi, itemCount, syncSelectedIndex]);

    return { emblaRef, emblaApi, selectedIndex };
}

function CarouselDots({
    count,
    selectedIndex,
    onSelect,
}: {
    count: number;
    selectedIndex: number;
    onSelect: (index: number) => void;
}) {
    if (count <= 1) return null;

    return (
        <div className="mt-5 flex items-center justify-center gap-2" aria-label="Chọn nội dung">
            {Array.from({ length: count }, (_, index) => (
                <button
                    key={index}
                    type="button"
                    aria-label={`Xem mục ${index + 1}`}
                    aria-current={index === selectedIndex ? "true" : undefined}
                    onClick={() => onSelect(index)}
                    className={`focus-ring rounded-full transition-all duration-300 ${
                        index === selectedIndex ? "h-1.5 w-6 bg-accent" : "size-1.5 bg-accent/30 hover:bg-accent/60"
                    }`}
                />
            ))}
        </div>
    );
}

function TrendCard({ src, index }: { src: string; index: number }) {
    return (
        <figure className="group relative aspect-[3/4] overflow-hidden rounded-[24px] border border-line bg-tint shadow-[0_14px_42px_rgba(48,40,35,0.04)]">
            <Image
                src={src}
                alt={`Mẫu nail hot trend tại Serpente Nail Room ${index + 1}`}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
            <span className="absolute bottom-4 left-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">
                Hot trend {String(index + 1).padStart(2, "0")}
            </span>
        </figure>
    );
}

function ReviewCard({ review }: { review: CustomerReview }) {
    return (
        <article className="flex min-h-[290px] flex-col justify-between rounded-[24px] border border-line bg-surface p-6 shadow-[0_14px_42px_rgba(48,40,35,0.04)] sm:p-7">
            <blockquote className="whitespace-pre-line font-serif text-[23px] leading-[1.25] tracking-[-0.015em] sm:text-[27px]">
                “{review.content}”
            </blockquote>
            <div className="mt-7 flex items-end justify-between gap-4 border-t border-line pt-5">
                <div>
                    <p className="text-sm font-semibold">{review.display_name}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">{review.source}</p>
                </div>
                <a
                    href={review.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring shrink-0 text-xs font-semibold text-accent hover:underline"
                >
                    Xem đánh giá ↗
                </a>
            </div>
        </article>
    );
}

function MobileTrendCarousel() {
    const carousel = useAutoCarousel(HOT_TREND_IMAGES.length, 4800);

    return (
        <div className="mt-8">
            <div ref={carousel.emblaRef} className="overflow-hidden">
                <div className="flex">
                    {HOT_TREND_IMAGES.map((src, index) => (
                        <div key={src} className="min-w-0 flex-[0_0_100%]">
                            <TrendCard src={src} index={index} />
                        </div>
                    ))}
                </div>
            </div>
            <CarouselDots
                count={HOT_TREND_IMAGES.length}
                selectedIndex={carousel.selectedIndex}
                onSelect={(index) => carousel.emblaApi?.scrollTo(index)}
            />
        </div>
    );
}

function MobileReviewsCarousel({ reviews }: { reviews: CustomerReview[] }) {
    const carousel = useAutoCarousel(reviews.length, 7200);

    return (
        <div className="mt-8">
            <div ref={carousel.emblaRef} className="overflow-hidden">
                <div className="flex">
                    {reviews.map((review) => (
                        <div key={review.source_url} className="min-w-0 flex-[0_0_100%]">
                            <ReviewCard review={review} />
                        </div>
                    ))}
                </div>
            </div>
            <CarouselDots
                count={reviews.length}
                selectedIndex={carousel.selectedIndex}
                onSelect={(index) => carousel.emblaApi?.scrollTo(index)}
            />
        </div>
    );
}

export function HomeShowcase({ content }: { content: SalonContent | null }) {
    const isMobile = useIsMobile();

    if (!content) {
        return (
            <section className="border-t border-line">
                <div className="site-shell py-14 lg:py-20">
                    <p className="text-sm text-muted">Thông tin của Serpente đang được cập nhật.</p>
                </div>
            </section>
        );
    }

    const reviews = content.customer_reviews;
    const instagramUrl = getInstagramUrl(content.instagram_handle);
    const mapsUrl = getMapsSearchUrl(content.google_maps_location);

    const details = [
        content.has_refreshments
            ? {
                  eyebrow: "Tại tiệm",
                  title: "Có bánh và đồ uống",
                  body: "Bạn có thể dùng bánh và đồ uống trong lúc làm móng.",
              }
            : null,
        content.has_warranty && content.warranty_days
            ? {
                  eyebrow: "Sau khi làm móng",
                  title: `Bảo hành ${content.warranty_days} ngày`,
                  body: `Serpente áp dụng chính sách bảo hành móng trong ${content.warranty_days} ngày.`,
              }
            : null,
        content.instagram_handle
            ? {
                  eyebrow: "Theo dõi Serpente",
                  title: `@${content.instagram_handle.replace(/^@/, "")}`,
                  body: "Mẫu móng mới và thông tin từ tiệm được cập nhật trên Instagram.",
              }
            : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null);

    return (
        <>
            <section className="border-t border-line">
                <div className="site-shell py-14 lg:py-20">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                                Hot trend
                            </p>
                            <h2 className="mt-3 max-w-2xl font-serif text-4xl tracking-[-0.025em] sm:text-5xl">
                                Mẫu nail đang được yêu thích
                            </h2>
                            <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
                                Một vài mẫu nổi bật tại Serpente để bạn tham khảo trước khi đặt lịch.
                            </p>
                        </div>
                        {instagramUrl ? (
                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="focus-ring group w-fit rounded-sm text-xs font-semibold text-accent"
                            >
                                @{content.instagram_handle} <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                            </a>
                        ) : null}
                    </div>

                    {isMobile === true ? (
                        <MobileTrendCarousel />
                    ) : (
                        <div className="mt-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                            {HOT_TREND_IMAGES.map((src, index) => (
                                <TrendCard key={src} src={src} index={index} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {details.length > 0 ? (
                <section className="border-t border-line">
                    <div className="site-shell py-14 lg:py-20">
                        <div className="max-w-3xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Một vài điều về tiệm</p>
                            <h2 className="mt-3 font-serif text-4xl tracking-[-0.025em] sm:text-5xl">
                                Để buổi làm móng thoải mái hơn
                            </h2>
                        </div>

                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            {details.map((item) => (
                                <article key={item.title} className="rounded-[22px] border border-line bg-surface p-6 sm:p-7">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{item.eyebrow}</p>
                                    <h3 className="mt-4 font-serif text-3xl leading-tight">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-muted">{item.body}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {reviews.length > 0 ? (
                <section className="border-t border-line">
                    <div className="site-shell py-14 lg:py-20">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Đánh giá từ khách hàng</p>
                                <h2 className="mt-3 font-serif text-4xl tracking-[-0.025em] sm:text-5xl">
                                    Khách đã ghé Serpente nói gì?
                                </h2>
                            </div>
                            {mapsUrl ? (
                                <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="focus-ring rounded-sm text-xs font-semibold text-accent hover:underline"
                                >
                                    Mở Google Maps ↗
                                </a>
                            ) : null}
                        </div>

                        {isMobile === true ? (
                            <MobileReviewsCarousel reviews={reviews} />
                        ) : (
                            <div className="mt-8 hidden gap-5 md:grid md:grid-cols-2">
                                {reviews.map((review) => (
                                    <ReviewCard key={review.source_url} review={review} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            ) : null}
        </>
    );
}
