import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
    title: "Đăng nhập",
    description: "Đăng nhập tài khoản để đặt và xem lịch hẹn tại Serpente Nail Room.",
};

export default function LoginPage() {
    return (
        <section className="py-12 sm:py-16 lg:py-20">
            <div className="site-shell">
                <div className="mx-auto w-full max-w-[42rem] rounded-[28px] border border-line bg-surface px-6 py-9 shadow-[0_24px_80px_rgba(48,40,35,0.07)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                        Tài khoản của bạn
                    </p>
                    <h1 className="mt-4 font-serif text-[clamp(2.6rem,5vw,3.7rem)] leading-[1.2] tracking-[-0.015em]">
                        Đăng nhập
                        <br />
                        để đặt lịch.
                    </h1>
                    <p className="mt-5 max-w-md text-sm leading-6 text-muted">
                        Đặt lịch dễ hơn khi bạn đã có tài khoản. Lịch hẹn của bạn sẽ được lưu trong tài khoản này.
                    </p>

                    <LoginForm />
                </div>
            </div>
        </section>
    );
}
