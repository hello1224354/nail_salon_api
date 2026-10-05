import Link from "next/link";

export default function NotFound() {
    return (
        <section className="site-shell flex min-h-[62vh] items-center py-16">
            <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">404 · Không tìm thấy trang</p>
                <h1 className="mt-4 font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-6xl">Trang này không còn ở đây.</h1>
                <p className="mt-5 max-w-lg text-sm leading-6 text-muted">
                    Đường dẫn có thể đã thay đổi. Quay về trang chủ hoặc tiếp tục xem dịch vụ của salon.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/" className="focus-ring rounded-full bg-ink px-6 py-3 text-xs font-semibold text-white">Về trang chủ</Link>
                    <Link href="/services" className="focus-ring rounded-full border border-line bg-surface px-6 py-3 text-xs font-semibold">Xem dịch vụ</Link>
                </div>
            </div>
        </section>
    );
}
