"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { AdminStaff, Appointment, Branch, Service } from "@/lib/api";
import { formatVnd, shortBranchName } from "@/lib/studio-data";

// ADMIN may adjust an existing appointment, never create one on behalf of a customer.
export type AppointmentPayload = {
    branch_id?: number;
    customer_phone?: string;
    staff_ids?: Array<string | null>;
    service_ids?: string[];
    start_time?: string;
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
    appointment: Appointment;
    branches: Branch[];
    staff: AdminStaff[];
    services: Service[];
    submitting: boolean;
    onSave: (payload: AppointmentPayload) => Promise<void>;
    onCancel: () => void;
}) {
    const [branchId, setBranchId] = useState(appointment.branch_id);
    const existingStaffIds = appointment.assigned_staff?.map(person => person.id) ??
        (appointment.staff_id ? [appointment.staff_id] : []);
    const [staffIds, setStaffIds] = useState<string[]>(() =>
        Array.from({ length: appointment.party_size }, (_, index) => existingStaffIds[index] ?? "")
    );
    const [serviceIds, setServiceIds] = useState<string[]>(
        appointment.appointment_services?.map((service) => service.service_id) ?? []
    );
    const [localDateTime, setLocalDateTime] = useState(vietnamDateTime(appointment.start_time));
    const [customerPhone, setCustomerPhone] = useState(appointment.customer?.phone ?? "");
    const [formError, setFormError] = useState("");

    const branchStaff = useMemo(
        () => staff.filter((person) => person.branch_id === branchId),
        [staff, branchId]
    );
    const branchServices = useMemo(
        () => services.filter((service) =>
            service.branch_id === branchId && service.booking_enabled && service.duration_minutes !== null
        ),
        [services, branchId]
    );
    const selectedServices = branchServices.filter((service) => serviceIds.includes(service.id));
    const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration_minutes ?? 0), 0);
    const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError("");

        if (!branchId || !serviceIds.length || !localDateTime) {
            setFormError("Chọn chi nhánh, ít nhất một dịch vụ và thời gian hẹn.");
            return;
        }

        const explicitlySelected = staffIds.filter(Boolean);
        if (new Set(explicitlySelected).size !== explicitlySelected.length) {
            setFormError("Không thể chọn cùng một nhân viên cho nhiều khách trong cùng lịch.");
            return;
        }
        if (explicitlySelected.some(id => branchStaff.every(person => person.id !== id)) ||
            serviceIds.some(id => branchServices.every(service => service.id !== id))) {
            setFormError("Nhân viên và dịch vụ phải thuộc đúng chi nhánh; dịch vụ phải đang nhận đặt lịch.");
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

        const payload: AppointmentPayload = {};
        const oldIds = appointment.appointment_services?.map((service) => service.service_id) ?? [];

        if (customerPhone.trim() !== (appointment.customer?.phone ?? "")) {
            payload.customer_phone = customerPhone.trim();
        }
        if (branchId !== appointment.branch_id) payload.branch_id = branchId;
        // Selected people are mandatory; unselected positions are allocated fairly.
        // When the schedule changes, preserve the selections shown in this form.
        const selectedChanged = staffIds.some(
            (id, index) => id !== (existingStaffIds[index] ?? "")
        );
        if (selectedChanged || branchId !== appointment.branch_id ||
            serviceIds.length !== oldIds.length || serviceIds.some(id => !oldIds.includes(id)) ||
            new Date(startTime).getTime() !== new Date(appointment.start_time).getTime()) {
            payload.staff_ids = staffIds.map(id => id || null);
        }
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
    }

    return (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
            <div className="rounded-xl border border-line bg-white p-4 text-xs leading-5 text-muted">
                Khách: <strong className="text-ink">{appointment.customer?.full_name ?? "—"}</strong>
                {" · "}{appointment.customer?.email ?? "Không có email"}
            </div>

            <label className="block">
                <span className={captionClass}>SĐT liên hệ</span>
                <input className={inputClass} type="tel" required value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
                <label>
                    <span className={captionClass}>Chi nhánh</span>
                    <select className={inputClass} value={branchId}
                        onChange={(event) => {
                            setBranchId(Number(event.target.value));
                            setStaffIds(Array.from({ length: appointment.party_size }, () => ""));
                            setServiceIds([]);
                        }} required>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>{shortBranchName(branch.name)}</option>
                        ))}
                    </select>
                </label>
                <div className="sm:col-span-2">
                    <p className={captionClass}>Phân công nhân viên · {appointment.party_size} người</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {staffIds.map((id, index) => (
                            <label key={index} className="block rounded-xl border border-line bg-white p-3">
                                <span className="mb-2 block text-xs font-semibold text-ink">
                                    Nhân viên cho khách {index + 1}
                                </span>
                                <select
                                    className={inputClass}
                                    value={id}
                                    onChange={(event) => setStaffIds(current =>
                                        current.map((value, position) => position === index ? event.target.value : value)
                                    )}
                                >
                                    <option value="">Tự động phân công</option>
                                    {branchStaff.map(person => (
                                        <option
                                            key={person.id}
                                            value={person.id}
                                            disabled={staffIds.some((other, position) =>
                                                position !== index && other === person.id
                                            )}
                                        >
                                            {person.full_name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted">
                        Có thể chọn riêng từng nhân viên cho mỗi khách. Vị trí để trống sẽ được hệ thống
                        tự phân công theo mức tải và lượt luân phiên. Mỗi nhân viên chỉ xuất hiện một lần trong nhóm.
                    </p>
                </div>
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
                                    onChange={(event) => setServiceIds((ids) =>
                                        event.target.checked ? [...ids, service.id] : ids.filter((id) => id !== service.id)
                                    )} />
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
                <button type="submit" disabled={submitting || !branches.length}
                    className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
                    {submitting ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
            </div>
        </form>
    );
}
