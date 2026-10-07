import type { Metadata } from "next";
import Link from "next/link";
import { ServicesCatalogue } from "@/components/services/ServicesCatalogue";

export const metadata: Metadata = {
    title: "Dịch vụ",
    description: "Xem đầy đủ bảng giá dịch vụ hiện có tại Serpente Nail Room.",
};

export default function ServicesPage() {
    return (
        <>
            <section className="site-shell pb-14 pt-12 lg:pb-20 lg:pt-16">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Bảng giá Serpente</p>
                <h1 className="mt-3 font-serif text-5xl tracking-[-0.035em] sm:text-6xl lg:text-[72px]">Dịch vụ</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                    Xem giá từng dịch vụ trước khi đặt. Dịch vụ chưa có thời lượng chính thức vẫn được niêm yết, nhưng chưa mở đặt lịch trực tuyến.
                </p>

                <div className="mt-8">
                    <ServicesCatalogue />
                </div>
            </section>

            <section className="site-shell pb-14 lg:pb-20">
                <div className="flex flex-col gap-6 rounded-[22px] bg-tint px-7 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
                    <p className="font-serif text-3xl tracking-[-0.02em] sm:text-4xl">Đã chọn được dịch vụ?</p>
                    <Link
                        href="/book"
                        className="focus-ring w-fit rounded-full bg-ink px-7 py-3 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
                    >
                        Chọn giờ đặt lịch
                    </Link>
                </div>
            </section>
        </>
    );
}
