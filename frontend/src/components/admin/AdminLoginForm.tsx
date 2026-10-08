"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { apiRequest, getApiErrorMessage } from "@/lib/api";
import { logoutSession, saveSession, type AuthUser } from "@/lib/auth";

type PasswordLoginData =
    | {
          access_token: string;
          user: AuthUser;
          mfa_required?: false;
      }
    | {
          mfa_required: true;
          challenge_id: string;
          masked_email: string;
          expires_at: string;
          user: AuthUser;
      };

type VerifiedLoginData = {
    access_token: string;
    user: AuthUser;
};

export function AdminLoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [challengeId, setChallengeId] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function completeAdminLogin(data: VerifiedLoginData) {
        if (data.user.role.toLowerCase() !== "admin") {
            await logoutSession();
            throw new Error("Tài khoản này không có quyền quản trị.");
        }

        saveSession(data.access_token, data.user);
        router.replace("/admin");
        router.refresh();
    }

    async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const data = await apiRequest<PasswordLoginData>("/api/users/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            if (data.user.role.toLowerCase() !== "admin") {
                if ("access_token" in data) await logoutSession();
                throw new Error("Tài khoản này không có quyền quản trị.");
            }

            if ("mfa_required" in data && data.mfa_required) {
                setChallengeId(data.challenge_id);
                setMaskedEmail(data.masked_email);
                setOtp("");
                setPassword("");
                return;
            }

            await completeAdminLogin(data);
        } catch (submitError) {
            setError(
                getApiErrorMessage(
                    submitError,
                    submitError instanceof Error ? submitError.message : "Chưa đăng nhập được."
                )
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const data = await apiRequest<VerifiedLoginData>("/api/users/login/mfa/verify", {
                method: "POST",
                body: JSON.stringify({
                    challenge_id: challengeId,
                    code: otp,
                }),
            });

            await completeAdminLogin(data);
        } catch (submitError) {
            setError(
                getApiErrorMessage(
                    submitError,
                    "Mã OTP không đúng hoặc đã hết hạn."
                )
            );
        } finally {
            setSubmitting(false);
        }
    }

    function restartLogin() {
        setChallengeId("");
        setMaskedEmail("");
        setOtp("");
        setPassword("");
        setError("");
    }

    if (challengeId) {
        return (
            <form onSubmit={handleOtpSubmit} className="mt-8 space-y-5" noValidate>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-xs leading-5 text-white/65">
                    Mã OTP 6 số đã được gửi tới <span className="font-semibold text-white">{maskedEmail}</span>.
                    Mã hết hạn sau 5 phút.
                </div>

                <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                        Mã xác nhận
                    </span>
                    <input
                        value={otp}
                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        className="mt-2.5 h-12 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 text-center text-lg tracking-[0.35em] text-white outline-none transition placeholder:text-white/25 focus:border-[#c9aa96]"
                        required
                        pattern="\d{6}"
                    />
                </label>

                {error ? (
                    <div className="rounded-xl border border-[#8b5b50]/60 bg-[#5f3730]/35 px-4 py-3 text-xs leading-5 text-[#f0cfc5]">
                        {error}
                    </div>
                ) : null}

                <button
                    type="submit"
                    disabled={submitting || otp.length !== 6}
                    className="flex h-12 w-full items-center justify-center rounded-full bg-[#f5eee8] px-5 text-sm font-semibold text-[#302823] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting ? "Đang xác nhận…" : "Xác nhận OTP"}
                </button>

                <button
                    type="button"
                    onClick={restartLogin}
                    className="w-full text-center text-xs font-semibold text-white/55 transition hover:text-white"
                >
                    ← Nhập lại tài khoản
                </button>
            </form>
        );
    }

    return (
        <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-5" noValidate>
            <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                    Email
                </span>
                <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
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
                disabled={submitting || !email.trim() || !password}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#f5eee8] px-5 text-sm font-semibold text-[#302823] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? "Đang kiểm tra…" : "Tiếp tục"}
            </button>

            <div className="text-right">
                <Link href="/forgot-password" className="text-xs font-semibold text-[#d5b9a7] transition hover:text-white">
                    Quên mật khẩu?
                </Link>
            </div>
        </form>
    );
}
