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
        <section className="min-h-screen bg-[#26221f] px-4 py-8 text-white sm:px-6 lg:py-14">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#302a26] shadow-[0_30px_100px_rgba(0,0,0,0.24)] lg:grid-cols-[0.9fr_1.1fr]">
                <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full border border-[#c9aa96]/65 font-serif text-xs">
                            NS
                        </span>
                        <div>
                            <p className="font-serif text-xl">Serpente Nail Room</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Admin Console</p>
                        </div>
                    </div>

                    <p className="mt-14 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9aa96]">
                        Khu vực quản trị
                    </p>
                    <h1 className="mt-4 font-serif text-[clamp(2.8rem,6vw,5rem)] leading-[0.9] tracking-[-0.045em]">
                        Điều hành
                        <br />
                        salon.
                    </h1>
                    <p className="mt-5 max-w-md text-sm leading-6 text-white/55">
                        Quản lý lịch hẹn, dịch vụ, nhân viên, chi nhánh và ưu đãi từ một nơi.
                    </p>

                    <AdminLoginForm />

                    <Link href="/" className="mt-6 w-fit text-xs text-white/45 transition hover:text-white">
                        ← Quay lại website
                    </Link>
                </div>

                <div className="relative hidden overflow-hidden border-l border-white/10 bg-[#d8c8ba] lg:block">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.7),transparent_28%),linear-gradient(145deg,#d8c8ba_0%,#b9937c_48%,#6f5547_100%)]" />
                    <div className="absolute inset-x-10 bottom-10 rounded-[22px] border border-white/35 bg-[#2e2925]/80 p-7 backdrop-blur-md">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d9bca9]">
                            Serpente Nail Room
                        </p>
                        <p className="mt-3 max-w-lg font-serif text-3xl leading-tight">
                            Theo dõi vận hành hằng ngày và xử lý lịch hẹn nhanh hơn.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
