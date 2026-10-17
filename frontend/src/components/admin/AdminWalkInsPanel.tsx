"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { apiRequest, getApiErrorMessage, type Branch, type WalkInVisit, type WalkInList } from "@/lib/api";
import { vietnamMonthNow } from "@/lib/admin-month";
import { formatVnd, shortBranchName } from "@/lib/studio-data";

const dateVN = (date: string) => new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(new Date(date));

const currency = (amount: number) => formatVnd(amount) + "đ";
const control = "mt-1.5 h-10 w-full min-w-0 rounded-xl border border-line bg-cream px-3 text-xs text-ink outline-none focus:border-accent";

function Popup({ title, onClose, children }: {
    title: string; onClose: () => void; children: ReactNode;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const dialog = ref.current;
        dialog?.showModal();
        return () => dialog?.close();
    }, []);
    return (
        <dialog ref={ref} aria-label={title} onClose={onClose}
            className="site-modal w-[min(calc(100%-1.5rem),42rem)] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[24px] border border-line bg-cream p-0 shadow-2xl backdrop:bg-black/40">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-cream px-5 py-4">
                <h2 className="font-serif text-2xl">{title}</h2>
                <button type="button" onClick={onClose} aria-label="Đóng"
                    className="grid size-9 place-items-center rounded-full border border-line text-lg">×</button>
            </div>
            <div className="space-y-5 p-5">{children}</div>
        </dialog>
    );
}

export function AdminWalkInsPanel({ branches }: { branches: Branch[] }) {
    const [month, setMonth] = useState("");
    const [branchId, setBranchId] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [visits, setVisits] = useState<WalkInVisit[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [selected, setSelected] = useState<WalkInVisit | null>(null);
    const [mode, setMode] = useState<"details" | "edit">("details");
    const [version, setVersion] = useState(0);

    const load = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError("");
        try {
            if (from && to && from > to) throw new Error("Khoảng thời gian không hợp lệ.");
            const params = new URLSearchParams({ page: String(page), limit: "50" });
            if (month) params.set("month", month);
            if (branchId) params.set("branch_id", branchId);
            if (from) params.set("from", new Date(from + ":00+07:00").toISOString());
            if (to) {
                // Include the whole selected minute at the upper boundary.
                params.set("to", new Date(new Date(to + ":00+07:00").getTime() + 60000).toISOString());
            }
            const result = await apiRequest<WalkInList>("/api/walk-ins?" + params, { signal });
            if (signal?.aborted) return;
            setVisits(result.visits);
            setTotal(result.total);
            setPages(Math.max(1, result.total_pages ?? Math.ceil(result.total / 50)));
        } catch (cause) {
            if (!signal?.aborted) {
                setVisits([]); setTotal(0); setPages(1);
                setError(getApiErrorMessage(cause, cause instanceof Error ? cause.message : "Không tải được khách vãng lai."));
            }
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [month, branchId, from, to, page]);

    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        return () => controller.abort();
    }, [load, version]);

    function reset() {
        setMonth(""); setBranchId(""); setFrom(""); setTo(""); setPage(1);
    }

    async function saveChanges(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selected || saving) return;
        const form = new FormData(event.currentTarget);
        const services = selected.services.map(service => ({
            service_id: service.service_id,
            actual_price: Number(form.get("price_" + service.service_id)),
        }));
        if (services.some(row => !Number.isSafeInteger(row.actual_price) || row.actual_price < 0 || row.actual_price > 1_000_000_000)) {
            setError("Giá thực tế phải là số nguyên VND hợp lệ."); return;
        }
        setSaving(true); setError(""); setMessage("");
        try {
            await apiRequest("/api/walk-ins/" + selected.id, {
                method: "PUT",
                body: JSON.stringify({
                    customer_name: String(form.get("customer_name") || "").trim(),
                    customer_phone: String(form.get("customer_phone") || "").trim() || null,
                    customer_email: String(form.get("customer_email") || "").trim() || null,
                    services,
                }),
            });
            setSelected(null);
            setVersion(value => value + 1);
            setMessage("Đã cập nhật khách vãng lai.");
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Không lưu được thay đổi."));
        } finally { setSaving(false); }
    }

    async function deleteVisit(visit: WalkInVisit) {
        if (!window.confirm("Xóa vĩnh viễn lượt khách “" + visit.customer_name + "”? Dữ liệu doanh thu của lượt này sẽ bị xóa.")) return;
        setSaving(true); setError(""); setMessage("");
        try {
            await apiRequest("/api/walk-ins/" + visit.id, { method: "DELETE" });
            setSelected(null);
            if (visits.length === 1 && page > 1) setPage(page - 1);
            else setVersion(value => value + 1);
            setMessage("Đã xóa lượt khách vãng lai.");
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Không xóa được khách vãng lai."));
        } finally { setSaving(false); }
    }

    return (
        <section className="overflow-hidden rounded-[22px] border border-line bg-white">
            <div className="border-b border-line p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Quản lý hoạt động</p>
                <h2 className="mt-1 font-serif text-3xl">Khách vãng lai</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <label htmlFor="walkin-month-mode" className="text-[10px] font-semibold uppercase tracking-wide text-muted">Tháng</label>
                        <select id="walkin-month-mode" value={month ? "month" : "all"}
                            onChange={e => { setMonth(e.target.value === "all" ? "" : vietnamMonthNow()); setPage(1); }}
                            className={control}>
                            <option value="all">Tất cả thời gian</option>
                            <option value="month">Chọn tháng</option>
                        </select>
                        {month ? <input type="month" aria-label="Tháng khách vãng lai" value={month}
                            onChange={e => {
                                if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value)) return;
                                setMonth(e.target.value); setPage(1);
                            }} className={control} /> : null}
                    </div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Chi nhánh
                        <select value={branchId} onChange={e => { setBranchId(e.target.value); setPage(1); }}
                            className={control}>
                            <option value="">Tất cả chi nhánh</option>
                            {branches.map(branch => <option key={branch.id} value={branch.id}>{shortBranchName(branch.name)}</option>)}
                        </select>
                    </label>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Từ ngày giờ
                        <input type="datetime-local" value={from} max={to || undefined}
                            onChange={e => { setFrom(e.target.value); setPage(1); }} className={control} />
                    </label>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Đến ngày giờ
                        <input type="datetime-local" value={to} min={from || undefined}
                            onChange={e => { setTo(e.target.value); setPage(1); }} className={control} />
                    </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <button type="button" onClick={reset} className="text-xs font-semibold text-accent">Đặt lại bộ lọc</button>
                    <button type="button" onClick={() => setVersion(v => v + 1)}
                        className="rounded-full border border-line px-4 py-2 text-xs font-semibold">Làm mới</button>
                </div>
                {error ? <p role="alert" className="mt-4 text-xs text-red-700">{error}</p> : null}
                {message ? <p role="status" className="mt-4 text-xs text-accent">{message}</p> : null}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-xs">
                    <thead className="bg-[#f8f5f1] text-[10px] uppercase tracking-[0.12em] text-muted">
                        <tr>
                            <th className="px-4 py-4">Tên khách</th>
                            <th className="px-4 py-4">Giờ khách đến</th>
                            <th className="px-4 py-4">Tên nhân viên</th>
                            <th className="px-4 py-4">Chi nhánh</th>
                            <th className="px-4 py-4">Chi tiết</th>
                            <th className="px-4 py-4">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {visits.map(visit => <tr key={visit.id}>
                            <td className="px-4 py-4 font-medium">{visit.customer_name}</td>
                            <td className="px-4 py-4 whitespace-nowrap">{dateVN(visit.served_at)}</td>
                            <td className="px-4 py-4">{visit.staff_full_name}</td>
                            <td className="px-4 py-4">{shortBranchName(visit.branch_name)}</td>
                            <td className="px-4 py-4">
                                <button type="button" onClick={() => { setSelected(visit); setMode("details"); }}
                                    className="rounded-full border border-line bg-cream px-3 py-2 font-semibold text-accent">Xem chi tiết</button>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex gap-3">
                                    <button type="button" disabled={saving}
                                        onClick={() => { setSelected(visit); setMode("edit"); }}
                                        className="font-semibold text-accent disabled:opacity-40">Sửa</button>
                                    <button type="button" disabled={saving} onClick={() => void deleteVisit(visit)}
                                        className="font-semibold text-[#854d42] disabled:opacity-40">Xóa</button>
                                </div>
                            </td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
            {!loading && visits.length === 0 ?
                <p className="px-5 py-10 text-center text-xs text-muted">Không có khách vãng lai khớp bộ lọc.</p> : null}
            {loading ? <p className="px-5 py-6 text-xs text-muted">Đang tải…</p> : null}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
                <p className="text-xs text-muted">{total.toLocaleString("vi-VN")} lượt · Trang {page}/{pages}</p>
                <div className="flex gap-2">
                    <button type="button" disabled={loading || page <= 1} onClick={() => setPage(v => v - 1)}
                        className="rounded-full border border-line px-3 py-2 text-xs disabled:opacity-30">← Trước</button>
                    <button type="button" disabled={loading || page >= pages} onClick={() => setPage(v => v + 1)}
                        className="rounded-full border border-line px-3 py-2 text-xs disabled:opacity-30">Tiếp →</button>
                </div>
            </div>
            {selected && mode === "details" ? <Popup title="Chi tiết khách vãng lai" onClose={() => setSelected(null)}>
                <div className="rounded-xl border border-line bg-white p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">Lượt phục vụ</p>
                    <h3 className="mt-2 font-serif text-2xl">{selected.customer_name}</h3>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                        {([
                            ["Giờ khách đến", dateVN(selected.served_at)],
                            ["Nhân viên", selected.staff_full_name],
                            ["Chi nhánh", selected.branch_name],
                            ["Điện thoại", selected.customer_phone ?? "Không cung cấp"],
                            ["Email", selected.customer_email ?? "Không cung cấp"],
                        ] as const).map(([label, value]) => <div key={label} className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
                            <p className="mt-1 break-words font-semibold">{value}</p>
                        </div>)}
                    </div>
                </div>
                <section className="rounded-xl border border-line bg-white p-5">
                    <h3 className="font-serif text-xl">Dịch vụ và giá thực tế</h3>
                    <div className="mt-3 divide-y divide-line">
                        {selected.services.map(service => <div key={service.service_id} className="py-3">
                            <p className="font-medium">{service.service_name}</p>
                            <div className="mt-1 flex justify-between gap-3 text-xs text-muted">
                                <span>Tham khảo: {currency(service.reference_price)}</span>
                                <strong className="text-ink">Thực tế: {currency(service.actual_price)}</strong>
                            </div>
                        </div>)}
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-cream p-4">
                        <span className="text-xs text-muted">Tổng thực tế</span>
                        <strong className="text-lg">{currency(selected.services.reduce((a, b) => a + b.actual_price, 0))}</strong>
                    </div>
                </section>
            </Popup> : null}
            {selected && mode === "edit" ? <Popup title="Sửa khách vãng lai" onClose={() => setSelected(null)}>
                <form key={selected.id} onSubmit={event => void saveChanges(event)} className="space-y-4">
                    {error ? <p role="alert" className="rounded-xl border border-[#ddbcb4] bg-[#faeeeb] p-3 text-xs text-[#854d42]">{error}</p> : null}
                    <label className="block text-xs font-semibold">Tên khách
                        <input className={control} name="customer_name" defaultValue={selected.customer_name} required maxLength={255} />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-semibold">Điện thoại
                            <input className={control} type="tel" name="customer_phone" defaultValue={selected.customer_phone ?? ""} />
                        </label>
                        <label className="block text-xs font-semibold">Email
                            <input className={control} type="email" name="customer_email" defaultValue={selected.customer_email ?? ""} />
                        </label>
                    </div>
                    <div className="rounded-xl border border-line bg-white p-4">
                        <p className="text-xs font-semibold">{selected.staff_full_name} · {shortBranchName(selected.branch_name)}</p>
                        <p className="mt-1 text-xs text-muted">{dateVN(selected.served_at)}</p>
                        {selected.services.map(service => <label key={service.service_id}
                            className="mt-4 block text-xs font-semibold">
                            {service.service_name} · Giá thực tế (VND)
                            <input className={control} type="number" min={0} max={1000000000} step={1}
                                name={"price_" + service.service_id} defaultValue={service.actual_price} required />
                        </label>)}
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setSelected(null)}
                            className="rounded-full border border-line px-5 py-2.5 text-xs font-semibold">Hủy</button>
                        <button type="submit" disabled={saving}
                            className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40">
                            {saving ? "Đang lưu…" : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </Popup> : null}
        </section>
    );
}
