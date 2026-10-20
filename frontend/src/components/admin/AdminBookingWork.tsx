"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, getApiErrorMessage, type AdminStaff, type Appointment, type AppointmentTransferRequest } from "@/lib/api";
import { StaffBookingCard } from "@/components/staff/StaffBookingCard";

export function AdminBookingWork({
    appointment, staff, onChanged,
}: {
    appointment: Appointment;
    staff: AdminStaff[];
    onChanged: () => Promise<void>;
}) {
    const workers = appointment.assigned_staff ?? [];
    const [selected, setSelected] = useState(workers[0]?.id ?? "");
    const [requests, setRequests] = useState<AppointmentTransferRequest[]>([]);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [nowMs, setNowMs] = useState(0);
    const assignedIds = workers.map(person => person.id).join(",");
    const selectedId = workers.some(person => person.id === selected) ? selected : (workers[0]?.id ?? "");
    const availablePeers = useMemo(() => staff
        .filter(person => person.branch_id === appointment.branch_id)
        .map(person => ({ id: person.id, name: person.full_name })),
        [staff, appointment.branch_id]);
    const loadRequests = useCallback(async () => {
        try {
            const result = await apiRequest<{ incoming: AppointmentTransferRequest[]; outgoing: AppointmentTransferRequest[] }>(
                "/api/appointments/transfers/requests",
            );
            const byId = new Map([...result.incoming, ...result.outgoing]
                .filter(row => row.appointment_id === appointment.id && row.status === "pending")
                .map(row => [row.id, row]));
            setRequests([...byId.values()]);
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Không tải được yêu cầu chuyển lịch."));
        }
    }, [appointment.id]);
    useEffect(() => {
        const fetchTimer = window.setTimeout(() => void loadRequests(), 0);
        const clockTimer = window.setTimeout(() => setNowMs(Date.now()), 0);
        const clock = window.setInterval(() => setNowMs(Date.now()), 30_000);
        return () => {
            window.clearTimeout(fetchTimer);
            window.clearTimeout(clockTimer);
            window.clearInterval(clock);
        };
    }, [loadRequests, assignedIds]);

    async function refresh() {
        await onChanged();
        await loadRequests();
    }

    async function updateStatus(_appointment: Appointment, status: "in_progress" | "completed", earlyStartConfirmed = false) {
        if (!selectedId) return;
        setBusy(true); setError("");
        try {
            await apiRequest("/api/appointments/" + appointment.id, {
                method: "PUT",
                body: JSON.stringify({ status, acting_staff_id: selectedId, ...(earlyStartConfirmed ? { early_start_confirmed: true } : {}) }),
            });
            await refresh();
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Không cập nhật được phần việc của nhân viên."));
        } finally {
            setBusy(false);
        }
    }

    async function cancel(request: AppointmentTransferRequest) {
        if (!window.confirm("Hủy yêu cầu chuyển lịch của " + request.from_staff_name + "?")) return;
        setBusy(true); setError("");
        try {
            await apiRequest("/api/appointments/transfers/" + request.id + "/cancel", {
                method: "POST", body: JSON.stringify({ staff_id: request.from_staff_id }),
            });
            await refresh();
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Không hủy được yêu cầu chuyển lịch."));
        } finally {
            setBusy(false);
        }
    }

    if (!workers.length) return null;
    return <section className="space-y-4 border-t border-line pt-5">
        <h3 className="font-serif text-xl">Thực hiện thao tác thay nhân viên</h3>
        <p className="text-xs leading-5 text-muted">
            Chọn nhân viên đang được phân công rồi cập nhật phần việc của người đó.
            Dịch vụ và doanh thu vẫn được ghi nhận cho nhân viên được chọn, không phải tài khoản quản lý.
        </p>
        <label className="block text-xs font-semibold">
            Nhân viên cần thao tác
            <select value={selectedId} onChange={event => setSelected(event.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm">
                {workers.map((person, index) =>
                    <option key={person.id} value={person.id}>Khách {index + 1} — {person.full_name}</option>)}
            </select>
        </label>
        {selectedId ? <StaffBookingCard key={appointment.id + ":" + selectedId} appt={appointment}
            staffId={selectedId} peers={availablePeers}
            nowMs={nowMs} reload={refresh} updateStatus={updateStatus} adminMode /> : null}
        {requests.length ? <div className="rounded-xl border border-line bg-cream p-4">
            <h4 className="text-sm font-semibold">Yêu cầu chuyển lịch đang chờ xác nhận</h4>
            <p className="mt-1 text-xs text-muted">Chỉ nhân viên nhận lịch được đồng ý hoặc từ chối. Quản lý có thể hủy yêu cầu chưa được xác nhận.</p>
            {requests.map(request => <div key={request.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <p className="text-xs">{request.from_staff_name} → {request.to_staff_name}</p>
                <button type="button" disabled={busy} onClick={() => void cancel(request)}
                    className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50">
                    Hủy yêu cầu
                </button>
            </div>)}
        </div> : null}
        {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </section>;
}
