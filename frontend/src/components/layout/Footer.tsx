"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { studio } from "@/lib/studio-data";

export function Footer() {
    const pathname = usePathname();

    if (pathname.startsWith("/admin")) return null;

    return (
        <footer className="bg-studio-dark text-white">
            <div className="site-shell py-12 lg:py-14">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_1fr] lg:gap-16">
                    <div className="md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <span className="flex size-8 items-center justify-center rounded-full border border-[#bba18e] font-serif text-[11px]">
                                NS
                            </span>
                            <span className="font-serif text-2xl">Nail Studio</span>
                        </div>
                        <p className="mt-3 text-sm text-[#cdbfb3]">
                            Chăm sóc móng, chu đáo trong từng khoảnh khắc.
                        </p>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bba18e]">
                            Khám phá
                        </p>
                        <nav className="mt-4 flex flex-col gap-2.5 text-sm">
                            <Link className="w-fit hover:text-[#d8c2b5]" href="/">
                                Trang chủ
                            </Link>
                            <Link className="w-fit hover:text-[#d8c2b5]" href="/services">
                                Dịch vụ
                            </Link>
                            <Link className="w-fit hover:text-[#d8c2b5]" href="/book">
                                Đặt lịch
                            </Link>
                        </nav>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bba18e]">
                            Quận 1
                        </p>
                        <div className="mt-4 space-y-2.5 text-sm text-white/90">
                            <a
                                href={studio.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-fit hover:text-[#d8c2b5]"
                            >
                                {studio.address}
                            </a>
                            <p>{studio.hours}</p>
                            <a className="block w-fit hover:text-[#d8c2b5]" href={studio.phoneHref}>
                                {studio.phoneDisplay}
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-2 border-t border-white/15 pt-5 text-[11px] text-[#bfb0a4] sm:flex-row sm:items-center sm:justify-between">
                    <span>© 2026 Nail Studio</span>
                    <span>Đặt lịch khách hàng · Xác nhận qua điện thoại</span>
                </div>
            </div>
        </footer>
    );
}
