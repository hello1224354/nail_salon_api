"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { apiRequest, getApiErrorMessage } from "@/lib/api";
import { saveSession, type AuthUser } from "@/lib/auth";

type LoginData = {
    access_token: string;
    user: AuthUser;
};

export function AdminLoginForm() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const data = await apiRequest<LoginData>("/api/users/login", {
                method: "POST",
                body: JSON.stringify({ phone, password }),
            });

            if (data.user.role.toLowerCase() !== "admin") {
                throw new Error("Tài khoản này không có quyền quản trị.");
            }

            saveSession(data.access_token, data.user);
            router.replace("/admin");
            router.refresh();
        } catch (submitError) {
            setError(
                getApiErrorMessage(
                    submitError,
                    submitError instanceof Error ? submitError.message : "Không thể đăng nhập."
                )
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                    Số điện thoại
                </span>
                <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0901 234 567"
                    className="mt-2.5 h-12 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c9aa96]"
                    required
                />
            </label>

            <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                    Mật khẩu
                </span>
                <span className="relative mt-2.5 block">
                    <input
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Nhập mật khẩu"
                        className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 pr-20 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c9aa96]"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-semibold text-[#d5b9a7]"
                    >
                        {showPassword ? "Ẩn" : "Hiện"}
                    </button>
                </span>
            </label>

            {error ? (
                <div className="rounded-xl border border-[#8b5b50]/60 bg-[#5f3730]/35 px-4 py-3 text-xs leading-5 text-[#f0cfc5]">
                    {error}
                </div>
            ) : null}

            <button
                type="submit"
                disabled={submitting || !phone.trim() || !password}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#f5eee8] px-5 text-sm font-semibold text-[#302823] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? "Đang đăng nhập…" : "Vào trang quản trị"}
            </button>
        </form>
    );
}
