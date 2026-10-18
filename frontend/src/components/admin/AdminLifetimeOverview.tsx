"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, getApiErrorMessage, type AdminLifetimeSummary, type AdminWebsiteTraffic } from "@/lib/api";
import { formatVnd } from "@/lib/studio-data";

const blank: AdminLifetimeSummary = {
    total: 0, pending: 0, confirmed: 0, no_show: 0, in_progress: 0, completed: 0,
    cancelled: 0, walk_ins: 0, online_revenue: 0, walk_in_revenue: 0, revenue: 0,
};
const noTraffic: AdminWebsiteTraffic = { total_visits: 0, online_visits: 0 };

export function AdminLifetimeOverview() {
    const [stats, setStats] = useState<AdminLifetimeSummary>(blank);
    const [traffic, setTraffic] = useState<AdminWebsiteTraffic>(noTraffic);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async (signal?: AbortSignal) => {
        setError("");
        try {
            const [numbers, visits] = await Promise.all([
                apiRequest<AdminLifetimeSummary>("/api/appointments/admin/lifetime-summary", { signal }),
                apiRequest<AdminWebsiteTraffic>("/api/traffic/admin/summary", { signal }),
            ]);
            if (signal?.aborted) return;
            setStats(numbers);
            setTraffic(visits);
            setLoading(false);
        } catch (cause) {
            if (!signal?.aborted) {
                setError(getApiErrorMessage(cause, "Không thể tải thống kê toàn thời gian."));
                setLoading(false);
            }
        }
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        const timer = window.setInterval(() => { void load(controller.signal); }, 60_000);
        return () => { controller.abort(); window.clearInterval(timer); };
    }, [load]);

    const cards = [
        ["Tổng lịch hẹn", stats.total],
        ["Hoàn thành", stats.completed],
        ["Chờ xác nhận", stats.pending],
        ["Đã xác nhận", stats.confirmed],
        ["Chưa đến", stats.no_show],
        ["Đang phục vụ", stats.in_progress],
        ["Đã hủy", stats.cancelled],
        ["Khách vãng lai", stats.walk_ins],
    ] as const;
    const display = (value: number) => loading ? "…" : value.toLocaleString("vi-VN");
    return <section className="rounded-[22px] border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                    Thống kê toàn hệ thống
                </p>
                <h2 className="mt-1 font-serif text-2xl">Tổng quan từ trước đến nay</h2>
            </div>
            <span className="rounded-full border border-line bg-cream px-3 py-2 text-[11px] font-semibold text-muted">
                Toàn thời gian
            </span>
        </div>
        {error ? <p role="alert" className="mt-4 text-xs text-[#854d42]">{error}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {cards.map(([label, value]) =>
                <div key={label} className="rounded-xl bg-cream px-4 py-3">
                    <p className="text-[10px] text-muted">{label}</p>
                    <p className="mt-1 font-serif text-2xl tabular-nums">{display(value)}</p>
                </div>
            )}
            <div className="rounded-xl border border-line bg-white px-4 py-3">
                <p className="text-[10px] text-muted">Đang truy cập website</p>
                <p className="mt-1 font-serif text-2xl tabular-nums">{display(traffic.online_visits)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white px-4 py-3">
                <p className="text-[10px] text-muted">Tổng lượt truy cập website</p>
                <p className="mt-1 font-serif text-2xl tabular-nums">{display(traffic.total_visits)}</p>
            </div>
        </div>
        <div className="mt-4 rounded-xl bg-[#2d2926] px-4 py-4 text-white">
            <p className="text-xs text-white/75">Tổng doanh thu thực tế</p>
            <p className="mt-1 font-serif text-3xl tabular-nums">{loading ? "…" : formatVnd(stats.revenue) + "đ"}</p>
            <p className="mt-2 text-[11px] text-white/65">
                Lịch hoàn thành: {formatVnd(stats.online_revenue)}đ · Khách vãng lai: {formatVnd(stats.walk_in_revenue)}đ
            </p>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-muted">
            Lượt truy cập là số phiên mở website; tải lại trang không tạo lượt mới.
            Đang truy cập là các phiên hoạt động trong 5 phút gần nhất.
            Bộ đếm lượt truy cập bắt đầu ghi nhận từ khi tính năng được triển khai.
        </p>
    </section>;
}
