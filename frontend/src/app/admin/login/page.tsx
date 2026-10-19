import type { Metadata } from "next";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
    title: "Đăng nhập quản trị",
    description: "Đăng nhập trang quản trị Serpente Nail Room.",
    robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
    return (
        <section className="flex min-h-screen items-center justify-center bg-[#26221f] px-4 py-10 text-white sm:px-6 lg:py-14">
            <div className="mx-auto w-full max-w-[42rem] rounded-[28px] border border-white/10 bg-[#302a26] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.24)] sm:p-10 lg:p-14">
                <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#c9aa96]/65 font-serif text-xs">
                        SR
                    </span>
                    <div className="min-w-0">
                        <p className="font-serif text-xl">Serpente Nail Room</p>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Trang quản trị</p>
                    </div>
                </div>

                <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c9aa96]">
                    Khu vực quản trị
                </p>
                <h1 className="mt-4 font-serif text-[clamp(2.65rem,6vw,4.5rem)] leading-[1.18] tracking-[-0.015em]">
                    Quản lý
                    <br />
                    Serpente.
                </h1>
                <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
                    Theo dõi lịch hẹn và cập nhật dữ liệu vận hành của tiệm tại một nơi.
                </p>

                <AdminLoginForm />

                <Link href="/" className="mt-6 inline-block text-xs text-white/65 transition hover:text-white">
                    ← Quay lại website
                </Link>
            </div>
        </section>
    );
}
