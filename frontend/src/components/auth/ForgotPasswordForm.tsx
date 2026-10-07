"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { apiRequest, getApiErrorMessage } from "@/lib/api";

type Step = "request" | "verify" | "success";

export function ForgotPasswordForm() {
    const [step, setStep] = useState<Step>("request");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    async function requestCode() {
        await apiRequest<null>("/api/users/password/forgot", {
            method: "POST",
            body: JSON.stringify({ email }),
        });

        setStep("verify");
        setNotice("Nếu email khớp với tài khoản đã đăng ký, bạn sẽ nhận được mã OTP gồm 6 số. Mã dùng được trong 5 phút.");
    }

    async function handleRequest(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setNotice("");
        setSubmitting(true);

        try {
            await requestCode();
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, "Chưa gửi được mã xác nhận. Vui lòng thử lại."));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleReset(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setNotice("");

        if (password.length < 8) {
            setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Xác nhận mật khẩu không khớp.");
            return;
        }

        setSubmitting(true);

        try {
            await apiRequest<null>("/api/users/password/reset", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    code,
                    new_password: password,
                }),
            });

            setStep("success");
            setCode("");
            setPassword("");
            setConfirmPassword("");
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, "Chưa đổi được mật khẩu. Vui lòng thử lại."));
        } finally {
            setSubmitting(false);
        }
    }

    async function resendCode() {
        setError("");
        setNotice("");
        setSubmitting(true);

        try {
            await requestCode();
            setCode("");
            setNotice("Nếu email khớp với tài khoản đã đăng ký, một mã mới sẽ được gửi. Hãy dùng mã mới nhất trong hộp thư.");
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, "Chưa gửi lại được mã. Vui lòng thử lại sau."));
        } finally {
            setSubmitting(false);
        }
    }

    if (step === "success") {
        return (
            <div className="mt-8">
                <div className="rounded-2xl border border-[#aac6b3] bg-[#edf7f0] p-5 text-sm leading-6 text-[#315c40]">
                    Mật khẩu đã được đặt lại. Tất cả phiên đăng nhập cũ đã bị thu hồi.
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link
                        href="/login"
                        className="focus-ring flex h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white"
                    >
                        Đăng nhập khách hàng
                    </Link>
                    <Link
                        href="/admin/login"
                        className="focus-ring flex h-12 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink"
                    >
                        Đăng nhập quản trị
                    </Link>
                </div>
            </div>
        );
    }

    if (step === "verify") {
        return (
            <form onSubmit={handleReset} className="mt-8 space-y-5" noValidate>
                <div className="rounded-xl border border-line bg-tint/45 px-4 py-3 text-xs leading-5 text-muted">
                    {notice || "Nhập mã OTP đã gửi tới email của bạn."}
                </div>

                <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Email</span>
                    <input
                        value={email}
                        type="email"
                        autoComplete="email"
                        readOnly
                        className="mt-2.5 h-12 w-full rounded-xl border border-line bg-[#f3f0ec] px-4 text-sm text-muted outline-none"
                    />
                </label>

                <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Mã OTP</span>
                    <input
                        value={code}
                        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        required
                        className="focus-ring mt-2.5 h-12 w-full rounded-xl border border-line bg-cream px-4 text-center text-lg tracking-[0.35em] text-ink outline-none"
                    />
                </label>

                <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Mật khẩu mới</span>
                    <span className="relative mt-2.5 block">
                        <input
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            minLength={8}
                            required
                            className="focus-ring h-12 w-full rounded-xl border border-line bg-cream px-4 pr-20 text-sm text-ink outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-semibold text-accent"
                        >
                            {showPassword ? "Ẩn" : "Hiện"}
                        </button>
                    </span>
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

                {error ? (
                    <div role="alert" className="rounded-xl border border-[#cdaea1] bg-[#f5e8e1] px-4 py-3 text-xs leading-5 text-[#734738]">
                        {error}
                    </div>
                ) : null}

                <button
                    type="submit"
                    disabled={submitting || code.length !== 6 || password.length < 8 || confirmPassword.length < 8}
                    className="focus-ring flex h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting ? "Đang cập nhật…" : "Đặt mật khẩu mới"}
                </button>

                <div className="flex items-center justify-between gap-4 text-xs">
                    <button type="button" disabled={submitting} onClick={() => void resendCode()} className="font-semibold text-accent disabled:opacity-50">
                        Gửi lại mã
                    </button>
                    <button type="button" onClick={() => { setStep("request"); setError(""); setNotice(""); }} className="font-semibold text-muted">
                        Đổi email
                    </button>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleRequest} className="mt-8 space-y-5" noValidate>
            <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Email tài khoản</span>
                <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="ten@email.com"
                    required
                    className="focus-ring mt-2.5 h-12 w-full rounded-xl border border-line bg-cream px-4 text-sm text-ink outline-none"
                />
            </label>

            <p className="text-xs leading-5 text-muted">
                Nếu email khớp với tài khoản đã đăng ký, mã xác nhận sẽ được gửi vào hộp thư đó.
            </p>

            {error ? (
                <div role="alert" className="rounded-xl border border-[#cdaea1] bg-[#f5e8e1] px-4 py-3 text-xs leading-5 text-[#734738]">
                    {error}
                </div>
            ) : null}

            <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="focus-ring flex h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? "Đang gửi…" : "Gửi mã OTP"}
            </button>

            <div className="flex justify-between gap-4 text-xs">
                <Link href="/login" className="font-semibold text-accent">← Quay lại đăng nhập</Link>
                <Link href="/admin/login" className="font-semibold text-accent">Dành cho quản trị →</Link>
            </div>
        </form>
    );
}
