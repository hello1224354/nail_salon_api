"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { apiRequest, type CustomerReview, type InstagramTrendItem, type SalonContent } from "@/lib/api";
import { getInstagramUrl, getMapsUrl } from "@/lib/studio-data";
import { useBranch } from "@/components/branch/BranchProvider";

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
            slidesToScroll: 1,
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

function CarouselArrows({
    onPrevious,
    onNext,
    label,
}: {
    onPrevious: () => void;
    onNext: () => void;
    label: string;
}) {
    const buttonClass =
        "focus-ring pointer-events-auto flex size-14 items-center justify-center rounded-full border border-line bg-surface/95 text-2xl font-semibold text-ink shadow-[0_12px_34px_rgba(48,40,35,0.14)] backdrop-blur-sm transition hover:bg-tint";

    return (
        <div className="pointer-events-none absolute inset-x-2 top-1/2 z-20 flex -translate-y-1/2 items-center justify-between sm:inset-x-3">
            <button
                type="button"
                aria-label={`${label} trước`}
                className={buttonClass}
                onClick={onPrevious}
            >
                ←
            </button>
            <button
                type="button"
                aria-label={`${label} tiếp theo`}
                className={buttonClass}
                onClick={onNext}
            >
                →
            </button>
        </div>
    );
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

function HotTrendCard({ item, index }: { item: InstagramTrendItem; index: number }) {
    const instagramPostUrl = item.instagram_url;

    const card = (
        <figure className="group relative aspect-[4/5] overflow-hidden rounded-[24px] bg-tint shadow-[0_14px_42px_rgba(48,40,35,0.05)]">
            <Image
                src={item.image_src}
                alt={item.title?.trim() || `Mẫu nail hot trend ${index + 1} tại Serpente Nail Room`}
                fill
                sizes="(max-width: 1023px) 50vw, 33vw"
                className="motion-image object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent px-5 pb-5 pt-20 text-white">
                <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Hot trend</span>
                        {item.title?.trim() ? (
                            <p className="mt-2 line-clamp-2 max-w-[24ch] font-serif text-xl leading-tight">
                                {item.title}
                            </p>
                        ) : null}
                        {instagramPostUrl ? (
                            <p className="mt-3 text-[11px] font-semibold">
                                Xem bài trên Instagram{" "}
                                <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">↗</span>
                            </p>
                        ) : null}
                    </div>
                    <span className="shrink-0 font-serif text-xl">{String(index + 1).padStart(2, "0")}</span>
                </div>
            </figcaption>
        </figure>
    );

    return (
        <a
            href={instagramPostUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring block rounded-[24px]"
            aria-label={`Mở mẫu nail hot trend ${index + 1} trên Instagram`}
        >
            {card}
        </a>
    );
}

function HotTrendCarousel({ items }: { items: InstagramTrendItem[] }) {
    const carousel = useAutoCarousel(items.length, 4600);

    return (
        <div className="relative mt-8">
            <div ref={carousel.emblaRef} className="overflow-hidden">
                <div className="-ml-4 flex">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className="min-w-0 shrink-0 grow-0 basis-1/2 pl-4 lg:basis-1/3"
                        >
                            <HotTrendCard item={item} index={index} />
                        </div>
                    ))}
                </div>
            </div>
            {items.length > 1 ? (
                <CarouselArrows
                    label="Mẫu hot trend"
                    onPrevious={() => carousel.emblaApi?.scrollPrev()}
                    onNext={() => carousel.emblaApi?.scrollNext()}
                />
            ) : null}
            <CarouselDots
                count={items.length}
                selectedIndex={carousel.selectedIndex}
                onSelect={(index) => carousel.emblaApi?.scrollTo(index)}
            />
        </div>
    );
}

function ReviewCard({ review }: { review: CustomerReview }) {
    return (
        <article className="flex h-[250px] w-full flex-col rounded-[22px] border border-line bg-surface p-5 shadow-[0_14px_42px_rgba(48,40,35,0.04)] sm:h-[270px] sm:p-6">
            <blockquote className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain whitespace-pre-line pr-2 font-serif text-[19px] leading-[1.3] tracking-[-0.015em] sm:text-[21px]">
                “{review.content}”
            </blockquote>
            <div className="mt-4 flex shrink-0 items-end justify-between gap-4 border-t border-line pt-4">
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

function ReviewsCarousel({ reviews }: { reviews: CustomerReview[] }) {
    const carousel = useAutoCarousel(reviews.length, 7200);

    return (
        <div className="relative mt-8">
            <div ref={carousel.emblaRef} className="overflow-hidden">
                <div className="-ml-4 flex">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="flex min-w-0 shrink-0 grow-0 basis-1/2 pl-4 lg:basis-1/3"
                        >
                            <ReviewCard review={review} />
                        </div>
                    ))}
                </div>
            </div>
            {reviews.length > 1 ? (
                <CarouselArrows
                    label="Đánh giá"
                    onPrevious={() => carousel.emblaApi?.scrollPrev()}
                    onNext={() => carousel.emblaApi?.scrollNext()}
                />
            ) : null}
            <CarouselDots
                count={reviews.length}
                selectedIndex={carousel.selectedIndex}
                onSelect={(index) => carousel.emblaApi?.scrollTo(index)}
            />
        </div>
    );
}

export function HomeShowcase({ content }: { content: SalonContent | null }) {
    const { selectedBranchId } = useBranch();
    const [resolvedContent, setResolvedContent] = useState<SalonContent | null>(content);

    useEffect(() => {
        if (selectedBranchId === null) return;

        let cancelled = false;

        async function loadBranchContent() {
            try {
                const nextContent = await apiRequest<SalonContent>(
                    `/api/site-content?branch_id=${selectedBranchId}`
                );

                if (!cancelled) setResolvedContent(nextContent);
            } catch (error) {
                console.error("Chưa tải được đánh giá theo chi nhánh", error);
            }
        }

        void loadBranchContent();

        return () => {
            cancelled = true;
        };
    }, [selectedBranchId]);

    if (!resolvedContent) {
        return (
            <section className="border-t border-line">
                <div className="site-shell py-14 lg:py-20">
                    <p className="text-sm text-muted">Thông tin của Serpente đang được cập nhật.</p>
                </div>
            </section>
        );
    }

    const trendItems = [...resolvedContent.instagram_showcase].sort((a, b) => a.sort_order - b.sort_order);
    const reviews = resolvedContent.customer_reviews;
    const instagramUrl = getInstagramUrl(resolvedContent.instagram_handle);
    const mapsUrl = getMapsUrl(resolvedContent.google_maps_url, resolvedContent.google_maps_location);

    const details = [
        resolvedContent.has_refreshments
            ? {
                  eyebrow: "Tại tiệm",
                  title: "Có bánh và đồ uống",
                  body: "Bạn có thể dùng bánh và đồ uống trong lúc làm móng.",
              }
            : null,
        resolvedContent.has_warranty && resolvedContent.warranty_days
            ? {
                  eyebrow: "Sau khi làm móng",
                  title: `Bảo hành ${resolvedContent.warranty_days} ngày`,
                  body: `Serpente áp dụng chính sách bảo hành móng trong ${resolvedContent.warranty_days} ngày.`,
              }
            : null,
        resolvedContent.instagram_handle
            ? {
                  eyebrow: "Theo dõi Instagram",
                  title: `@${resolvedContent.instagram_handle.replace(/^@/, "")}`,
                  body: "Mẫu móng mới và thông tin từ tiệm được cập nhật trên Instagram.",
              }
            : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null);

    return (
        <>
            {trendItems.length > 0 ? (
                <section className="border-t border-line">
                    <div className="site-shell py-14 lg:py-20">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                                    Hot trend
                                </p>
                                <h2 className="mt-3 max-w-3xl font-serif text-4xl tracking-[-0.025em] sm:text-5xl">
                                    Mẫu nail đang được yêu thích
                                </h2>
                            </div>
                            {instagramUrl ? (
                                <a
                                    href={instagramUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="focus-ring group w-fit rounded-sm text-xs font-semibold text-accent"
                                >
                                    @{resolvedContent.instagram_handle}{" "}
                                    <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                                        →
                                    </span>
                                </a>
                            ) : null}
                        </div>

                        <HotTrendCarousel items={trendItems} />
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

                        <ReviewsCarousel reviews={reviews} />
                    </div>
                </section>
            ) : null}
        </>
    );
}
