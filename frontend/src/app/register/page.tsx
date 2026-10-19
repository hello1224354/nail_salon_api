import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
    title: "Tạo tài khoản",
    description: "Tạo tài khoản để đặt lịch và theo dõi lịch hẹn tại Serpente Nail Room.",
};

export default function RegisterPage() {
    return (
        <section className="py-12 sm:py-16 lg:py-20">
            <div className="site-shell">
                <div className="mx-auto w-full max-w-[42rem] rounded-[28px] border border-line bg-surface px-6 py-9 shadow-[0_24px_80px_rgba(48,40,35,0.07)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Đặt lịch trực tuyến</p>
                    <h1 className="mt-4 font-serif text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.2] tracking-[-0.015em]">
                        Tạo tài khoản trong vài phút.
                    </h1>
                    <p className="mt-5 max-w-md text-sm leading-6 text-muted">
                        Tài khoản giúp bạn đặt lịch, xem trạng thái xác nhận và lưu lại các lịch đã đặt.
                    </p>
                    <RegisterForm />
                </div>
            </div>
        </section>
    );
}
