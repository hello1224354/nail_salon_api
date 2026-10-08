"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { apiRequest, getApiErrorMessage } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

type VerificationData = {
    masked_email: string;
    expires_at: string;
};

export function RegisterForm() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [error, setError] = useState("");

    function detailsAreValid() {
        if (!fullName.trim()) {
            setError("Vui lòng nhập họ và tên.");
            return false;
        }

        if (!email.trim()) {
            setError("Vui lòng nhập email.");
            return false;
        }

        if (password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự.");
            return false;
        }

        return true;
    }

    async function requestCode() {
        setError("");
        if (!detailsAreValid()) return;

        setSendingCode(true);

        try {
            const data = await apiRequest<VerificationData>("/api/users/register/code", {
                method: "POST",
                body: JSON.stringify({
                    email: email.trim(),
                }),
            });

            setMaskedEmail(data.masked_email);
            setVerificationCode("");
            setCodeSent(true);
        } catch (submitError) {
            setError(
                getApiErrorMessage(
                    submitError,
                    "Chưa gửi được mã xác minh. Vui lòng thử lại."
                )
            );
        } finally {
            setSendingCode(false);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!codeSent) {
            await requestCode();
            return;
        }

        if (!/^\d{6}$/.test(verificationCode)) {
            setError("Vui lòng nhập đủ mã OTP 6 số.");
            return;
        }

        setSubmitting(true);

        try {
            await apiRequest<AuthUser>("/api/users/register", {
                method: "POST",
                body: JSON.stringify({
                    full_name: fullName,
                    email: email.trim(),
                    password,
                    code: verificationCode,
                }),
            });

            router.push("/login?registered=1");
        } catch (submitError) {
            setError(
                getApiErrorMessage(
                    submitError,
                    "Chưa tạo được tài khoản. Vui lòng kiểm tra lại thông tin."
                )
            );
        } finally {
            setSubmitting(false);
        }
    }

    function editEmail() {
        setCodeSent(false);
        setVerificationCode("");
        setMaskedEmail("");
        setError("");
    }

    return (
        <form onSubmit={handleSubmit} className="mt-8" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        Họ và tên
                    </span>
                    <input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                        required
                        disabled={codeSent}
                        className="focus-ring mt-2.5 h-12 w-full rounded-[12px] border border-line bg-cream px-4 text-sm outline-none placeholder:text-muted/45 hover:border-accent/45 disabled:cursor-not-allowed disabled:opacity-65"
                    />
                </label>

                <label className="block sm:col-span-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        Email
                    </span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="ten@example.com"
                        autoComplete="email"
                        required
                        disabled={codeSent}
                        className="focus-ring mt-2.5 h-12 w-full rounded-[12px] border border-line bg-cream px-4 text-sm outline-none placeholder:text-muted/45 hover:border-accent/45 disabled:cursor-not-allowed disabled:opacity-65"
                    />
                </label>

                <label className="block sm:col-span-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        Mật khẩu
                    </span>
                    <span className="relative mt-2.5 block">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Tối thiểu 8 ký tự"
                            autoComplete="new-password"
                            required
                            minLength={8}
                            disabled={codeSent}
                            className="focus-ring h-12 w-full rounded-[12px] border border-line bg-cream px-4 pr-20 text-sm outline-none placeholder:text-muted/45 hover:border-accent/45 disabled:cursor-not-allowed disabled:opacity-65"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            disabled={codeSent}
                            className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-semibold text-accent hover:text-ink disabled:opacity-40"
                            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                            {showPassword ? "Ẩn" : "Hiện"}
                        </button>
                    </span>
                </label>

                {codeSent ? (
                    <div className="sm:col-span-2">
                        <div className="rounded-[12px] border border-line bg-tint/45 px-4 py-3 text-xs leading-5 text-muted">
                            Mã OTP 6 số đã được gửi tới{" "}
                            <span className="font-semibold text-ink">{maskedEmail}</span>. Mã có hiệu lực trong 5 phút.
                        </div>

                        <label className="mt-4 block">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                                Mã xác minh email
                            </span>
                            <input
                                value={verificationCode}
                                onChange={(event) =>
                                    setVerificationCode(
                                        event.target.value.replace(/\D/g, "").slice(0, 6)
                                    )
                                }
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="000000"
                                required
                                pattern="\d{6}"
                                className="focus-ring mt-2.5 h-12 w-full rounded-[12px] border border-line bg-cream px-4 text-center text-lg tracking-[0.32em] outline-none placeholder:text-muted/35"
                            />
                        </label>

                        <div className="mt-3 flex items-center justify-between gap-4 text-xs">
                            <button
                                type="button"
                                onClick={editEmail}
                                className="font-semibold text-muted hover:text-ink"
                            >
                                Sửa thông tin
                            </button>
                            <button
                                type="button"
                                onClick={requestCode}
                                disabled={sendingCode}
                                className="font-semibold text-accent disabled:opacity-50"
                            >
                                {sendingCode ? "Đang gửi…" : "Gửi lại OTP"}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {error ? (
                <div
                    role="alert"
                    className="mt-5 rounded-[12px] border border-[#cdaea1] bg-[#f5e8e1] px-4 py-3 text-xs leading-5 text-[#734738]"
                >
                    {error}
                </div>
            ) : null}

            <button
                type="submit"
                disabled={
                    submitting ||
                    sendingCode ||
                    !fullName.trim() ||
                    !email.trim() ||
                    password.length < 8 ||
                    (codeSent && verificationCode.length !== 6)
                }
                className="focus-ring mt-7 flex h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting
                    ? "Đang tạo tài khoản…"
                    : sendingCode
                      ? "Đang gửi OTP…"
                      : codeSent
                        ? "Xác minh & tạo tài khoản"
                        : "Gửi mã xác minh"}
            </button>

            <p className="mt-5 text-xs text-muted">
                Đã có tài khoản?{" "}
                <Link
                    href="/login"
                    className="focus-ring rounded-sm font-semibold text-accent underline decoration-accent/30 underline-offset-4 hover:text-ink"
                >
                    Đăng nhập
                </Link>
            </p>
        </form>
    );
}
