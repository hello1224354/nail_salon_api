"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { apiRequest, getApiErrorMessage } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

export function RegisterForm() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            await apiRequest<AuthUser>("/api/users/register", {
                method: "POST",
                body: JSON.stringify({
                    full_name: fullName,
                    phone,
                    email: email.trim() || null,
                    password,
                }),
            });

            router.push("/login");
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, "Chưa tạo được tài khoản. Vui lòng kiểm tra lại thông tin."));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-8" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Họ và tên</span>
                    <input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                        required
                        className="focus-ring mt-2.5 h-12 w-full rounded-[12px] border border-line bg-cream px-4 text-sm outline-none placeholder:text-muted/45 hover:border-accent/45"
                    />
                </label>

                <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Số điện thoại</span>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+84 912 345 678"
                        autoComplete="tel"
                        inputMode="tel"
                        required
                        className="focus-ring mt-2.5 h-12 w-full rounded-[12px] border border-line bg-cream px-4 text-sm outline-none placeholder:text-muted/45 hover:border-accent/45"
                    />
                </label>

                <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Email (không bắt buộc)</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="ten@example.com"
                        autoComplete="email"
                        className="focus-ring mt-2.5 h-12 w-full rounded-[12px] border border-line bg-cream px-4 text-sm outline-none placeholder:text-muted/45 hover:border-accent/45"
                    />
                </label>

                <label className="block sm:col-span-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Mật khẩu</span>
                    <span className="relative mt-2.5 block">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Tối thiểu 8 ký tự"
                            autoComplete="new-password"
                            required
                            minLength={8}
                            className="focus-ring h-12 w-full rounded-[12px] border border-line bg-cream px-4 pr-20 text-sm outline-none placeholder:text-muted/45 hover:border-accent/45"
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
            </div>

            {error ? (
                <div role="alert" className="mt-5 rounded-[12px] border border-[#cdaea1] bg-[#f5e8e1] px-4 py-3 text-xs leading-5 text-[#734738]">
                    {error}
                </div>
            ) : null}

            <button
                type="submit"
                disabled={submitting || !fullName.trim() || !phone.trim() || password.length < 8}
                className="focus-ring mt-7 flex h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
            </button>

            <p className="mt-5 text-xs text-muted">
                Đã có tài khoản?{" "}
                <Link href="/login" className="focus-ring rounded-sm font-semibold text-accent underline decoration-accent/30 underline-offset-4 hover:text-ink">
                    Đăng nhập
                </Link>
            </p>
        </form>
    );
}
