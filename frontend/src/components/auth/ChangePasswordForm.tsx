"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiRequest, getApiErrorMessage } from "@/lib/api";
import { clearSession, getAuthUser, restoreSession, type AuthUser } from "@/lib/auth";

export function ChangePasswordForm({ admin = false }: { admin?: boolean }) {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [ready, setReady] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            const restored = await restoreSession();
            const currentUser = getAuthUser();

            if (!restored || !currentUser) {
                router.replace(admin ? "/admin/login" : "/login");
                return;
            }

            if (admin && currentUser.role.toLowerCase() !== "admin") {
                router.replace("/login");
                return;
            }

            if (!cancelled) {
                setUser(currentUser);
                setReady(true);
            }
        }

        void bootstrap();

        return () => {
            cancelled = true;
        };
    }, [admin, router]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (newPassword.length < 8) {
            setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Xác nhận mật khẩu không khớp.");
            return;
        }

        if (currentPassword === newPassword) {
            setError("Mật khẩu mới phải khác mật khẩu hiện tại.");
            return;
        }

        setSubmitting(true);

        try {
            await apiRequest<null>("/api/users/password/change", {
                method: "POST",
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });

            clearSession();
            router.replace(admin ? "/admin/login?password_changed=1" : "/login?password_changed=1");
            router.refresh();
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, "Chưa đổi được mật khẩu. Vui lòng thử lại."));
        } finally {
            setSubmitting(false);
        }
    }

    if (!ready) {
        return <div className="mt-8 h-72 animate-pulse rounded-2xl border border-line bg-white/50" />;
    }

    return (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div className="rounded-xl border border-line bg-tint/40 px-4 py-3 text-xs leading-5 text-muted">
                Tài khoản đang đổi mật khẩu: <span className="font-semibold text-ink">{user?.full_name}</span>. Sau khi đổi xong, tài khoản sẽ được đăng xuất khỏi tất cả thiết bị.
            </div>

            <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Mật khẩu hiện tại</span>
                <input
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="focus-ring mt-2.5 h-12 w-full rounded-xl border border-line bg-cream px-4 text-sm text-ink outline-none"
                />
            </label>

            <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Mật khẩu mới</span>
                <input
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="focus-ring mt-2.5 h-12 w-full rounded-xl border border-line bg-cream px-4 text-sm text-ink outline-none"
                />
            </label>

            <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Nhập lại mật khẩu mới</span>
                <input
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="focus-ring mt-2.5 h-12 w-full rounded-xl border border-line bg-cream px-4 text-sm text-ink outline-none"
                />
            </label>

            <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
                Hiện mật khẩu
            </label>

            {error ? (
                <div role="alert" className="rounded-xl border border-[#cdaea1] bg-[#f5e8e1] px-4 py-3 text-xs leading-5 text-[#734738]">
                    {error}
                </div>
            ) : null}

            <button
                type="submit"
                disabled={submitting || !currentPassword || newPassword.length < 8 || confirmPassword.length < 8}
                className="focus-ring flex h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? "Đang đổi mật khẩu…" : "Đổi mật khẩu"}
            </button>

            <div className="flex items-center justify-between text-xs">
                <Link href="/forgot-password" className="font-semibold text-accent">Quên mật khẩu?</Link>
                <Link href={admin ? "/admin" : "/"} className="font-semibold text-muted">Quay lại</Link>
            </div>
        </form>
    );
}
