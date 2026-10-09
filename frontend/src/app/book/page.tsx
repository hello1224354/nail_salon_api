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
            <div className="mt-9">
                <BookingForm />
            </div>
        </section>
    );
}
