import type { Metadata } from "next";
import { MyAppointments } from "@/components/appointments/MyAppointments";

export const metadata: Metadata = {
    title: "Lịch của tôi",
    description: "Xem trạng thái và thông tin các lịch hẹn đã đặt tại Serpente Nail Room.",
};

export default function AppointmentsPage() {
    return (
        <section className="site-shell pb-16 pt-12 lg:pb-20 lg:pt-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Lịch hẹn của bạn</p>
            <h1 className="mt-3 font-serif text-5xl tracking-[-0.035em] sm:text-6xl lg:text-[68px]">Lịch của tôi</h1>
            <div className="mt-9">
                <MyAppointments />
            </div>
        </section>
    );
}
