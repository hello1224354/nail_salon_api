"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, getApiErrorMessage, type WalkInVisit, type WalkInList } from "@/lib/api";
import { formatVnd } from "@/lib/studio-data";

const timeVN = (date: string) => new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(new Date(date));

export function AdminWalkInsPanel() {
    const [visits, setVisits] = useState<WalkInVisit[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const refresh = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const result = await apiRequest<WalkInList>("/api/walk-ins");
            setVisits(result.visits);
            setTotal(result.total);
        } catch (cause) { setError(getApiErrorMessage(cause, "Không tải được khách vãng lai.")); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { void refresh(); }, [refresh]);
    const sum = visits.reduce((n, visit) => n + visit.services.reduce((k, s) => k + s.actual_price, 0), 0);

    return <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-accent">Hoạt động</p><h2 className="mt-2 font-serif text-3xl">Khách vãng lai</h2></div>
            <button type="button" onClick={() => void refresh()} className="rounded-full border border-line px-5 py-2 text-xs font-semibold">Làm mới</button>
        </div>
        <p className="mt-3 text-xs text-muted">{total} lượt · Hiển thị 100 lượt gần nhất · Tổng giá thực tế của các lượt đang hiển thị: {formatVnd(sum)}đ.</p>
        {loading ? <p className="mt-5 text-sm text-muted">Đang tải…</p> : null}
        {error ? <p role="alert" className="mt-5 text-sm text-red-700">{error}</p> : null}
        {!loading && visits.length === 0 ? <p className="mt-6 text-sm text-muted">Chưa có lượt khách vãng lai.</p> : null}
        {!loading && visits.length > 0 ? <div className="mt-5 space-y-3">
            {visits.map(visit => <article key={visit.id} className="rounded-xl border border-line bg-white p-5">
                <div className="flex flex-wrap justify-between gap-3">
                    <div><h3 className="font-semibold">{visit.customer_name}</h3><p className="mt-1 text-xs text-muted">{timeVN(visit.served_at)} · {visit.branch_name} · Nhân viên: {visit.staff_full_name}</p></div>
                    <strong>{formatVnd(visit.services.reduce((n, s) => n + s.actual_price, 0))}đ</strong>
                </div>
                <p className="mt-3 text-xs text-muted">Liên hệ: {visit.customer_phone || "Không cung cấp SĐT"} · {visit.customer_email || "Không cung cấp email"}</p>
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                    {visit.services.map(s => <div key={s.service_id} className="flex flex-wrap justify-between gap-2 text-xs"><span>{s.service_name}</span><span>Tham khảo {formatVnd(s.reference_price)}đ · <strong>Thực tế {formatVnd(s.actual_price)}đ</strong></span></div>)}
                </div>
            </article>)}
        </div> : null}
    </section>;
}
