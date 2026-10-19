import type { Metadata } from "next";
import { BookingForm } from "@/components/booking/BookingForm";
import "./book.css";

export const metadata: Metadata = {
    title: "Đặt lịch",
    alternates: { canonical: "/book" },
    description: "Chọn dịch vụ, số người và giờ còn trống để đặt lịch tại Serpente Nail Room.",
};

export default function BookPage() {
    return (
        <section className="site-shell pb-16 pt-12 lg:pb-20 lg:pt-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Đặt lịch tại Serpente</p>
            <h1 className="mt-3 font-serif text-[clamp(2.75rem,6vw,4.25rem)] leading-[1.2] tracking-[-0.015em]">Đặt lịch hẹn</h1>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                Giá dịch vụ trên website chỉ mang tính tham khảo và có thể thay đổi tùy theo mẫu móng. Nếu cần tư vấn hoặc báo giá chi tiết, bạn có thể liên hệ tiệm qua Instagram.
            </p>

            <div className="mt-9">
                <BookingForm />
            </div>
        </section>
    );
}
