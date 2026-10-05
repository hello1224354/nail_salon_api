import type { Metadata } from "next";
import Image from "next/image";
import { CurrentOffers, type Offer } from "@/components/home/CurrentOffers";
import { studio } from "@/lib/studio-data";


export const metadata: Metadata = {
    title: "NS Nail Studio",
    description: "Khám phá ưu đãi, mẫu nail và trải nghiệm chăm sóc móng tại NS Nail Studio.",
};

const offers: Offer[] = [
    {
        name: "Bộ móng mới, khởi đầu nhẹ nhàng",
        details: "Chọn phong cách tinh giản với bảng màu trung tính được yêu thích tại studio.",
        validDates: "Áp dụng theo chương trình hiện hành tại salon",
        image: "/nails/nail-01.png",
    },
    {
        name: "Gel bền màu cho lịch trình bận rộn",
        details: "Một lựa chọn gọn gàng, bóng đẹp và phù hợp cho những tuần làm việc dài.",
        validDates: "Đặt lịch trước để chọn khung giờ phù hợp",
        image: "/nails/nail-02.png",
    },
    {
        name: "Thêm điểm nhấn với nail art",
        details: "Kết hợp màu nền thanh lịch cùng chi tiết trang trí vừa đủ cho phong cách riêng của bạn.",
        validDates: "Thiết kế được tư vấn tại buổi hẹn",
        image: "/nails/nail-04.png",
    },
];

const instagramLooks = [
    { name: "Mẫu nail 01", image: "/nails/nail-01.png" },
    { name: "Mẫu nail 02", image: "/nails/nail-02.png" },
    { name: "Mẫu nail 03", image: "/nails/nail-03.png" },
    { name: "Mẫu nail 04", image: "/nails/nail-04.png" },
];

const experience = [
    {
        title: "Thư giãn thoải mái",
        description: "Không gian yên tĩnh với bánh và đồ uống trong suốt buổi làm móng.",
        icon: (
            <svg viewBox="0 0 40 40" className="size-8" aria-hidden="true">
                <path d="M10 16h17v6.5A7.5 7.5 0 0 1 19.5 30h-2A7.5 7.5 0 0 1 10 22.5V16Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M27 18h2.5a3.5 3.5 0 0 1 0 7H27M14 11c0-2 2-2 2-4M20 11c0-2 2-2 2-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: "Khám phá màu sắc",
        description: "Bảng màu đa dạng để bạn chọn phong cách cho bộ móng tiếp theo.",
        icon: (
            <svg viewBox="0 0 40 40" className="size-8" aria-hidden="true">
                <path d="M20 7c-7.2 0-13 5.1-13 11.5S12.8 30 20 30h2.3c2 0 3.2-2.1 2.2-3.8-.9-1.5.2-3.4 2-3.4H29c3.4 0 5.8-2.1 5.8-5.2C34.8 11.5 28 7 20 7Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="14" cy="15" r="1.5" fill="currentColor" /><circle cx="20" cy="12" r="1.5" fill="currentColor" /><circle cx="26" cy="15" r="1.5" fill="currentColor" />
            </svg>
        ),
    },
    {
        title: "Chăm sóc cao cấp",
        description: "Sản phẩm cao cấp cùng chính sách bảo hành móng 7 ngày.",
        icon: (
            <svg viewBox="0 0 40 40" className="size-8" aria-hidden="true">
                <path d="M20 6 31 10v8c0 7.3-4.8 12.4-11 16-6.2-3.6-11-8.7-11-16v-8l11-4Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="m15.5 20 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
];

export default function HomePage() {
    return (
        <>
            <section className="site-shell py-10 sm:py-14 lg:py-16">
                <CurrentOffers offers={offers} />
            </section>

            <section className="border-t border-line">
                <div className="site-shell py-14 lg:py-20">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                                Từ Instagram của chúng tôi
                            </p>
                            <h2 className="mt-3 font-serif text-4xl tracking-[-0.025em] sm:text-5xl">
                                Xu hướng nail
                            </h2>
                        </div>
                        <a
                            href={studio.instagramUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="focus-ring group w-fit rounded-sm text-xs font-semibold text-accent"
                        >
                            Xem trang Instagram <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                        </a>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {instagramLooks.map((look) => (
                            <a
                                key={look.name}
                                href={studio.instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="focus-ring group overflow-hidden rounded-[18px] border border-line bg-surface p-2 shadow-[0_8px_26px_rgba(48,40,35,0.04)] transition-transform hover:-translate-y-1"
                            >
                                <div className="relative aspect-square overflow-hidden rounded-[13px] bg-tint">
                                    <Image
                                        src={look.image}
                                        alt={look.name}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                    />
                                </div>
                                <div className="px-2 pb-3 pt-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Instagram</p>
                                    <h3 className="mt-2 font-serif text-xl">{look.name}</h3>
                                    <p className="mt-3 text-[11px] text-muted underline decoration-line underline-offset-4">Xem trên Instagram</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-t border-line">
                <div className="site-shell py-14 lg:py-20">
                    <div className="grid gap-5 md:grid-cols-[1fr_0.55fr] md:items-end">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Không chỉ là chăm sóc móng</p>
                            <h2 className="mt-3 font-serif text-4xl tracking-[-0.025em] sm:text-5xl">Trải nghiệm tại studio</h2>
                        </div>
                        <p className="max-w-sm text-sm leading-6 text-muted md:justify-self-end">
                            Thư giãn, khám phá màu sắc
                            <br className="hidden sm:block" /> và tận hưởng buổi làm móng của bạn.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        {experience.map((item) => (
                            <article key={item.title} className="rounded-[18px] border border-line bg-surface p-2">
                                <div className="flex h-24 items-center justify-center rounded-[13px] bg-tint text-accent/65">
                                    {item.icon}
                                </div>
                                <div className="px-3 pb-4 pt-4">
                                    <h3 className="font-serif text-xl">{item.title}</h3>
                                    <p className="mt-2 max-w-xs text-xs leading-5 text-muted">{item.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-t border-line">
                <div className="site-shell py-14 lg:py-20">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <h2 className="font-serif text-4xl tracking-[-0.025em] sm:text-5xl">Khách hàng nói gì</h2>
                        <a
                            href={studio.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="focus-ring rounded-sm text-xs font-semibold text-accent hover:underline"
                        >
                            Xem trên Google Maps ↗
                        </a>
                    </div>

                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        {[
                            {
                                name: "Khách hàng tại studio",
                                quote: "Không gian nhẹ nhàng, thao tác cẩn thận và bộ móng hoàn thiện rất gọn.",
                                background: "bg-[#e6ddd3]",
                            },
                            {
                                name: "Khách hàng tại studio",
                                quote: "Dễ chọn màu, lịch hẹn rõ ràng và trải nghiệm tổng thể rất thoải mái.",
                                background: "bg-surface",
                            },
                        ].map((review, index) => (
                            <a
                                key={`${review.name}-${index}`}
                                href={studio.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`focus-ring rounded-[18px] border border-line p-6 sm:p-8 ${review.background}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex size-9 items-center justify-center rounded-full border border-accent/25 text-xs text-accent">NS</span>
                                    <span className="text-xs font-semibold">{review.name}</span>
                                </div>
                                <div className="my-5 h-px bg-ink/20" />
                                <p className="font-serif text-lg leading-7">“{review.quote}”</p>
                                <p className="mt-6 text-[11px] text-muted">Trải nghiệm khách hàng {index + 1}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
