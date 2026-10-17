"use client";

import type { Appointment, Branch } from "@/lib/api";
import { formatAppointmentStatus, shortBranchName } from "@/lib/studio-data";

const statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"];
const dateVN = (value: string) => new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(new Date(value));

export function AdminAppointmentsPanel({
    appointments, branches, month, setMonth, branchFilter, setBranchFilter,
    statusFilter, setStatusFilter, codeInput, setCodeInput, onCodeSearch, onResetFilters,
    total, page, pages, setPage, onView,
}: {
    appointments: Appointment[];
    branches: Branch[];
    month: string;
    setMonth: (value: string) => void;
    branchFilter: string;
    setBranchFilter: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    codeInput: string;
    setCodeInput: (value: string) => void;
    onCodeSearch: () => void;
    onResetFilters: () => void;
    total: number;
    page: number;
    pages: number;
    setPage: (value: number) => void;
    onView: (appointment: Appointment) => void;
}) {
    return (
        <section className="overflow-hidden rounded-[22px] border border-line bg-white">
            <div className="border-b border-line p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Lịch sử theo tháng</p>
                <h2 className="mt-1 font-serif text-3xl">Lịch hẹn</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Tháng
                        <input type="month" aria-label="Tháng lịch hẹn" required value={month}
                            onChange={event => setMonth(event.target.value)}
                            className="mt-1.5 block h-10 w-full rounded-xl border border-line bg-cream px-3 text-xs text-ink" />
                    </label>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Chi nhánh
                        <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
                            className="mt-1.5 block h-10 w-full rounded-xl border border-line bg-cream px-3 text-xs text-ink">
                            <option value="">Tất cả chi nhánh</option>
                            {branches.map(branch => <option key={branch.id} value={branch.id}>{shortBranchName(branch.name)}</option>)}
                        </select>
                    </label>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">Trạng thái
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="mt-1.5 block h-10 w-full rounded-xl border border-line bg-cream px-3 text-xs text-ink">
                            <option value="">Tất cả trạng thái</option>
                            {statuses.map(status => <option key={status} value={status}>{formatAppointmentStatus(status)}</option>)}
                        </select>
                    </label>
                    <form className="text-[10px] font-semibold uppercase tracking-wide text-muted" role="search"
                        onSubmit={event => { event.preventDefault(); onCodeSearch(); }}>
                        <label htmlFor="admin-booking-search">Mã lịch hẹn</label>
                        <div className="mt-1.5 flex gap-2">
                            <input id="admin-booking-search" type="search" autoComplete="off" maxLength={8}
                                value={codeInput}
                                onChange={e => setCodeInput(e.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 8).toUpperCase())}
                                placeholder="VD: 9DCB7830"
                                className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-cream px-3 font-mono text-xs text-ink" />
                            <button type="submit" className="h-10 rounded-xl bg-ink px-3 text-xs font-semibold text-white">Tìm</button>
                        </div>
                    </form>
                </div>
                <button type="button" onClick={onResetFilters} className="mt-3 text-xs font-semibold text-accent">Đặt lại bộ lọc</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-xs">
                    <thead className="bg-[#f8f5f1] text-[10px] uppercase tracking-[0.12em] text-muted">
                        <tr>
                            <th scope="col" className="px-5 py-4">Mã lịch</th>
                            <th scope="col" className="px-5 py-4">Tên khách</th>
                            <th scope="col" className="px-5 py-4">Thời gian diễn ra</th>
                            <th scope="col" className="px-5 py-4">Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {appointments.map(appointment => (
                            <tr key={appointment.id}>
                                <td className="px-5 py-4 font-mono font-semibold tracking-wide">
                                    {(appointment.booking_group_id ?? appointment.id).slice(0, 8).toUpperCase()}
                                </td>
                                <td className="px-5 py-4 font-medium">{appointment.customer?.full_name ?? "—"}</td>
                                <td className="px-5 py-4">
                                    <p className="font-medium">{dateVN(appointment.start_time)}</p>
                                    <p className="mt-1 text-[10px] text-muted">Đến {dateVN(appointment.end_time)}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <button type="button" onClick={() => onView(appointment)}
                                        className="rounded-full border border-line bg-cream px-3.5 py-2 text-xs font-semibold text-accent hover:border-accent">
                                        Xem chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {appointments.length === 0 ?
                <p className="px-5 py-12 text-center text-xs text-muted">Không có lịch hẹn trong tháng và bộ lọc đã chọn.</p> : null}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
                <p className="text-xs text-muted">{total.toLocaleString("vi-VN")} lịch · Trang {page}/{pages}</p>
                <div className="flex gap-2">
                    <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}
                        className="rounded-full border border-line px-3 py-2 text-xs disabled:opacity-30">← Trước</button>
                    <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}
                        className="rounded-full border border-line px-3 py-2 text-xs disabled:opacity-30">Tiếp →</button>
                </div>
            </div>
        </section>
    );
}
