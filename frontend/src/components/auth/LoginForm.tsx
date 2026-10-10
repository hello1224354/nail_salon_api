"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { apiRequest, getApiErrorMessage } from "@/lib/api";
import { saveSession, type AuthUser } from "@/lib/auth";

type SessionLoginData = {
    mfa_required?: false;
    access_token: string;
    user: AuthUser;
};
type MfaLoginData = {
    mfa_required: true;
    challenge_id: string;
    masked_email: string;
    expires_at: string;
    user: AuthUser;
};
type LoginData = SessionLoginData | MfaLoginData;

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [challengeId, setChallengeId] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const data = await apiRequest<LoginData>("/api/users/login", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password,
                    remember_me: rememberMe,
                }),
            });

            if ("mfa_required" in data && data.mfa_required) {
                if (!["customer", "admin", "staff"].includes(data.user.role.toLowerCase())) {
                    throw new Error("Tài khoản này không được phép đăng nhập tại đây.");
                }
                setChallengeId(data.challenge_id);
                setMaskedEmail(data.masked_email);
                setOtp("");
                setPassword("");
                return;
            }

            saveSession(data.access_token, data.user);
            router.push(data.user.role.toLowerCase() === "staff" ? "/staff" : "/book");
            router.refresh();
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, submitError instanceof Error ? submitError.message : "Chưa đăng nhập được. Vui lòng kiểm tra thông tin và thử lại."));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!challengeId || otp.length !== 6) return;
        setError("");
        setSubmitting(true);

        try {
            const data = await apiRequest<SessionLoginData>("/api/users/login/mfa/verify", {
                method: "POST",
                body: JSON.stringify({ challenge_id: challengeId, code: otp }),
            });

            if (!["customer", "admin", "staff"].includes(data.user.role.toLowerCase())) {
                throw new Error("Vai trò tài khoản không hợp lệ.");
            }

            saveSession(data.access_token, data.user);
            router.push(data.user.role.toLowerCase() === "staff" ? "/staff" : "/book");
            router.refresh();
        } catch (submitError) {
            setError(getApiErrorMessage(
                submitError,
                submitError instanceof Error ? submitError.message : "Mã OTP không hợp lệ.",
            ));
        } finally {
            setSubmitting(false);
        }
    }

    if (challengeId) {
        return (
            <form onSubmit={handleOtpSubmit} className="mt-9 space-y-5" noValidate>
                <div className="rounded-xl border border-line bg-cream p-4 text-xs leading-5 text-muted">
                    Mã OTP 6 số đã được gửi tới <strong className="text-ink">{maskedEmail}</strong>.
                    Mã có hiệu lực trong 5 phút.
                </div>
                <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        Mã xác nhận
                    </span>
                    <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value.replace(/\\D/g, "").slice(0, 6))}
                        maxLength={6}
                        pattern="\\d{6}"
                        required
                        placeholder="000000"
                        className="focus-ring mt-2.5 h-12 w-full rounded-[12px] border border-line bg-cream px-4 text-center text-lg tracking-[0.25em] text-ink outline-none"
                    />
                </label>
                {error ? <div role="alert" className="rounded-xl border border-[#cdaea1] bg-[#f5e8e1] px-4 py-3 text-xs leading-5 text-[#734738]">{error}</div> : null}
                <button
                    type="submit"
                    disabled={submitting || otp.length !== 6}
                    className="focus-ring flex h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {submitting ? "Đang xác minh…" : "Xác nhận OTP"}
                </button>
                <button type="button" onClick={() => {
                    setChallengeId("");
                    setMaskedEmail("");
                    setOtp("");
                    setError("");
                }} className="focus-ring w-full text-center text-xs font-semibold text-accent hover:underline">
                    ← Nhập lại email và mật khẩu
                </button>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-9" noValidate>
            <div className="space-y-5">
                <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Email</span>
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="ten@example.com"
                        autoComplete="email"
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

                <div className="flex items-center justify-between gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(event) => setRememberMe(event.target.checked)}
                            className="accent-[#986a58]"
                        />
                        Ghi nhớ đăng nhập
                    </label>
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
                disabled={submitting || email.trim().length === 0 || password.length === 0}
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
