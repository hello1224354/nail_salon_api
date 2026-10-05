import Link from "next/link";

export function Header() {
    return (
        <header className="border-b border-black/10 bg-background">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-3">
                    <span className="font-serif text-2xl">NS</span>
                    <span className="text-sm font-semibold tracking-wide">
                        Nail Studio
                    </span>
                </Link>

                <nav className="flex items-center gap-8 text-sm">
                    <Link href="/">Home</Link>
                    <Link href="/services">Services</Link>
                    <Link href="/book">Book</Link>
                    <span>District 1</span>

                    <Link
                        href="/book"
                        className="rounded-full bg-black px-5 py-2.5 text-white"
                    >
                        Book now
                    </Link>
                </nav>
            </div>
        </header>
    );
}