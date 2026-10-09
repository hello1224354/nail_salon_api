import type { Metadata } from "next";
import Link from "next/link";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export const metadata: Metadata = {
    title: "Bảo mật quản trị",
    description: "Đổi mật khẩu quản trị Serpente Nail Room.",
    robots: { index: false, follow: false },
};

export default function AdminSecurityPage() {
    return (
        <section className="min-h-screen bg-[#26221f] px-4 py-8 text-white sm:px-6 lg:py-14">
            <div className="mx-auto w-full max-w-xl rounded-[28px] border border-white/10 bg-[#302a26] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.24)] sm:p-10">
                <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full border border-[#c9aa96]/65 font-serif text-xs">SR</span>
                    <div>
                        <p className="font-serif text-xl">Serpente Nail Room</p>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Bảo mật quản trị</p>
                    </div>
                </div>

                <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9aa96]">Bảo mật quản trị</p>
                <h1 className="mt-4 font-serif text-[clamp(2.5rem,7vw,4rem)] leading-[0.95] tracking-[-0.04em]">Đổi mật khẩu</h1>

                <div className="[&_.text-muted]:!text-white/55 [&_.text-ink]:!text-white [&_.bg-cream]:!bg-white/[0.06] [&_.border-line]:!border-white/12 [&_.bg-tint\/40]:!bg-white/[0.04] [&_.text-accent]:!text-[#d5b9a7]">
                    <ChangePasswordForm admin />
                </div>

                <Link href="/admin" className="mt-6 inline-block text-xs text-white/45 transition hover:text-white">
                    ← Quay lại trang quản trị
                </Link>
            </div>
        </section>
    );
}
