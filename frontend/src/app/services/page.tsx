import type { Metadata } from "next";
import Link from "next/link";
import { ServicesCatalogue } from "@/components/services/ServicesCatalogue";

export const metadata: Metadata = {
    title: "Dịch vụ",
    alternates: { canonical: "/services" },
    description: "Xem đầy đủ bảng giá dịch vụ hiện có tại Serpente Nail Room.",
};

export default function ServicesPage() {
    return (
        <>
            <section className="site-shell pb-14 pt-12 lg:pb-20 lg:pt-16">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Bảng giá Serpente</p>
                <h1 className="mt-3 font-serif text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.2] tracking-[-0.015em]">Dịch vụ</h1>
                <div className="mt-8 sm:mt-10">
                    <ServicesCatalogue />
                </div>
            </section>

            <section className="site-shell pb-14 lg:pb-20">
                <div className="flex flex-col gap-6 rounded-[22px] bg-tint px-7 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
                    <p className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] tracking-[-0.02em]">Bạn đã chọn được dịch vụ?</p>
                    <Link
                        href="/book"
                        className="focus-ring w-fit rounded-full bg-ink px-7 py-3 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
                    >
                        Đặt lịch ngay!
                    </Link>
                </div>
            </section>
        </>
    );
}
