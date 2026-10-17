"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, getApiErrorMessage, type AdminMonthSummary } from "@/lib/api";
import { formatVnd } from "@/lib/studio-data";

const zero: AdminMonthSummary = {
    month: "", total: 0, pending: 0, confirmed: 0, in_progress: 0, completed: 0,
    cancelled: 0, walk_ins: 0, online_revenue: 0, walk_in_revenue: 0, revenue: 0,
};
export function AdminMonthlyOverview({ month, setMonth }: {
    month: string;
    setMonth: (value: string) => void;
}) {
    const [stats, setStats] = useState<AdminMonthSummary>(zero);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const refresh = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError("");
        try {
            const result = await apiRequest<AdminMonthSummary>(
                "/api/appointments/admin/month-summary?month=" + encodeURIComponent(month), { signal }
            );
            if (!signal?.aborted) setStats(result);
        } catch (cause) {
            if (!signal?.aborted) {
                setStats({ ...zero, month });
                setError(getApiErrorMessage(cause, "Không tải được tổng quan tháng."));
            }
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [month]);
    useEffect(() => {
        const controller = new AbortController();
        void refresh(controller.signal);
        return () => controller.abort();
    }, [refresh]);
    const entries = [
        ["Tổng lịch hẹn", stats.total], ["Chờ xác nhận", stats.pending],
        ["Đã xác nhận", stats.confirmed], ["Đang phục vụ", stats.in_progress],
        ["Hoàn thành", stats.completed], ["Đã hủy", stats.cancelled],
        ["Khách vãng lai", stats.walk_ins],
    ] as const;
    return (
        <section className="rounded-[22px] border border-line bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Thống kê toàn hệ thống</p>
                    <h2 className="mt-1 font-serif text-2xl">Tổng quan theo tháng</h2>
                </div>
                <label className="text-xs font-semibold text-muted">
                    Chọn tháng
                    <input type="month" aria-label="Tháng thống kê" value={month}
                        onChange={event => setMonth(event.target.value)}
                        className="mt-2 block h-10 rounded-xl border border-line bg-cream px-3 text-ink"
                        required />
                </label>
            </div>
            {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {entries.map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-cream px-4 py-3">
                        <p className="text-[10px] text-muted">{label}</p>
                        <p className="mt-1 font-serif text-2xl tabular-nums">{loading ? "…" : value.toLocaleString("vi-VN")}</p>
                    </div>
                ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#2d2926] px-4 py-4 text-white">
                <p className="text-xs text-white/75">Tổng giá thực tế ghi nhận trong tháng</p>
                <p className="mt-1 font-serif text-3xl tabular-nums">{loading ? "…" : formatVnd(stats.revenue) + "đ"}</p>
                <p className="mt-2 text-[11px] text-white/60">
                    Lịch online hoàn thành: {formatVnd(stats.online_revenue)}đ ·
                    Khách vãng lai: {formatVnd(stats.walk_in_revenue)}đ
                </p>
                <p className="mt-2 text-[10px] text-white/55">
                    Lượt lịch tính theo ngày hẹn; doanh thu tính theo ngày hoàn thành hoặc ngày phục vụ. Tháng trống hiển thị 0.
                </p>
            </div>
        </section>
    );
}
