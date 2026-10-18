"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, getApiErrorMessage, type AppointmentTransferRequest } from "@/lib/api";

const action = "rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50";
type Transfers = { incoming: AppointmentTransferRequest[]; outgoing: AppointmentTransferRequest[] };
const format = (value: string) => new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(new Date(value));

export function StaffTransfersPanel({ reload }: { reload: () => Promise<void> }) {
    const [transfers, setTransfers] = useState<Transfers>({ incoming: [], outgoing: [] });
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const refresh = useCallback(async () => {
        try {
            const data = await apiRequest<Transfers>("/api/appointments/transfers/requests");
            setTransfers(data);
        } catch (cause) { setError(getApiErrorMessage(cause, "Không tải được yêu cầu chuyển lịch.")); }
    }, []);
    useEffect(() => {
        void refresh();
        const timer = window.setInterval(() => void refresh(), 15_000);
        return () => window.clearInterval(timer);
    }, [refresh]);

    async function respond(row: AppointmentTransferRequest, action: "accept" | "decline" | "cancel") {
        if (busy) return;
        if (!window.confirm(action === "accept" ? "Bạn xác nhận nhận phần việc này?" :
            action === "decline" ? "Từ chối nhận phần việc này?" : "Hủy yêu cầu chuyển phần việc?")) return;
        setBusy(true); setError(""); setMessage("");
        try {
            await apiRequest("/api/appointments/transfers/" + row.id + "/" + action, { method: "POST" });
            await refresh();
            await reload();
            setMessage(action === "accept" ? "Đã nhận lịch. Phần việc được giao cho bạn." :
                action === "decline" ? "Đã từ chối nhận lịch." : "Đã hủy yêu cầu.");
        } catch (cause) { setError(getApiErrorMessage(cause, "Không xử lý được yêu cầu.")); await refresh(); }
        finally { setBusy(false); }
    }

    const incoming = transfers.incoming.filter(row => row.status === "pending");
    const outgoing = transfers.outgoing.filter(row => row.status === "pending");
    return <section className="rounded-[20px] border border-line bg-white p-4 sm:p-6">
        <h2 className="text-sm font-semibold">Yêu cầu chuyển booking</h2>
        <p className="mt-1 text-xs text-muted">Người nhận xác nhận trong 3 phút; quá hạn tự giải phóng giữ chỗ.</p>
        {incoming.length === 0 && outgoing.length === 0 ? <p className="mt-3 text-xs text-muted">Không có yêu cầu đang chờ.</p> : null}
        {incoming.map(row => <div key={row.id} className="mt-3 rounded-xl border border-line bg-cream p-4">
            <p className="text-xs font-semibold">Từ {row.from_staff_name} → Bạn</p>
            <p className="mt-1 text-xs text-muted">Booking {row.booking_code ?? row.appointment_id.slice(0, 8).toUpperCase()} · {row.customer_name || "Khách"} · Dự kiến {format(row.reserved_start)}–{format(row.reserved_end)}</p>
            <p className="mt-1 text-xs text-muted">Dịch vụ: {row.service_names?.join(", ") || "—"}</p>
            <p className="mt-1 text-xs text-muted">Hết hạn: {format(row.expires_at)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={action} disabled={busy} onClick={() => void respond(row, "accept")}>Nhận lịch</button>
                <button type="button" className="rounded-full border border-line px-4 py-2.5 text-xs font-semibold disabled:opacity-50" disabled={busy} onClick={() => void respond(row, "decline")}>Từ chối</button>
            </div>
        </div>)}
        {outgoing.map(row => <div key={row.id} className="mt-3 rounded-xl border border-line p-4">
            <p className="text-xs font-semibold">Đang chờ {row.to_staff_name} xác nhận</p>
            <p className="mt-1 text-xs text-muted">Booking {row.booking_code ?? row.appointment_id.slice(0, 8).toUpperCase()} · Hết hạn {format(row.expires_at)}</p>
            <button type="button" className="mt-3 rounded-full border border-line px-4 py-2.5 text-xs font-semibold disabled:opacity-50" disabled={busy} onClick={() => void respond(row, "cancel")}>Hủy yêu cầu</button>
        </div>)}
        {error ? <p role="alert" className="mt-3 text-xs text-red-700">{error}</p> : null}
        {message ? <p role="status" className="mt-3 text-xs text-green-800">{message}</p> : null}
    </section>;
}
