import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-black/10 bg-background">
            <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3">
                <div>
                    <div className="font-serif text-2xl">NS Nail Studio</div>
                    <p className="mt-3 text-sm text-black/60">
                        Nail care, thoughtfully timed.
                    </p>
                </div>

                <div>
                    <div className="text-xs font-semibold uppercase tracking-widest">
                        Explore
                    </div>

                    <nav className="mt-4 flex flex-col gap-2 text-sm">
                        <Link href="/">Home</Link>
                        <Link href="/services">Services</Link>
                        <Link href="/book">Book</Link>
                    </nav>
                </div>

                <div>
                    <div className="text-xs font-semibold uppercase tracking-widest">
                        District 1
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-black/60">
                        <p>12 Le Loi, Ho Chi Minh City</p>
                        <p>Daily 09:00–21:00</p>
                        <p>+84 28 1234 5678</p>
                    </div>
                </div>
            </div>

            <div className="border-t border-black/10 px-6 py-5 text-center text-xs text-black/50">
                © 2026 Nail Studio
            </div>
        </footer>
    );
}