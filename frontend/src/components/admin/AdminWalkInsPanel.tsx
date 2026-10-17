"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, getApiErrorMessage, type WalkInVisit, type WalkInList } from "@/lib/api";
import { vietnamMonthNow } from "@/lib/admin-month";
import { formatVnd } from "@/lib/studio-data";

const timeVN = (date: string) => new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(new Date(date));

export function AdminWalkInsPanel() {
    const [month, setMonth] = useState(vietnamMonthNow);
    const [page, setPage] = useState(1);
    const [visits, setVisits] = useState<WalkInVisit[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const refresh = useCallback(async (signal?: AbortSignal) => {
        setLoading(true); setError("");
        try {
            const params = new URLSearchParams({ month, page: String(page), limit: "50" });
            const result = await apiRequest<WalkInList>("/api/walk-ins?" + params.toString(), { signal });
            if (signal?.aborted) return;
            setVisits(result.visits);
            setTotal(result.total);
            setPages(Math.max(1, result.total_pages ?? Math.ceil(result.total / 50)));
        } catch (cause) {
            if (!signal?.aborted) {
                setVisits([]); setTotal(0); setPages(1);
                setError(getApiErrorMessage(cause, "Không tải được khách vãng lai."));
            }
        } finally { if (!signal?.aborted) setLoading(false); }
    }, [month, page]);

    useEffect(() => {
        const controller = new AbortController();
        void refresh(controller.signal);
        return () => controller.abort();
    }, [refresh]);

    const pageTotal = visits.reduce((n, visit) =>
        n + visit.services.reduce((k, service) => k + service.actual_price, 0), 0);
    return <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Lịch sử theo tháng</p>
                <h2 className="mt-2 font-serif text-3xl">Khách vãng lai</h2>
            </div>
            <div className="flex flex-wrap items-end gap-3">
                <label className="text-xs font-semibold text-muted">Chọn tháng
                    <input type="month" aria-label="Tháng khách vãng lai" value={month} required
                        onChange={event => { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value)) return; setMonth(event.target.value); setPage(1); }}
                        className="mt-1.5 block h-10 rounded-xl border border-line bg-white px-3 text-ink" />
                </label>
                <button type="button" onClick={() => void refresh()}
                    className="h-10 rounded-full border border-line px-5 text-xs font-semibold">Làm mới</button>
            </div>
        </div>
        <p className="mt-3 text-xs text-muted">
            {total.toLocaleString("vi-VN")} lượt trong tháng · Trang {page}/{pages} ·
            Tổng giá thực tế của trang này: {formatVnd(pageTotal)}đ
        </p>
        {loading ? <p className="mt-5 text-sm text-muted">Đang tải…</p> : null}
        {error ? <p role="alert" className="mt-5 text-sm text-red-700">{error}</p> : null}
        {!loading && visits.length === 0 ? <p className="mt-6 text-sm text-muted">Tháng này không có khách vãng lai.</p> : null}
        {!loading && visits.length > 0 ? <div className="mt-5 space-y-3">
            {visits.map(visit => <article key={visit.id} className="rounded-xl border border-line bg-white p-5">
                <div className="flex flex-wrap justify-between gap-3">
                    <div>
                        <h3 className="font-semibold">{visit.customer_name}</h3>
                        <p className="mt-1 text-xs text-muted">
                            {timeVN(visit.served_at)} · {visit.branch_name} · Nhân viên: {visit.staff_full_name}
                        </p>
                    </div>
                    <strong>{formatVnd(visit.services.reduce((n, s) => n + s.actual_price, 0))}đ</strong>
                </div>
                <p className="mt-3 text-xs text-muted">
                    Liên hệ: {visit.customer_phone || "Không cung cấp SĐT"} · {visit.customer_email || "Không cung cấp email"}
                </p>
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                    {visit.services.map(s => <div key={s.service_id} className="flex flex-wrap justify-between gap-2 text-xs">
                        <span>{s.service_name}</span>
                        <span>Tham khảo {formatVnd(s.reference_price)}đ · <strong>Thực tế {formatVnd(s.actual_price)}đ</strong></span>
                    </div>)}
                </div>
            </article>)}
        </div> : null}
        <div className="mt-5 flex justify-end gap-2">
            <button type="button" disabled={loading || page <= 1} onClick={() => setPage(v => v - 1)}
                className="rounded-full border border-line px-4 py-2 text-xs disabled:opacity-30">← Trước</button>
            <button type="button" disabled={loading || page >= pages} onClick={() => setPage(v => v + 1)}
                className="rounded-full border border-line px-4 py-2 text-xs disabled:opacity-30">Tiếp →</button>
        </div>
    </section>;
}
