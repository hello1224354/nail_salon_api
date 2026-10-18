"use client";

import { useMemo, useState, type FormEvent } from "react";
import { apiRequest, getApiErrorMessage, type AdminStaff, type Service } from "@/lib/api";
import { formatVnd } from "@/lib/studio-data";

const fieldClass = "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent";
type Selected = { service_id: string; actual_price: string };

export function AdminWalkInCreate({
    staff, services, onCreated,
}: {
    staff: AdminStaff[];
    services: Service[];
    onCreated: () => void;
}) {
    const [staffId, setStaffId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [chosen, setChosen] = useState<Selected[]>([]);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const selectedStaff = staff.find(row => row.id === staffId);
    const available = useMemo(() => services.filter(service =>
        service.branch_id === selectedStaff?.branch_id), [services, selectedStaff?.branch_id]);
    const selectedMap = new Map(chosen.map(row => [row.service_id, row.actual_price]));
    const total = chosen.reduce((sum, row) => sum + (Number(row.actual_price) || 0), 0);
    const valid = chosen.length > 0 && chosen.every(row => {
        const value = Number(row.actual_price);
        return /^\d+$/.test(row.actual_price) && Number.isSafeInteger(value) && value <= 1_000_000_000;
    });

    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!staffId || !customerName.trim() || !valid || saving) return;
        if (!window.confirm("Đã báo khách tổng giá " + formatVnd(total) + " đ. Lưu lượt phục vụ cho " +
            selectedStaff?.full_name + "?")) return;
        setSaving(true); setError("");
        try {
            await apiRequest("/api/walk-ins", {
                method: "POST",
                body: JSON.stringify({
                    staff_id: staffId,
                    customer_name: customerName.trim(),
                    customer_phone: phone.trim() || null,
                    customer_email: email.trim() || null,
                    services: chosen.map(row => ({
                        service_id: row.service_id, actual_price: Number(row.actual_price),
                    })),
                }),
            });
            setOpen(false); setStaffId(""); setCustomerName(""); setPhone(""); setEmail(""); setChosen([]);
            onCreated();
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Không lưu được khách vãng lai."));
        } finally { setSaving(false); }
    }

    return <div className="rounded-xl border border-line bg-cream p-4">
        <button type="button" onClick={() => setOpen(v => !v)}
            className="rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white">
            {open ? "Đóng biểu mẫu" : "+ Thêm khách vãng lai thay nhân viên"}
        </button>
        {open ? <form className="mt-4 space-y-4" onSubmit={e => void submit(e)}>
            <p className="text-xs text-muted">Người quản lý chọn nhân viên thực tế đã phục vụ khách. Lượt phục vụ và doanh thu được ghi nhận cho nhân viên đó.</p>
            <label className="block text-xs font-semibold">Nhân viên phục vụ
                <select className={fieldClass} value={staffId} required onChange={e => {
                    setStaffId(e.target.value); setChosen([]);
                }}>
                    <option value="">Chọn nhân viên</option>
                    {staff.map(person => <option key={person.id} value={person.id}>{person.full_name} — Chi nhánh {person.branch_name ?? person.branch_id}</option>)}
                </select>
            </label>
            <label className="block text-xs font-semibold">Tên khách
                <input className={fieldClass} value={customerName} maxLength={255} required
                    onChange={e => setCustomerName(e.target.value)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold">Số điện thoại (không bắt buộc)
                    <input className={fieldClass} value={phone} onChange={e => setPhone(e.target.value)} />
                </label>
                <label className="block text-xs font-semibold">Email (không bắt buộc)
                    <input type="email" className={fieldClass} value={email} onChange={e => setEmail(e.target.value)} />
                </label>
            </div>
            <p className="text-xs font-semibold">Dịch vụ và giá thực tế</p>
            {staffId && available.length === 0 ? <p className="text-xs text-muted">Chi nhánh của nhân viên chưa có dịch vụ.</p> : null}
            {available.map(service => {
                const currentPrice = selectedMap.get(service.id);
                const enabled = currentPrice !== undefined;
                return <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-3">
                    <label className="flex min-w-0 flex-1 gap-2 text-xs">
                        <input type="checkbox" checked={enabled} onChange={e => {
                            setChosen(rows => e.target.checked
                                ? [...rows, { service_id: service.id, actual_price: String(service.price) }]
                                : rows.filter(row => row.service_id !== service.id));
                        }} />
                        <span>{service.display_name || service.name}<span className="block text-muted">Giá tham khảo: {formatVnd(service.price)} đ</span></span>
                    </label>
                    {enabled ? <label className="text-xs font-semibold">Giá thực tế (VND)
                        <input className={fieldClass + " max-w-[150px]"} type="number" min="0" step="1" max="1000000000"
                            value={currentPrice} onChange={e => {
                                setChosen(rows => rows.map(row => row.service_id === service.id
                                    ? { ...row, actual_price: e.target.value } : row));
                            }} />
                    </label> : null}
                </div>;
            })}
            <p className="text-sm font-semibold">Tổng tiền: {formatVnd(total)} đ</p>
            <button type="submit" disabled={!valid || !staffId || !customerName.trim() || saving}
                className="rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white disabled:opacity-50">
                {saving ? "Đang lưu…" : "Lưu lượt phục vụ"}
            </button>
        </form> : null}
        {error ? <p role="alert" className="mt-3 text-xs text-red-700">{error}</p> : null}
    </div>;
}
