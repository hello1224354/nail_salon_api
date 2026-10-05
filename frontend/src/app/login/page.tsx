import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";
import { studio } from "@/lib/studio-data";

export const metadata: Metadata = {
    title: "Đăng nhập",
    description: "Đăng nhập tài khoản NS Nail Studio để đặt lịch.",
};

export default function LoginPage() {
    return (
        <section className="py-12 sm:py-16 lg:py-20">
            <div className="site-shell">
                <div className="mx-auto grid w-full max-w-[1320px] overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_24px_80px_rgba(48,40,35,0.07)] lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                        Tài khoản khách hàng
                    </p>
                    <h1 className="mt-4 font-serif text-[clamp(2.8rem,5vw,4.6rem)] leading-[0.92] tracking-[-0.04em]">
                        Chào mừng
                        <br />
                        quay lại.
                    </h1>
                    <p className="mt-5 max-w-md text-sm leading-6 text-muted">
                        Đăng nhập bằng số điện thoại đã đăng ký để tiếp tục đặt lịch.
                    </p>

                    <LoginForm />
                </div>

                    <div className="relative min-h-[430px] overflow-hidden bg-tint lg:min-h-[690px]">
                    <Image
                        src="/nails/nail-02.png"
                        alt="Bộ móng tự nhiên tại NS Nail Studio"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        className="object-cover"
                    />
                    <div className="absolute inset-x-5 bottom-5 rounded-[20px] border border-white/70 bg-white/90 p-5 shadow-lg backdrop-blur-sm sm:inset-x-7 sm:bottom-7 sm:p-6">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                            Quận 1
                        </p>
                        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
                            <div>
                                <p className="font-serif text-2xl">Buổi làm móng tiếp theo, được sắp xếp thật chu đáo.</p>
                                <p className="mt-2 text-xs leading-5 text-muted">{studio.address}</p>
                            </div>
                            <p className="shrink-0 text-xs font-semibold text-ink">{studio.hours}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </section>
    );
}
