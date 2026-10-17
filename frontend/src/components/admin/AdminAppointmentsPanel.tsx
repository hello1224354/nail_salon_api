"use client";

import { useState } from "react";
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
    total, page, pages, setPage, onView, onEdit, onUpdate, onDelete, submitting,
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
    onEdit: (appointment: Appointment) => void;
    onUpdate: (appointment: Appointment, status: string) => void;
    onDelete: (appointment: Appointment) => void;
    submitting: boolean;
}) {
    const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
    return (
        <section className="overflow-hidden rounded-[22px] border border-line bg-white">
            <div className="border-b border-line p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Quản lý lịch hẹn</p>
                <h2 className="mt-1 font-serif text-3xl">Lịch hẹn</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <label htmlFor="appointment-month-mode" className="text-[10px] font-semibold uppercase tracking-wide text-muted">Tháng</label>
                        <select id="appointment-month-mode" aria-label="Lọc lịch theo tháng"
                            value={month ? "month" : "all"}
                            onChange={event => setMonth(event.target.value === "all" ? "" : "current")}
                            className="mt-1.5 block h-10 w-full rounded-xl border border-line bg-cream px-3 text-xs text-ink">
                            <option value="all">Tất cả thời gian</option>
                            <option value="month">Chọn tháng</option>
                        </select>
                        {month ? <input type="month" aria-label="Tháng lịch hẹn" value={month} required
                            onChange={event => setMonth(event.target.value)}
                            className="mt-2 block h-10 w-full rounded-xl border border-line bg-cream px-3 text-xs text-ink" /> : null}
                    </div>
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
                <table className="w-full min-w-[990px] text-left text-xs">
                    <thead className="bg-[#f8f5f1] text-[10px] uppercase tracking-[0.12em] text-muted">
                        <tr>
                            <th scope="col" className="px-4 py-4">Mã lịch</th>
                            <th scope="col" className="px-4 py-4">Tên khách</th>
                            <th scope="col" className="px-4 py-4">Thời gian diễn ra</th>
                            <th scope="col" className="px-4 py-4">Nhân viên</th>
                            <th scope="col" className="px-4 py-4">Chi nhánh</th>
                            <th scope="col" className="px-4 py-4">Chi tiết</th>
                            <th scope="col" className="px-4 py-4">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {appointments.map(appointment => {
                            const allowed = appointment.status === "pending" ? ["confirmed", "cancelled"]
                                : appointment.status === "confirmed" ? ["in_progress", "cancelled"]
                                : appointment.status === "in_progress" ? ["cancelled"] : [];
                            return <tr key={appointment.id} className="align-top">
                                <td className="px-4 py-4 font-mono font-semibold tracking-wide">
                                    {(appointment.booking_group_id ?? appointment.id).slice(0, 8).toUpperCase()}
                                </td>
                                <td className="px-4 py-4 font-medium">{appointment.customer?.full_name ?? "—"}</td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <p className="font-medium">{dateVN(appointment.start_time)}</p>
                                    <p className="mt-1 text-[10px] text-muted">Đến {dateVN(
                                        appointment.status === "completed" && appointment.actual_completed_at
                                            ? appointment.actual_completed_at : appointment.end_time
                                    )}</p>
                                </td>
                                <td className="max-w-[170px] px-4 py-4 leading-5">
                                    {appointment.assigned_staff?.map(p => p.full_name).join(", ")
                                        || appointment.staff?.full_name || "—"}
                                </td>
                                <td className="px-4 py-4">{appointment.branch?.name
                                    ? shortBranchName(appointment.branch.name) : "#" + appointment.branch_id}</td>
                                <td className="px-4 py-4">
                                    <button type="button" onClick={() => onView(appointment)}
                                        className="rounded-full border border-line bg-cream px-3 py-2 font-semibold text-accent">
                                        Xem chi tiết
                                    </button>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button type="button"
                                            disabled={submitting || !["pending", "confirmed"].includes(appointment.status)}
                                            onClick={() => onEdit(appointment)}
                                            className="font-semibold text-accent disabled:opacity-35">Sửa</button>
                                        <div className="min-w-[100px]">
                                            <button type="button" disabled={submitting || allowed.length === 0}
                                                aria-expanded={statusMenuId === appointment.id}
                                                onClick={() => setStatusMenuId(id => id === appointment.id ? null : appointment.id)}
                                                className="rounded-lg border border-line bg-cream px-2.5 py-2 font-semibold text-ink disabled:opacity-35">
                                                Cập nhật trạng thái
                                            </button>
                                            {statusMenuId === appointment.id ? (
                                                <div className="mt-2 grid gap-1 rounded-lg border border-line bg-white p-1.5">
                                                    {allowed.map(status => (
                                                        <button type="button" key={status}
                                                            disabled={submitting}
                                                            onClick={() => {
                                                                setStatusMenuId(null);
                                                                onUpdate(appointment, status);
                                                            }}
                                                            className="rounded-md px-2 py-1.5 text-left text-[11px] hover:bg-cream">
                                                            {formatAppointmentStatus(status)}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                        <button type="button" disabled={submitting} onClick={() => onDelete(appointment)}
                                            className="font-semibold text-[#8a5147] disabled:opacity-40">Xóa</button>
                                    </div>
                                </td>
                            </tr>;
                        })}
                    </tbody>
                </table>
            </div>
            {appointments.length === 0 ?
                <p className="px-5 py-12 text-center text-xs text-muted">Không có lịch hẹn khớp bộ lọc.</p> : null}
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
