"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { apiRequest, getApiErrorMessage } from "@/lib/api";
import { logoutSession, saveSession, type AuthUser } from "@/lib/auth";

type LoginData = {
    access_token: string;
    user: AuthUser;
};

export function LoginForm() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const data = await apiRequest<LoginData>("/api/users/login", {
                method: "POST",
                body: JSON.stringify({
                    phone,
                    password,
                }),
            });

            if (data.user.role.toLowerCase() !== "customer") {
                await logoutSession();
                throw new Error("Trang đặt lịch này chỉ dành cho tài khoản khách hàng.");
            }

            saveSession(data.access_token, data.user);
            router.push("/book");
            router.refresh();
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, submitError instanceof Error ? submitError.message : "Không thể đăng nhập. Vui lòng thử lại."));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-9" noValidate>
            <div className="space-y-5">
                <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Số điện thoại</span>
                    <input
                        type="tel"
                        name="phone"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+84 912 345 678"
                        autoComplete="tel"
                        inputMode="tel"
                        required
                        className="focus-ring mt-2.5 h-12 w-full rounded-[12px] border border-line bg-cream px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted/45 hover:border-accent/45"
                    />
                </label>

                <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Mật khẩu</span>
                    <span className="relative mt-2.5 block">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Nhập mật khẩu"
                            autoComplete="current-password"
                            required
                            className="focus-ring h-12 w-full rounded-[12px] border border-line bg-cream px-4 pr-20 text-sm text-ink outline-none transition-colors placeholder:text-muted/45 hover:border-accent/45"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-semibold text-accent hover:text-ink"
                            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                            {showPassword ? "Ẩn" : "Hiện"}
                        </button>
                    </span>
                </label>

                <div className="flex justify-end">
                    <Link href="/forgot-password" className="focus-ring rounded-sm text-xs font-semibold text-accent underline decoration-accent/30 underline-offset-4 hover:text-ink">
                        Quên mật khẩu?
                    </Link>
                </div>
            </div>

            {error ? (
                <div role="alert" className="mt-5 rounded-[12px] border border-[#cdaea1] bg-[#f5e8e1] px-4 py-3 text-xs leading-5 text-[#734738]">
                    {error}
                </div>
            ) : null}

            <button
                type="submit"
                disabled={submitting || phone.trim().length === 0 || password.length === 0}
                className="focus-ring mt-7 flex h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>

            <div className="mt-5 flex flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
                <span>
                    Chưa có tài khoản?{" "}
                    <Link href="/register" className="focus-ring rounded-sm font-semibold text-accent underline decoration-accent/30 underline-offset-4 hover:text-ink">
                        Tạo tài khoản
                    </Link>
                </span>
                <Link href="/services" className="focus-ring shrink-0 rounded-sm font-semibold text-accent underline decoration-accent/30 underline-offset-4 hover:text-ink">
                    Xem dịch vụ
                </Link>
            </div>
        </form>
    );
}
