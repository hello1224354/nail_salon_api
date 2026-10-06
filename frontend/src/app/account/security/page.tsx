import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export const metadata: Metadata = {
    title: "Bảo mật tài khoản",
    description: "Đổi mật khẩu tài khoản Serpente Nail Room.",
    robots: { index: false, follow: false },
};

export default function AccountSecurityPage() {
    return (
        <section className="py-12 sm:py-16 lg:py-20">
            <div className="site-shell">
                <div className="mx-auto w-full max-w-xl rounded-[28px] border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(48,40,35,0.07)] sm:p-10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Tài khoản</p>
                    <h1 className="mt-4 font-serif text-[clamp(2.5rem,7vw,4rem)] leading-[0.95] tracking-[-0.04em]">
                        Đổi mật khẩu.
                    </h1>
                    <p className="mt-5 text-sm leading-6 text-muted">
                        Sau khi đổi mật khẩu, mọi phiên đăng nhập hiện tại sẽ bị thu hồi.
                    </p>
                    <ChangePasswordForm />
                </div>
            </div>
        </section>
    );
}
