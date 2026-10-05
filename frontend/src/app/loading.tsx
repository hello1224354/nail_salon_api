export default function Loading() {
    return (
        <section className="site-shell py-12 lg:py-16" aria-label="Đang tải trang">
            <div className="h-3 w-32 animate-pulse rounded-full bg-tint" />
            <div className="mt-5 h-14 max-w-md animate-pulse rounded-[18px] bg-tint sm:h-16" />
            <div className="mt-4 h-5 max-w-xl animate-pulse rounded-full bg-tint" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                    <div key={index} className="h-[260px] animate-pulse rounded-[22px] border border-line bg-surface" />
                ))}
            </div>
        </section>
    );
}
