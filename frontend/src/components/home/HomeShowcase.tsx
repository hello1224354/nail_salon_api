"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { CustomerReview, HotTrendImage, InstagramShowcaseItem, SalonContent } from "@/lib/api";
import { getInstagramUrl, getMapsUrl } from "@/lib/studio-data";

const MOBILE_QUERY = "(max-width: 767px)";

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

function HotTrendCard({ item, index }: { item: HotTrendImage; index: number }) {
    return (
        <figure className="group relative aspect-[4/5] overflow-hidden rounded-[24px] bg-tint shadow-[0_14px_42px_rgba(48,40,35,0.05)]">
            <Image
                src={item.image_url}
                alt={`Mẫu nail hot trend ${index + 1} tại Serpente Nail Room`}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
                className="motion-image object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/45 via-black/10 to-transparent px-5 pb-5 pt-16 text-white">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Hot trend</span>
                <span className="font-serif text-xl">{String(index + 1).padStart(2, "0")}</span>
            </figcaption>
        </figure>
    );
}

function MobileHotTrendCarousel({ items }: { items: HotTrendImage[] }) {
    const carousel = useAutoCarousel(items.length, 4600);

    return (
        <div className="mt-8">
            <div ref={carousel.emblaRef} className="overflow-hidden">
                <div className="flex">
                    {items.map((item, index) => (
                        <div key={item.id} className="min-w-0 flex-[0_0_100%]">
                            <HotTrendCard item={item} index={index} />
                        </div>
                    ))}
                </div>
            </div>
            <CarouselDots
                count={items.length}
                selectedIndex={carousel.selectedIndex}
                onSelect={(index) => carousel.emblaApi?.scrollTo(index)}
            />
        </div>
    );
}

function InstagramCard({ item, index }: { item: InstagramShowcaseItem; index: number }) {
    return (
        <a
            href={item.instagram_url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring group flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[24px] border border-line bg-surface p-6 shadow-[0_14px_42px_rgba(48,40,35,0.04)] transition-transform hover:-translate-y-1 sm:min-h-[360px] sm:p-7"
        >
            <div>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Instagram</span>
                    <span className="font-serif text-3xl text-accent/35">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-8 max-w-[15ch] font-serif text-3xl leading-[1.02] tracking-[-0.025em] sm:text-4xl">
                    {item.title?.trim() || "Một mẫu móng từ Serpente Nail Room"}
                </h3>
            </div>

            <div>
                <div className="h-px bg-line" />
                <p className="mt-5 text-xs font-semibold text-accent">
                    Xem bài đăng trên Instagram <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </p>
            </div>
        </a>
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

function MobileInstagramCarousel({ items }: { items: InstagramShowcaseItem[] }) {
    const carousel = useAutoCarousel(items.length, 5200);

    return (
        <div className="mt-8">
            <div ref={carousel.emblaRef} className="overflow-hidden">
                <div className="flex">
                    {items.map((item, index) => (
                        <div key={item.instagram_url} className="min-w-0 flex-[0_0_100%]">
                            <InstagramCard item={item} index={index} />
                        </div>
                    ))}
                </div>
            </div>
            <CarouselDots
                count={items.length}
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

    const hotTrendImages = content.hot_trend_images ?? [];
    const instagramItems = [...content.instagram_showcase].sort((a, b) => a.sort_order - b.sort_order);
    const reviews = content.customer_reviews;
    const instagramUrl = getInstagramUrl(content.instagram_handle);
    const mapsUrl = getMapsUrl(content.google_maps_url, content.google_maps_location);

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
            {hotTrendImages.length > 0 ? (
                <section className="border-t border-line">
                    <div className="site-shell py-14 lg:py-20">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                                    Hot trend
                                </p>
                                <h2 className="mt-3 max-w-3xl font-serif text-4xl tracking-[-0.025em] sm:text-5xl">
                                    Mẫu nail đang được yêu thích
                                </h2>
                            </div>
                            <p className="max-w-sm text-sm leading-6 text-muted">
                                Bộ sưu tập được cập nhật trực tiếp từ thư viện mẫu của Serpente.
                            </p>
                        </div>

                        {isMobile === true ? (
                            <MobileHotTrendCarousel items={hotTrendImages} />
                        ) : (
                            <div className="mt-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                                {hotTrendImages.map((item, index) => (
                                    <HotTrendCard key={item.id} item={item} index={index} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            ) : null}

            {instagramItems.length > 0 ? (
                <section className="border-t border-line">
                    <div className="site-shell py-14 lg:py-20">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                                    Mẫu móng tại Serpente
                                </p>
                                <h2 className="mt-3 font-serif text-4xl tracking-[-0.025em] sm:text-5xl">
                                    Xem thêm trên Instagram
                                </h2>
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
                            <MobileInstagramCarousel items={instagramItems} />
                        ) : (
                            <div className="mt-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                                {instagramItems.map((item, index) => (
                                    <InstagramCard key={item.instagram_url} item={item} index={index} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            ) : null}

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
