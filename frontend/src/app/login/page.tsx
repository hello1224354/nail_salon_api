import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";
import { getPrimaryBranch } from "@/lib/public-data";
import { localizeBranchName } from "@/lib/studio-data";

export const metadata: Metadata = {
    title: "Đăng nhập",
    description: "Đăng nhập tài khoản để đặt và xem lịch hẹn tại Serpente Nail Room.",
};

export default async function LoginPage() {
    const branch = await getPrimaryBranch();

    return (
        <section className="py-12 sm:py-16 lg:py-20">
            <div className="site-shell">
                <div className="mx-auto grid w-full max-w-[1320px] overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_24px_80px_rgba(48,40,35,0.07)] lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                            Tài khoản của bạn
                        </p>
                        <h1 className="mt-4 font-serif text-[clamp(2.8rem,5vw,4.6rem)] leading-[0.92] tracking-[-0.04em]">
                            Đăng nhập
                            <br />
                            để đặt lịch.
                        </h1>
                        <p className="mt-5 max-w-md text-sm leading-6 text-muted">
                            Dùng số điện thoại đã đăng ký để tiếp tục. Lịch hẹn của bạn sẽ được lưu trong tài khoản này.
                        </p>

                        <LoginForm />
                    </div>

                    <div className="relative min-h-[430px] overflow-hidden bg-tint lg:min-h-[690px]">
                        <Image
                            src="/nails/nail-02.png"
                            alt="Mẫu móng tại Serpente Nail Room"
                            fill
                            priority
                            sizes="(max-width: 1024px) 100vw, 55vw"
                            className="object-cover"
                        />
                        <div className="absolute inset-x-5 bottom-5 rounded-[20px] border border-white/70 bg-white/90 p-5 shadow-lg backdrop-blur-sm sm:inset-x-7 sm:bottom-7 sm:p-6">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                                {branch ? localizeBranchName(branch.name) : "Serpente Nail Room"}
                            </p>
                            <p className="mt-2 font-serif text-2xl">Chọn trước dịch vụ và giờ phù hợp với bạn.</p>
                            {branch ? (
                                <p className="mt-2 text-xs leading-5 text-muted">
                                    {branch.address}{branch.opening_hours ? ` · ${branch.opening_hours}` : ""}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
