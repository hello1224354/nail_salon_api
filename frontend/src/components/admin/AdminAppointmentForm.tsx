"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { AdminStaff, Appointment, Branch, Service } from "@/lib/api";
import { formatVnd, shortBranchName } from "@/lib/studio-data";

export type AppointmentPayload = {
    customer_email?: string;
    customer_phone?: string;
    staff_id?: string;
    service_ids?: string[];
    start_time?: string;
    party_size?: number;
};

function vietnamDateTime(iso: string) {
    return new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).format(new Date(iso)).replace(" ", "T");
}

const inputClass = "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-accent";
const captionClass = "mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted";

export function AdminAppointmentForm({
    appointment,
    branches,
    staff,
    services,
    submitting,
    onSave,
    onCancel,
}: {
    appointment: Appointment | null;
    branches: Branch[];
    staff: AdminStaff[];
    services: Service[];
    submitting: boolean;
    onSave: (payload: AppointmentPayload) => Promise<void>;
    onCancel: () => void;
}) {
    const [branchId, setBranchId] = useState(appointment?.branch_id ?? branches[0]?.id ?? 0);
    const [staffId, setStaffId] = useState(appointment?.staff_id ?? "");
    const [serviceIds, setServiceIds] = useState<string[]>(
        appointment?.appointment_services?.map((service) => service.service_id) ?? []
    );
    const [localDateTime, setLocalDateTime] = useState(
        appointment ? vietnamDateTime(appointment.start_time) : ""
    );
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [formError, setFormError] = useState("");

    const branchStaff = useMemo(
        () => staff.filter((person) => person.branch_id === branchId),
        [staff, branchId]
    );
    const branchServices = useMemo(
        () => services.filter((service) => service.branch_id === branchId && service.booking_enabled && service.duration_minutes !== null),
        [services, branchId]
    );
    const selectedServices = branchServices.filter((service) => serviceIds.includes(service.id));
    const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration_minutes ?? 0), 0);
    const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError("");

        if (!branchId || !staffId || !serviceIds.length || !localDateTime) {
            setFormError("Chọn chi nhánh, nhân viên, ít nhất một dịch vụ và thời gian hẹn.");
            return;
        }
        if (branchStaff.every((person) => person.id !== staffId) ||
            serviceIds.some((id) => branchServices.every((service) => service.id !== id))) {
            setFormError("Nhân viên và dịch vụ phải cùng chi nhánh, đồng thời đang nhận đặt lịch.");
            return;
        }
        if (Number(localDateTime.slice(14, 16)) % 15 !== 0) {
            setFormError("Giờ hẹn phải nằm trên các mốc 15 phút.");
            return;
        }

        const startTime = `${localDateTime}:00+07:00`;
        if (new Date(startTime).getTime() <= Date.now()) {
            setFormError("Thời gian hẹn phải ở trong tương lai.");
            return;
        }

        if (appointment) {
            const payload: AppointmentPayload = {};
            const oldIds = appointment.appointment_services?.map((service) => service.service_id) ?? [];
            if (staffId !== appointment.staff_id) payload.staff_id = staffId;
            if (serviceIds.length !== oldIds.length || serviceIds.some((id) => !oldIds.includes(id))) {
                payload.service_ids = serviceIds;
            }
            if (new Date(startTime).getTime() !== new Date(appointment.start_time).getTime()) {
                payload.start_time = startTime;
            }
            if (!Object.keys(payload).length) {
                setFormError("Chưa có thay đổi nào để lưu.");
                return;
            }
            await onSave(payload);
            return;
        }

        if (!customerEmail.trim() || !customerPhone.trim()) {
            setFormError("Nhập email tài khoản khách và số điện thoại của lịch hẹn.");
            return;
        }

        await onSave({
            customer_email: customerEmail.trim(),
            customer_phone: customerPhone.trim(),
            staff_id: staffId,
            service_ids: serviceIds,
            start_time: startTime,
            party_size: 1,
        });
    }

    return (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
            {appointment ? (
                <div className="rounded-xl border border-line bg-white p-4 text-xs leading-5 text-muted">
                    Khách: <strong className="text-ink">{appointment.customer?.full_name ?? "—"}</strong>
                    {" · "}{appointment.customer?.email ?? "Không có email"}
                    {appointment.party_size > 1 ? (
                        <p className="mt-2 text-[#8a5147]">
                            Lịch nhóm: thao tác chỉnh sửa áp dụng riêng cho suất hẹn này.
                        </p>
                    ) : null}
                </div>
            ) : (
                <div className="rounded-xl border border-line bg-white p-4 text-xs leading-5 text-muted">
                    Tạo lịch cho khách đã có tài khoản bằng email. Admin chỉ nhập email khi đặt lịch,
                    không có quyền mở hoặc sửa tài khoản CUSTOMER. Mỗi lượt tạo là một lịch cho một người.
                </div>
            )}

            {!appointment ? (
                <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                        <span className={captionClass}>Email tài khoản khách</span>
                        <input className={inputClass} type="email" required autoComplete="off"
                            value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)}
                            placeholder="khach@example.com" />
                    </label>
                    <label>
                        <span className={captionClass}>SĐT liên hệ cho lịch hẹn</span>
                        <input className={inputClass} type="tel" required autoComplete="off"
                            value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)}
                            placeholder="0901 234 567" />
                    </label>
                </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
                <label>
                    <span className={captionClass}>Chi nhánh</span>
                    <select className={inputClass} value={branchId}
                        onChange={(event) => {
                            setBranchId(Number(event.target.value));
                            setStaffId("");
                            setServiceIds([]);
                        }} required>
                        {branches.map((branch) => <option key={branch.id} value={branch.id}>{shortBranchName(branch.name)}</option>)}
                    </select>
                </label>
                <label>
                    <span className={captionClass}>Nhân viên thực hiện</span>
                    <select className={inputClass} value={staffId}
                        onChange={(event) => setStaffId(event.target.value)} required>
                        <option value="">Chọn nhân viên</option>
                        {branchStaff.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
                    </select>
                </label>
                <label className="sm:col-span-2">
                    <span className={captionClass}>Ngày giờ hẹn (giờ Việt Nam)</span>
                    <input className={inputClass} type="datetime-local" step={900} required
                        value={localDateTime} onChange={(event) => setLocalDateTime(event.target.value)} />
                </label>
            </div>

            <div>
                <span className={captionClass}>Dịch vụ</span>
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-line bg-white p-3">
                    {branchServices.length ? branchServices.map((service) => (
                        <label key={service.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg p-2 text-xs hover:bg-cream">
                            <span className="flex items-center gap-2">
                                <input type="checkbox" className="accent-[#9e7562]"
                                    checked={serviceIds.includes(service.id)}
                                    onChange={(event) =>
                                        setServiceIds((ids) => event.target.checked
                                            ? [...ids, service.id]
                                            : ids.filter((id) => id !== service.id)
                                        )
                                    } />
                                <span>{service.display_name || service.name}</span>
                            </span>
                            <span className="shrink-0 text-muted">{service.duration_minutes}p · {formatVnd(service.price)}đ</span>
                        </label>
                    )) : (
                        <p className="p-3 text-xs text-muted">Chi nhánh này chưa có dịch vụ mở đặt lịch.</p>
                    )}
                </div>
                <p className="mt-3 text-xs text-muted">
                    Đã chọn {serviceIds.length} dịch vụ · {totalDuration} phút · {formatVnd(totalPrice)}đ
                </p>
            </div>

            {formError ? <p role="alert" className="rounded-lg bg-[#faeeeb] p-3 text-xs text-[#854d42]">{formError}</p> : null}
            <div className="flex justify-end gap-3 border-t border-line pt-5">
                <button type="button" onClick={onCancel} className="rounded-full border border-line px-5 py-2.5 text-xs font-semibold">Hủy</button>
                <button type="submit" disabled={submitting || !branches.length || !branchStaff.length}
                    className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
                    {submitting ? "Đang lưu…" : appointment ? "Lưu thay đổi" : "Tạo lịch hẹn"}
                </button>
            </div>
        </form>
    );
}
