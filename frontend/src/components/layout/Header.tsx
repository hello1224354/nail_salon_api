"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AUTH_CHANGED_EVENT, getAuthUser, logoutSession, restoreSession, type AuthUser } from "@/lib/auth";
import { useBranch } from "@/components/branch/BranchProvider";
import { shortBranchName } from "@/lib/studio-data";

const navigation = [
    { href: "/", label: "Trang chủ" },
    { href: "/services", label: "Bảng giá" },
    { href: "/book", label: "Đặt lịch" },
];


type BranchChoice = { id: number; name: string };

function BranchPicker({
    branches,
    selectedBranchId,
    onSelect,
    disabled,
    mobile = false,
}: {
    branches: BranchChoice[];
    selectedBranchId: number | null;
    onSelect: (id: number) => void;
    disabled: boolean;
    mobile?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const selected = branches.find((branch) => branch.id === selectedBranchId);

    useEffect(() => {
        if (!open) return;
        const dismiss = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const escape = (event: globalThis.KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };
        document.addEventListener("pointerdown", dismiss);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("pointerdown", dismiss);
            document.removeEventListener("keydown", escape);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const frame = window.requestAnimationFrame(() => {
            const options = rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
            const index = Math.max(0, branches.findIndex((branch) => branch.id === selectedBranchId));
            options?.[index]?.focus();
        });
        return () => window.cancelAnimationFrame(frame);
    }, [open, branches, selectedBranchId]);

    const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
        const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'));
        if (!options.length) return;
        const current = options.indexOf(document.activeElement as HTMLButtonElement);
        let next = current;
        if (event.key === "ArrowDown") next = (current + 1) % options.length;
        else if (event.key === "ArrowUp") next = (current - 1 + options.length) % options.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = options.length - 1;
        else return;
        event.preventDefault();
        options[next]?.focus();
    };

    return (
        <div ref={rootRef} className={mobile ? "relative w-full" : "relative h-9 w-[112px] shrink-0"}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                aria-label="Chọn chi nhánh"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                        event.preventDefault();
                        setOpen(true);
                    }
                }}
                className={mobile
                    ? "focus-ring flex min-h-11 w-full items-center justify-between gap-2 rounded-full border border-line bg-cream px-4 text-xs font-semibold text-ink disabled:opacity-50"
                    : "focus-ring flex h-full w-full items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-2 text-xs font-semibold text-ink disabled:opacity-50"}
            >
                <span className="min-w-0 truncate">{selected ? shortBranchName(selected.name) : "Chi nhánh"}</span>
                <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 shrink-0">
                    <path d="M2.25 4.25 6 8l3.75-3.75" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {open && branches.length > 0 ? (
                <div
                    role="listbox"
                    aria-label="Danh sách chi nhánh"
                    onKeyDown={moveFocus}
                    className="absolute inset-x-0 top-full z-[70] mt-2 max-h-[min(16rem,50dvh)] min-w-0 overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface p-1 shadow-[0_16px_40px_rgba(48,40,35,0.18)]"
                >
                    {branches.map((branch) => (
                        <button
                            key={branch.id}
                            type="button"
                            role="option"
                            aria-selected={branch.id === selectedBranchId}
                            tabIndex={-1}
                            onClick={() => {
                                onSelect(branch.id);
                                setOpen(false);
                                triggerRef.current?.focus();
                            }}
                            className={`focus-ring block min-h-10 w-full rounded-lg px-2 py-2 text-left text-xs font-medium leading-5 [overflow-wrap:anywhere] hover:bg-tint ${branch.id === selectedBranchId ? "bg-tint text-accent" : "text-ink"}`}
                        >
                            {shortBranchName(branch.name)}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function Logo() {
    return (
        <span className="flex items-center gap-3">
            <Image
                src="/brand/serpente-logo.svg"
                alt=""
                width={36}
                height={36}
                className="size-9 shrink-0 object-contain"
            />
            <span className="font-serif text-[22px] tracking-[-0.025em] sm:text-[25px]">Serpente Nail Room</span>
        </span>
    );
}

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const accountMenuRef = useRef<HTMLDivElement>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const { branches, selectedBranchId, setSelectedBranchId, loading: branchesLoading } = useBranch();

    useEffect(() => {
        let cancelled = false;

        const syncAuth = () => {
            if (!cancelled) setAuthUser(getAuthUser());
        };

        syncAuth();
        void restoreSession().then(syncAuth).catch(syncAuth);

        window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);

        return () => {
            cancelled = true;
            window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
        };
    }, []);

    useEffect(() => {
        const closeAccountMenu = (event: MouseEvent) => {
            if (!accountMenuRef.current?.contains(event.target as Node)) {
                setAccountOpen(false);
            }
        };

        document.addEventListener("mousedown", closeAccountMenu);
        return () => document.removeEventListener("mousedown", closeAccountMenu);
    }, []);

    async function logOut() {
        await logoutSession();
        setAccountOpen(false);
        setMobileOpen(false);
        router.push("/");
        router.refresh();
    }

    const accountInitial = authUser?.full_name.trim().charAt(0).toUpperCase() ?? "T";

    if (pathname.startsWith("/admin")) return null;

    return (
        <header className="sticky top-0 z-50 border-b border-line bg-cream/95 shadow-[0_1px_0_rgba(48,40,35,0.02)] backdrop-blur-md">
            <div className="site-shell grid h-[76px] grid-cols-[minmax(0,1fr)_auto] items-center xl:grid-cols-[1fr_auto_1fr]">
                <Link href="/" aria-label="Trang chủ Serpente Nail Room" className="focus-ring col-start-1 row-start-1 justify-self-start rounded-md" onClick={() => setMobileOpen(false)}>
                    <Logo />
                </Link>

                <nav aria-label="Điều hướng chính" className="col-start-2 row-start-1 hidden items-center gap-9 justify-self-center text-[13px] xl:flex 2xl:gap-10">
                    {navigation.map((item) => {
                        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`focus-ring relative rounded-sm py-2.5 font-medium transition-colors hover:text-accent ${active ? "text-accent" : "text-ink"}`}
                            >
                                {item.label}
                                {active ? <span className="absolute inset-x-1 -bottom-[6px] h-px bg-accent" /> : null}
                            </Link>
                        );
                    })}
                </nav>

                <div className="col-start-3 row-start-1 hidden translate-x-2 items-center justify-self-end gap-2 xl:flex">
                    {branches.length > 1 ? (
                        <BranchPicker
                            branches={branches}
                            selectedBranchId={selectedBranchId}
                            onSelect={setSelectedBranchId}
                            disabled={branchesLoading}
                        />
                    ) : null}

                    {authUser ? (
                        <>
                            <Link href="/book" className="focus-ring flex h-9 min-w-[126px] items-center justify-center rounded-full bg-ink px-4 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(45,39,35,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-[0_9px_22px_rgba(45,39,35,0.16)]">
                                Đặt lịch ngay
                            </Link>

                            <div ref={accountMenuRef} className="relative">
                            <button
                                type="button"
                                aria-expanded={accountOpen}
                                aria-haspopup="menu"
                                onClick={() => setAccountOpen((value) => !value)}
                                className={`focus-ring flex h-9 min-w-[126px] items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors ${accountOpen ? "bg-tint text-accent" : "text-ink hover:bg-tint/70 hover:text-accent"}`}
                            >
                                <span className="flex size-6 items-center justify-center rounded-full bg-tint font-serif text-[11px] text-accent">
                                    {accountInitial}
                                </span>
                                <span>Tài khoản</span>
                                <svg aria-hidden="true" viewBox="0 0 12 12" className={`size-3 transition-transform ${accountOpen ? "rotate-180" : ""}`}>
                                    <path d="M2.25 4.25 6 8l3.75-3.75" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {accountOpen ? (
                                <div role="menu" className="motion-menu absolute right-0 top-[calc(100%+12px)] w-64 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-[0_18px_50px_rgba(48,40,35,0.14)]">
                                    <div className="px-3 pb-3 pt-2">
                                        <p className="truncate text-sm font-semibold text-ink">{authUser.full_name}</p>
                                        <p className="mt-1 truncate text-xs text-muted">{authUser.email || "Chưa có email"}</p>
                                    </div>
                                    <div className="h-px bg-line" />
                                    {authUser?.role.toLowerCase() === "staff" ? (
                                        <Link href="/staff" role="menuitem" onClick={() => setAccountOpen(false)}
                                            className="focus-ring mt-1 block rounded-xl px-3 py-2.5 text-xs font-semibold text-ink hover:bg-tint">
                                            Khu vực nhân viên
                                        </Link>
                                    ) : null}
                                    {authUser?.role.toLowerCase() === "admin" ? (
                                        <Link href="/admin" role="menuitem" onClick={() => setAccountOpen(false)}
                                            className="focus-ring mt-1 block rounded-xl px-3 py-2.5 text-xs font-semibold text-ink hover:bg-tint">
                                            Trang quản trị
                                        </Link>
                                    ) : null}
                                    <Link
                                        href="/appointments"
                                        role="menuitem"
                                        onClick={() => setAccountOpen(false)}
                                        className="focus-ring mt-1 block rounded-xl px-3 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-tint"
                                    >
                                        Lịch của tôi
                                    </Link>
                                    <Link
                                        href="/account/security"
                                        role="menuitem"
                                        onClick={() => setAccountOpen(false)}
                                        className="focus-ring block rounded-xl px-3 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-tint"
                                    >
                                        Bảo mật tài khoản
                                    </Link>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={logOut}
                                        className="focus-ring w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-accent transition-colors hover:bg-tint"
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            ) : null}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                            className={`focus-ring flex h-9 items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors hover:bg-tint hover:text-accent ${pathname.startsWith("/login") || pathname.startsWith("/register") ? "bg-tint text-accent" : "text-ink"}`}
                            >
                                Đăng nhập
                            </Link>

                            <Link href="/book" className="focus-ring flex h-9 min-w-[126px] items-center justify-center rounded-full bg-ink px-4 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(45,39,35,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-[0_9px_22px_rgba(45,39,35,0.16)]">
                                Đặt lịch ngay
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="focus-ring col-start-2 row-start-1 flex size-10 items-center justify-center justify-self-end rounded-full border border-line bg-surface xl:hidden"
                    aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen((value) => !value)}
                >
                    <span className="relative block h-3.5 w-4">
                        <span className={`absolute left-0 top-0 h-px w-4 bg-ink transition-transform ${mobileOpen ? "translate-y-[6px] rotate-45" : ""}`} />
                        <span className={`absolute left-0 top-[6px] h-px w-4 bg-ink transition-opacity ${mobileOpen ? "opacity-0" : "opacity-100"}`} />
                        <span className={`absolute bottom-0 left-0 h-px w-4 bg-ink transition-transform ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
                    </span>
                </button>
            </div>

            {mobileOpen ? (
                <div className="motion-menu border-t border-line bg-cream pb-6 pt-4 xl:hidden">
                    <nav aria-label="Điều hướng trên điện thoại" className="site-shell flex flex-col gap-1">
                        {navigation.map((item) => {
                            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`focus-ring rounded-xl px-4 py-3 text-sm ${active ? "bg-tint font-semibold text-accent" : "hover:bg-white/60"}`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}

                        {branches.length > 1 ? (
                            <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
                                <p className="mb-2 block px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Chi nhánh</p>
                                <BranchPicker
                                    mobile
                                    branches={branches}
                                    selectedBranchId={selectedBranchId}
                                    onSelect={setSelectedBranchId}
                                    disabled={branchesLoading}
                                />
                            </div>
                        ) : null}

                        {authUser ? (
                            <Link
                                href="/book"
                                onClick={() => setMobileOpen(false)}
                                className="focus-ring mt-3 rounded-full bg-ink px-5 py-3.5 text-center text-xs font-semibold text-white"
                            >
                                Đặt lịch ngay
                            </Link>
                        ) : null}

                        <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
                            {authUser ? (
                                <div>
                                    <div className="flex items-center gap-3 px-1 pb-3">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint font-serif text-sm text-accent">{accountInitial}</span>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold text-ink">{authUser.full_name}</p>
                                            <p className="mt-0.5 truncate text-[11px] text-muted">{authUser.email || "Chưa có email"}</p>
                                        </div>
                                    </div>
                                    {authUser.role.toLowerCase() === "staff" ? (
                                        <Link
                                            href="/staff"
                                            onClick={() => setMobileOpen(false)}
                                            className="focus-ring mb-2 block w-full rounded-full border border-line px-5 py-3 text-center text-xs font-semibold text-ink"
                                        >
                                            Khu vực nhân viên
                                        </Link>
                                    ) : null}
                                    <Link
                                        href="/appointments"
                                        onClick={() => setMobileOpen(false)}
                                        className="focus-ring mb-2 block w-full rounded-full border border-line px-5 py-3 text-center text-xs font-semibold text-ink"
                                    >
                                        Lịch của tôi
                                    </Link>
                                    <Link
                                        href="/account/security"
                                        onClick={() => setMobileOpen(false)}
                                        className="focus-ring mb-2 block w-full rounded-full border border-line px-5 py-3 text-center text-xs font-semibold text-ink"
                                    >
                                        Bảo mật tài khoản
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={logOut}
                                        className="focus-ring w-full rounded-full border border-line px-5 py-3 text-center text-xs font-semibold text-accent"
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="focus-ring block rounded-full border border-line px-5 py-3 text-center text-xs font-semibold text-ink"
                                >
                                    Đăng nhập
                                </Link>
                            )}
                        </div>

                        {!authUser ? (
                            <Link
                                href="/book"
                                onClick={() => setMobileOpen(false)}
                                className="focus-ring mt-3 rounded-full bg-ink px-5 py-3.5 text-center text-xs font-semibold text-white"
                            >
                                Đặt lịch ngay
                            </Link>
                        ) : null}
                    </nav>
                </div>
            ) : null}
        </header>
    );
}
