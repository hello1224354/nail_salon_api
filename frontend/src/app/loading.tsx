export default function Loading() {
    return (
        <section className="site-shell py-12 lg:py-16" aria-label="Đang tải trang">
            <div className="skeleton h-3 w-32 rounded-full" />
            <div className="skeleton mt-5 h-14 max-w-md rounded-[18px] sm:h-16" />
            <div className="skeleton mt-4 h-5 max-w-xl rounded-full" />
            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                    <div
                        key={index}
                        className="skeleton h-[260px] rounded-[22px] border border-line"
                        style={{ animationDelay: `${index * 70}ms` }}
                    />
                ))}
            </div>
        </section>
    );
}
