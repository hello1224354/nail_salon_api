import type { Metadata } from "next";
import { BookingForm } from "@/components/booking/BookingForm";
import "./book.css";

export const metadata: Metadata = {
    title: "Đặt lịch",
    description: "Chọn dịch vụ, số người và giờ còn trống để đặt lịch tại Serpente Nail Room.",
};

export default function BookPage() {
    return (
        <section className="site-shell pb-16 pt-12 lg:pb-20 lg:pt-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Đặt lịch tại Serpente</p>
            <h1 className="mt-3 font-serif text-5xl tracking-[-0.035em] sm:text-6xl lg:text-[68px]">Đặt lịch hẹn</h1>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                Chọn dịch vụ, số người và giờ phù hợp. Giá trên website là giá tham khảo và có thể cao hơn thực tế; nhân viên sẽ báo giá trước khi làm. Tiệm sẽ xác nhận lại lịch hẹn.
            </p>

            <div className="mt-9">
                <BookingForm />
            </div>
        </section>
    );
}
