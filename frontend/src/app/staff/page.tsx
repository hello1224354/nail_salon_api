"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest, getApiErrorMessage, type AdminStaff, type Appointment, type AppointmentList, type Service, type ServiceList, type WalkInVisit, type WalkInList } from "@/lib/api";
import { getAuthUser, restoreSession } from "@/lib/auth";
import { formatAppointmentStatus, formatVnd, formatServicePrice } from "@/lib/studio-data";

const inputClass = "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-accent";
const actionClass = "rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50";
const vnd = (amount: number) => formatVnd(amount) + " đ";
const dateVN = (date: string) => new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(new Date(date));

export default function StaffPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<AdminStaff | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [visits, setVisits] = useState<WalkInVisit[]>([]);
    const [tab, setTab] = useState<"walkin" | "bookings">("walkin");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [chosenIds, setChosenIds] = useState<string[]>([]);
    const [actuals, setActuals] = useState<Record<string, string>>({});
    const [onlinePrices, setOnlinePrices] = useState<Record<string, string>>({});

    const load = useCallback(async (staff: AdminStaff) => {
        const [svc, appts, walkins] = await Promise.all([
            apiRequest<ServiceList>("/api/services?branch_id=" + staff.branch_id + "&page=1&limit=100"),
            apiRequest<AppointmentList>("/api/appointments?page=1&limit=100"),
            apiRequest<WalkInList>("/api/walk-ins"),
        ]);
        setServices(svc.services);
        setAppointments(appts.appointments);
        setVisits(walkins.visits);
        setOnlinePrices(old => {
            const next = { ...old };
            for (const appt of appts.appointments) {
                for (const item of appt.actual_prices ?? []) {
                    if (item.staff_id === staff.id) {
                        const key = appt.id + ":" + item.service_id;
                        if (next[key] === undefined) next[key] = String(item.actual_price);
                    }
                }
            }
            return next;
        });
    }, []);

    useEffect(() => {
        let mounted = true;
        void (async () => {
            try {
                const valid = await restoreSession();
                const auth = getAuthUser();
                if (!valid || !auth) { router.replace("/login"); return; }
                if (auth.role.toLowerCase() !== "staff") {
                    router.replace(auth.role.toLowerCase() === "admin" ? "/admin" : "/");
                    return;
                }
                const me = await apiRequest<AdminStaff>("/api/staffs/me");
                if (!mounted) return;
                setProfile(me);
                await load(me);
            } catch (cause) {
                if (mounted) setError(getApiErrorMessage(cause, "Không tải được trang nhân viên."));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [router, load]);

    const chosen = useMemo(() => chosenIds.map(id => services.find(s => s.id === id))
        .filter((s): s is Service => Boolean(s)), [chosenIds, services]);
    const total = chosen.reduce((sum, s) => sum + Number(actuals[s.id] || 0), 0);

    function toggle(service: Service) {
        setChosenIds(ids => ids.includes(service.id)
            ? ids.filter(id => id !== service.id) : [...ids, service.id]);
        setActuals(before => ({ ...before, [service.id]: before[service.id] ?? String(service.price) }));
    }

    async function saveVisit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!profile || saving) return;
        setError(""); setMessage("");
        const lines = chosen.map(s => ({ service_id: s.id, actual_price: Number(actuals[s.id]) }));
        if (!customerName.trim() || lines.length === 0) {
            setError("Nhập tên khách và chọn ít nhất một dịch vụ."); return;
        }
        if (lines.some(line => actuals[line.service_id]?.trim() === "" ||
            !Number.isSafeInteger(line.actual_price) || line.actual_price < 0 || line.actual_price > 1_000_000_000)) {
            setError("Giá thực tế phải là số nguyên VND không âm."); return;
        }
        if (!window.confirm("Đã báo giá " + vnd(total) + " cho khách. Ghi nhận lượt phục vụ?")) return;
        setSaving(true);
        try {
            await apiRequest<WalkInVisit>("/api/walk-ins", {
                method: "POST",
                body: JSON.stringify({
                    customer_name: customerName.trim(),
                    customer_phone: customerPhone.trim() || null,
                    customer_email: customerEmail.trim() || null,
                    services: lines,
                }),
            });
            await load(profile);
            setChosenIds([]); setActuals({}); setCustomerName(""); setCustomerPhone(""); setCustomerEmail("");
            setMessage("Đã ghi nhận khách vãng lai, tự gán cho nhân viên đang đăng nhập.");
        } catch (cause) { setError(getApiErrorMessage(cause, "Không lưu được lượt khách.")); }
        finally { setSaving(false); }
    }

    async function savePrice(appt: Appointment, serviceId: string) {
        if (!profile || saving) return;
        const raw = onlinePrices[appt.id + ":" + serviceId];
        const amount = Number(raw);
        if (raw === undefined || raw.trim() === "" || !Number.isSafeInteger(amount) || amount < 0 || amount > 1_000_000_000) {
            setError("Nhập giá thực tế hợp lệ bằng VND."); return;
        }
        if (!window.confirm("Đã thông báo giá thực tế " + vnd(amount) + " cho khách trước khi thực hiện?")) return;
        setSaving(true); setError(""); setMessage("");
        try {
            await apiRequest("/api/appointments/" + appt.id + "/actual-prices/" + serviceId, {
                method: "PUT", body: JSON.stringify({ actual_price: amount }),
            });
            await load(profile);
            setMessage("Đã lưu giá thực tế của bạn.");
        } catch (cause) { setError(getApiErrorMessage(cause, "Không lưu được giá thực tế.")); }
        finally { setSaving(false); }
    }

    async function changeStatus(appt: Appointment, status: "in_progress" | "completed") {
        if (!profile || saving || !window.confirm("Xác nhận cập nhật trạng thái lịch hẹn?")) return;
        setSaving(true); setError(""); setMessage("");
        try {
            await apiRequest("/api/appointments/" + appt.id, {
                method: "PUT", body: JSON.stringify({ status }),
            });
            await load(profile);
            setMessage("Đã cập nhật lịch hẹn.");
        } catch (cause) { setError(getApiErrorMessage(cause, "Không cập nhật được lịch hẹn.")); }
        finally { setSaving(false); }
    }

    if (loading) return <main className="site-shell py-16 text-sm">Đang tải khu vực nhân viên…</main>;
    if (!profile) return <main className="site-shell py-16"><h1 className="font-serif text-3xl">Không thể mở khu vực nhân viên</h1><p role="alert" className="mt-4 text-red-700">{error}</p></main>;

    return <main className="site-shell pb-20 pt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Khu vực nhân viên</p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Ghi nhận dịch vụ</h1>
        <p className="mt-3 text-sm text-muted">Đăng nhập: <strong>{profile.full_name}</strong> · {profile.branch_name}. Khách vãng lai do bạn ghi nhận sẽ tự động gán cho chính bạn.</p>
        <div className="mt-8 flex flex-wrap gap-3" role="tablist" aria-label="Chức năng nhân viên">
            <button type="button" role="tab" aria-selected={tab === "walkin"} onClick={() => setTab("walkin")} className={actionClass + (tab !== "walkin" ? " !bg-tint !text-ink" : "")}>Khách vãng lai</button>
            <button type="button" role="tab" aria-selected={tab === "bookings"} onClick={() => setTab("bookings")} className={actionClass + (tab !== "bookings" ? " !bg-tint !text-ink" : "")}>Lịch online được giao ({appointments.length})</button>
        </div>
        {error ? <p className="mt-5 rounded-lg bg-red-50 p-4 text-xs text-red-700" role="alert">{error}</p> : null}
        {message ? <p className="mt-5 rounded-lg bg-green-50 p-4 text-xs text-green-800" role="status">{message}</p> : null}
        {tab === "walkin" ? <>
            <form onSubmit={saveVisit} className="mt-6 rounded-[22px] border border-line bg-white p-5 sm:p-8">
                <h2 className="font-serif text-3xl">Tạo lượt khách vãng lai</h2>
                <p className="mt-2 text-xs leading-5 text-muted">Chỉ tên khách là bắt buộc; điện thoại và email có thể để trống. Thời gian và nhân viên tự lấy từ hệ thống.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <label className="text-xs font-semibold">Tên khách *<input className={inputClass + " mt-2"} maxLength={255} required value={customerName} onChange={e => setCustomerName(e.target.value)} /></label>
                    <label className="text-xs font-semibold">Điện thoại (tùy chọn)<input className={inputClass + " mt-2"} type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} /></label>
                    <label className="text-xs font-semibold">Email (tùy chọn)<input className={inputClass + " mt-2"} type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} /></label>
                </div>
                <h3 className="mt-7 text-sm font-semibold">Dịch vụ · Giá tham khảo / Giá thực tế</h3>
                <p className="mt-1 text-xs text-muted">Nhập giá thực tế cho từng dịch vụ, thông báo với khách trước khi lưu.</p>
                <div className="mt-4 max-h-[460px] space-y-2 overflow-y-auto">
                    {services.map(s => {
                        const checked = chosenIds.includes(s.id);
                        return <div key={s.id} className={"grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_190px] sm:items-center " + (checked ? "border-accent bg-tint" : "border-line")}>
                            <label className="flex cursor-pointer items-center gap-3">
                                <input type="checkbox" checked={checked} onChange={() => toggle(s)} className="size-4 accent-[#97745e]" />
                                <span><strong className="block text-sm">{s.display_name || s.name}</strong><span className="mt-1 block text-xs text-muted">Giá tham khảo: {formatServicePrice(s)}</span></span>
                            </label>
                            <label className="text-xs font-semibold">Giá thực tế (VND)
                                <input className={inputClass + " mt-1"} type="number" min={0} max={1000000000} step={1} disabled={!checked} required={checked} value={actuals[s.id] ?? ""} onChange={e => setActuals(old => ({ ...old, [s.id]: e.target.value }))} />
                            </label>
                        </div>;
                    })}
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
                    <div><p className="text-xs text-muted">Tổng giá thực tế · {chosenIds.length} dịch vụ</p><p className="font-serif text-3xl">{vnd(total)}</p></div>
                    <button className={actionClass} type="submit" disabled={saving || !chosenIds.length}>{saving ? "Đang lưu…" : "Lưu lượt phục vụ"}</button>
                </div>
            </form>
            <section className="mt-9">
                <h2 className="font-serif text-3xl">Lịch sử khách vãng lai của tôi</h2>
                {visits.length === 0 ? <p className="mt-3 text-sm text-muted">Chưa có lượt khách.</p> : <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {visits.map(visit => <article key={visit.id} className="rounded-xl border border-line bg-white p-5">
                        <h3 className="text-sm font-semibold">{visit.customer_name}</h3>
                        <p className="mt-1 text-xs text-muted">{dateVN(visit.served_at)}</p>
                        <div className="mt-3 space-y-2">{visit.services.map(s => <p key={s.service_id} className="flex justify-between gap-3 text-xs"><span>{s.service_name}</span><strong>{vnd(s.actual_price)}</strong></p>)}</div>
                        <p className="mt-3 border-t border-line pt-3 text-right font-semibold">{vnd(visit.services.reduce((n, s) => n + s.actual_price, 0))}</p>
                    </article>)}
                </div>}
            </section>
        </> : <section className="mt-6 space-y-5">
            <p className="rounded-xl border border-[#e5c0a6] bg-[#fff1e6] p-4 text-xs leading-5">Booking nhóm vẫn có một mã lịch. Mỗi nhân viên nhập giá thực tế của riêng mình; muốn hoàn thành lịch, tất cả nhân viên được giao phải nhập đủ giá.</p>
            {appointments.length === 0 ? <p className="text-sm text-muted">Chưa có lịch hẹn được giao.</p> : appointments.map(appt => <article key={appt.id} className="rounded-[22px] border border-line bg-white p-5 sm:p-7">
                <p className="text-xs text-accent">Mã {(appt.booking_group_id || appt.id).slice(0, 8).toUpperCase()} · {appt.party_size} người</p>
                <h3 className="mt-1 font-serif text-2xl">{appt.customer?.full_name || "Khách"}</h3>
                <p className="mt-2 text-xs text-muted">{dateVN(appt.start_time)} · {formatAppointmentStatus(appt.status)}</p>
                <div className="mt-5 space-y-3">{(appt.appointment_services ?? []).map(s => {
                    const key = appt.id + ":" + s.service_id;
                    const old = appt.actual_prices?.find(v => v.staff_id === profile.id && v.service_id === s.service_id);
                    const editable = ["confirmed", "in_progress"].includes(appt.status);
                    return <div key={s.service_id} className="grid gap-3 rounded-xl bg-cream p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                        <div><p className="text-sm font-semibold">{s.service_name}</p><p className="mt-1 text-xs text-muted">Giá tham khảo: {vnd(s.price)}</p></div>
                        <label className="text-xs font-semibold">Giá thực tế của tôi<input className={inputClass + " mt-1"} type="number" min={0} max={1000000000} step={1} disabled={!editable || saving} value={onlinePrices[key] ?? ""} onChange={e => setOnlinePrices(v => ({ ...v, [key]: e.target.value }))} placeholder="Nhập VND" /></label>
                        <button className={actionClass} type="button" disabled={!editable || saving || onlinePrices[key] === undefined} onClick={() => void savePrice(appt, s.service_id)}>{old ? "Cập nhật" : "Lưu giá"}</button>
                    </div>;
                })}</div>
                <p className="mt-4 text-xs text-muted">Đã nhập giá: {(appt.actual_prices ?? []).length}/{(appt.appointment_services?.length ?? 0) * appt.party_size} phần của toàn bộ nhóm.</p>
                <div className="mt-4 flex justify-end gap-3">
                    {appt.status === "confirmed" ? <button className={actionClass} type="button" disabled={saving} onClick={() => void changeStatus(appt, "in_progress")}>Bắt đầu làm</button> : null}
                    {appt.status === "in_progress" ? <button className={actionClass} type="button" disabled={saving} onClick={() => void changeStatus(appt, "completed")}>Hoàn thành</button> : null}
                </div>
            </article>)}
        </section>}
    </main>;
}
