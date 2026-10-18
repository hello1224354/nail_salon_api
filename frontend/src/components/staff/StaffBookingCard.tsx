"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, getApiErrorMessage, type Appointment } from "@/lib/api";
import { formatAppointmentStatus, formatVnd } from "@/lib/studio-data";

type Extra = { id: string; name: string; price: string };
type Peer = { id: string; name: string };
const money = (amount: number) => formatVnd(amount) + " đ";
const input = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent";
const button = "rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50";
const validPrice = (raw: string) => raw.trim() !== "" && /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) && Number(raw) <= 1_000_000_000;

export function StaffBookingCard({
    appt, staffId, peers, nowMs, reload, updateStatus, adminMode = false,
}: {
    appt: Appointment;
    staffId: string;
    peers: Peer[];
    nowMs: number;
    reload: () => Promise<void>;
    updateStatus: (appt: Appointment, status: "in_progress" | "completed") => Promise<void>;
    adminMode?: boolean;
}) {
    const core = useMemo(() => (appt.appointment_services ?? []).filter(service => service.duration_minutes > 0),
        [appt.appointment_services]);
    const mine = appt.assigned_staff?.find(worker => worker.id === staffId);
    const completed = Boolean(mine?.completed_at);
    const legacyActive = appt.status === "in_progress" && Boolean(appt.actual_started_at) &&
        !(appt.assigned_staff ?? []).some(worker => worker.started_at);
    const started = Boolean(mine?.started_at || (legacyActive && appt.party_size === 1));
    const [prices, setPrices] = useState<Record<string, string>>({});
    const [extras, setExtras] = useState<Extra[]>([]);
    const [dirty, setDirty] = useState(false);
    const [working, setWorking] = useState(false);
    const [target, setTarget] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const snapshotKey = JSON.stringify({
        services: appt.appointment_services,
        actual: appt.actual_prices,
        id: appt.id,
    });
    useEffect(() => {
        const own = (appt.actual_prices ?? []).filter(row => row.staff_id === staffId);
        setPrices(Object.fromEntries(own.map(row => [row.service_id, String(row.actual_price)])));
        setExtras((appt.appointment_services ?? [])
            .filter(service => service.duration_minutes === 0 &&
                own.some(row => row.service_id === service.service_id))
            .map(service => ({
                id: service.service_id,
                name: service.service_name,
                price: String(own.find(row => row.service_id === service.service_id)!.actual_price),
            })));
        setDirty(false);
    }, [snapshotKey, staffId]); // Reinitialize only when the server snapshot changes.

    const total = core.reduce((sum, service) => {
        const raw = prices[service.service_id];
        return sum + (raw === undefined || raw.trim() === "" ? service.price : Number(raw) || 0);
    }, 0) + extras.reduce((sum, extra) => sum + (Number(extra.price) || 0), 0);
    const editable = ["confirmed", "in_progress", "no_show"].includes(appt.status) && !completed;
    const canStart = nowMs > 0 && nowMs >= new Date(appt.start_time).getTime() &&
        ["confirmed", "in_progress", "no_show"].includes(appt.status) && !started && !completed;
    const transferAllowed = editable && !started && !legacyActive;
    const candidates = peers.filter(peer => !(appt.assigned_staff ?? []).some(worker => worker.id === peer.id));

    async function saveAll() {
        if (!editable || working) return;
        setMessage(""); setError("");
        for (const service of core) {
            const raw = prices[service.service_id];
            if (raw !== undefined && raw.trim() !== "" && !validPrice(raw)) {
                setError("Giá thực tế phải là số nguyên VND không âm."); return;
            }
        }
        if (extras.some(item => !item.name.trim() || item.name.trim().length > 255 || !validPrice(item.price))) {
            setError("Mỗi dịch vụ thêm phải có tên và giá hợp lệ."); return;
        }
        if (!window.confirm("Xác nhận tổng giá " + money(total) + " đã thông báo cho khách?")) return;
        setWorking(true);
        try {
            await apiRequest("/api/appointments/" + appt.id + "/work-prices", {
                method: "PUT",
                body: JSON.stringify({
                    prices: core.map(service => ({
                        service_id: service.service_id,
                        actual_price: prices[service.service_id]?.trim() ? Number(prices[service.service_id]) : null,
                    })),
                    extras: extras.map(item => ({ name: item.name.trim(), price: Number(item.price) })),
                    ...(adminMode ? { staff_id: staffId } : {}),
                }),
            });
            await reload();
            setDirty(false);
            setMessage("Đã lưu toàn bộ giá và dịch vụ phát sinh.");
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Không lưu được thay đổi."));
        } finally { setWorking(false); }
    }

    async function transfer() {
        if (!target || !transferAllowed || working) return;
        setError(""); setMessage("");
        if (!window.confirm("Gửi yêu cầu chuyển phần việc này cho nhân viên đã chọn?")) return;
        setWorking(true);
        try {
            await apiRequest("/api/appointments/" + appt.id + "/transfers", {
                method: "POST",
                body: JSON.stringify({ to_staff_id: target, ...(adminMode ? { from_staff_id: staffId } : {}) }),
            });
            setTarget("");
            setMessage("Đã gửi yêu cầu. Bạn vẫn phụ trách lịch cho đến khi nhân viên kia đồng ý.");
            await reload();
        } catch (cause) { setError(getApiErrorMessage(cause, "Không gửi được yêu cầu chuyển lịch.")); }
        finally { setWorking(false); }
    }

    async function status(next: "in_progress" | "completed") {
        if (dirty && !window.confirm("Bạn chưa lưu các thay đổi về giá/dịch vụ. Tiếp tục mà không lưu?")) return;
        await updateStatus(appt, next);
    }

    const code = (appt.booking_group_id || appt.id).slice(0, 8).toUpperCase();
    const date = new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(new Date(appt.start_time));

    return <article className="rounded-[22px] border border-line bg-white p-5 sm:p-7">
        <p className="text-xs font-semibold text-accent">Mã {code} · Nhóm {appt.party_size} người</p>
        <h3 className="mt-1 font-serif text-2xl">{adminMode ? "Thao tác cho nhân viên" : "Phần việc của tôi"}</h3>
        <p className="mt-1 text-xs text-muted">Người đặt: {appt.customer?.full_name || "Khách"} · {date} · {formatAppointmentStatus(appt.status)}</p>
        {mine ? <p className="mt-2 text-xs font-semibold">Khách số {(appt.assigned_staff?.findIndex(w => w.id === staffId) ?? 0) + 1} · {started ? "Đã bắt đầu" : "Chưa bắt đầu"}{completed ? " · Đã hoàn thành" : ""}</p> : null}

        <div className="mt-5 space-y-3">
            <h4 className="text-sm font-semibold">Dịch vụ đặt trước</h4>
            {core.map(service => <div key={service.service_id} className="grid gap-3 rounded-xl bg-cream p-4 sm:grid-cols-[1fr_180px] sm:items-center">
                <div><p className="text-sm font-semibold">{service.service_name}</p>
                    <p className="mt-1 text-xs text-muted">Giá tham khảo: {money(service.price)}</p></div>
                <label className="text-xs font-semibold">Giá thực tế (để trống = giá tham khảo)
                    <input className={input + " mt-1"} type="number" min="0" max="1000000000" step="1"
                        disabled={!editable || working} placeholder={String(service.price)}
                        value={prices[service.service_id] ?? ""}
                        onChange={e => {
                            setPrices(current => ({ ...current, [service.service_id]: e.target.value }));
                            setDirty(true);
                        }} />
                </label>
            </div>)}
        </div>

        <div className="mt-5 border-t border-line pt-5">
            <h4 className="text-sm font-semibold">Dịch vụ phát sinh</h4>
            <p className="mt-1 text-xs text-muted">Nhập tự do tên dịch vụ và giá thực tế; không tạo dịch vụ mới trong danh mục.</p>
            {extras.map((extra, index) => <div key={extra.id} className="mt-3 grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-[1fr_165px_auto] sm:items-end">
                <label className="text-xs font-semibold">Tên dịch vụ
                    <input className={input + " mt-1"} maxLength={255} disabled={!editable || working}
                        value={extra.name} onChange={e => {
                            setExtras(rows => rows.map((row, i) => i === index ? { ...row, name: e.target.value } : row));
                            setDirty(true);
                        }} />
                </label>
                <label className="text-xs font-semibold">Giá (VND)
                    <input type="number" min="0" max="1000000000" step="1" className={input + " mt-1"} disabled={!editable || working}
                        value={extra.price} onChange={e => {
                            setExtras(rows => rows.map((row, i) => i === index ? { ...row, price: e.target.value } : row));
                            setDirty(true);
                        }} />
                </label>
                <button type="button" className="rounded-full border border-line px-3 py-2.5 text-xs font-semibold disabled:opacity-50"
                    disabled={!editable || working} onClick={() => { setExtras(rows => rows.filter((_, i) => i !== index)); setDirty(true); }}>
                    Xóa
                </button>
            </div>)}
            {editable ? <button type="button" className="mt-3 rounded-full border border-line px-4 py-2.5 text-xs font-semibold"
                disabled={working} onClick={() => { setExtras(rows => [...rows, { id: crypto.randomUUID(), name: "", price: "" }]); setDirty(true); }}>
                + Thêm dịch vụ
            </button> : null}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div><p className="text-xs text-muted">Tổng giá phần việc của tôi</p>
                <p className="font-serif text-2xl">{money(total)}</p></div>
            <button type="button" className={button} disabled={!editable || working || !dirty} onClick={() => void saveAll()}>
                {working ? "Đang xử lý…" : "Lưu tất cả thay đổi"}
            </button>
        </div>

        {transferAllowed ? <div className="mt-5 rounded-xl border border-line bg-cream p-4">
            <p className="text-sm font-semibold">Chuyển phần việc cho nhân viên khác</p>
            <p className="mt-1 text-xs text-muted">Người nhận phải đồng ý trong 3 phút. Trong lúc chờ, lịch vẫn thuộc bạn.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <select className={input + " min-w-0 flex-1"} value={target} onChange={e => setTarget(e.target.value)} disabled={working}>
                    <option value="">Chọn nhân viên cùng chi nhánh</option>
                    {candidates.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
                </select>
                <button type="button" className={button} disabled={!target || working} onClick={() => void transfer()}>Gửi yêu cầu</button>
            </div>
        </div> : null}
        <div className="mt-5 flex justify-end gap-3">
            {canStart ? <button type="button" className={button} disabled={working} onClick={() => void status("in_progress")}>Bắt đầu làm</button> : null}
            {appt.status === "in_progress" && started && !completed ?
                <button type="button" className={button} disabled={working} onClick={() => void status("completed")}>Hoàn thành phần việc</button> : null}
            {completed ? <span className="rounded-full border border-line bg-cream px-4 py-2 text-xs font-semibold">Đã hoàn thành</span> : null}
        </div>
        {error ? <p role="alert" className="mt-3 text-xs text-red-700">{error}</p> : null}
        {message ? <p role="status" className="mt-3 text-xs text-green-800">{message}</p> : null}
    </article>;
}
