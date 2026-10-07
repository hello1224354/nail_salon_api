"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <section className="site-shell flex min-h-[62vh] items-center py-16">
            <div className="max-w-2xl rounded-[24px] border border-line bg-surface p-7 sm:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Đã xảy ra lỗi</p>
                <h1 className="mt-4 font-serif text-4xl tracking-[-0.03em] sm:text-5xl">Trang này đang gặp sự cố.</h1>
                <p className="mt-4 text-sm leading-6 text-muted">Bạn có thể thử lại ngay. Nếu vẫn chưa được, hãy quay lại sau ít phút.</p>
                <button type="button" onClick={reset} className="focus-ring mt-7 rounded-full bg-ink px-6 py-3 text-xs font-semibold text-white">
                    Thử lại
                </button>
            </div>
        </section>
    );
}
