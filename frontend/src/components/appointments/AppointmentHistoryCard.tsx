"use client";

import { useId, useRef } from "react";
import type { Appointment } from "@/lib/api";
import { useBranch } from "@/components/branch/BranchProvider";
import { formatAppointmentStatus, formatVnd, localizeBranchName } from "@/lib/studio-data";

const BUSINESS_TIMEZONE = "Asia/Ho_Chi_Minh";

const statusClasses: Record<string, string> = {
    pending: "border-[#d9b9a7] bg-[#f4e9e2] text-[#865d4d]",
    confirmed: "border-[#b8c9b8] bg-[#edf3ed] text-[#4f684f]",
    in_progress: "border-[#b8c4d0] bg-[#edf1f5] text-[#536373]",
    no_show: "border-[#d9b9a7] bg-[#f4e9e2] text-[#865d4d]",
    completed: "border-[#c7c1bb] bg-[#f0eeeb] text-[#514a45]",
    cancelled: "border-[#d1c6be] bg-[#f4f0ed] text-[#7b6f67]",
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: BUSINESS_TIMEZONE,
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

function formatTime(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: BUSINESS_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(value));
}

/**
 * A completed appointment is not proof of payment: the current API has no
 * payment/paid_amount field. Reconstruct a displayed charge using recorded
 * staff prices, then reference prices for any missing staff/service lines.
 * Never call the result "paid" unless payment data is added to the API.
 */
function summarizePrices(appointment: Appointment) {
    const baseServices = (appointment.appointment_services ?? []).filter(s => s.duration_minutes > 0);
    const extraServices = (appointment.appointment_services ?? []).filter(s => s.duration_minutes === 0);
    const prices = appointment.actual_prices ?? [];
    const baseIds = new Set(baseServices.map(s => s.service_id));
    const recordedBase = prices.filter(p => baseIds.has(p.service_id));
    const missingReference = baseServices.reduce((sum, service) => {
        const recordedStaffCount = new Set(recordedBase
            .filter(p => p.service_id === service.service_id).map(p => p.staff_id)).size;
        return sum + Math.max(0, appointment.party_size - recordedStaffCount) * Number(service.price);
    }, 0);
    const actualTotal = prices.reduce((sum, p) => sum + Number(p.actual_price), 0);
    const completePrices = baseServices.length > 0 && missingReference === 0 &&
        baseServices.every(service => new Set(recordedBase
            .filter(p => p.service_id === service.service_id).map(p => p.staff_id)).size >= appointment.party_size);
    return {
        baseServices,
        extraServices,
        prices,
        total: actualTotal + missingReference,
        hasPrice: baseServices.length > 0 || prices.length > 0,
        completePrices,
        estimated: !completePrices,
    };
}

type GuestPriceLine = {
    key: string;
    name: string;
    amount: number;
    isReference: boolean;
};

function buildGuestPrices(appointment: Appointment) {
    const baseServices = (appointment.appointment_services ?? []).filter(service => service.duration_minutes > 0);
    const extraServices = (appointment.appointment_services ?? []).filter(service => service.duration_minutes === 0);
    const prices = appointment.actual_prices ?? [];
    // Booking is a single record with one staff assignment per guest, not one appointment per guest.
    // The backend returns staff_assignments; assigned_staff supports older API representations.
    const workers = (appointment.staff_assignments?.length
        ? appointment.staff_assignments.map(worker => ({
            id: worker.staff_id,
            name: worker.staff_full_name,
            position: worker.position,
        }))
        : (appointment.assigned_staff ?? []).map((worker, index) => ({
            id: worker.id,
            name: worker.full_name,
            position: index,
        })))
        .sort((a, b) => a.position - b.position);

    // For older bookings lacking assignment data, use staff identifiers on price lines.
    const seen = new Set(workers.map(worker => worker.id));
    for (const price of prices) {
        if (!seen.has(price.staff_id) && workers.length < appointment.party_size) {
            workers.push({ id: price.staff_id, name: "", position: workers.length });
            seen.add(price.staff_id);
        }
    }
    if (!workers.length && appointment.party_size === 1 && appointment.staff_id) {
        workers.push({ id: appointment.staff_id, name: "", position: 0 });
    }

    return Array.from({ length: Math.max(1, appointment.party_size) }, (_, index) => {
        const worker = workers[index];
        const staffId = worker?.id;
        const lines: GuestPriceLine[] = baseServices.map(service => {
            const recorded = staffId
                ? prices.find(price => price.staff_id === staffId && price.service_id === service.service_id)
                : undefined;
            return {
                key: service.service_id,
                name: service.service_name,
                amount: Number(recorded?.actual_price ?? service.price),
                isReference: !recorded,
            };
        });
        for (const extra of extraServices) {
            const recorded = staffId
                ? prices.find(price => price.staff_id === staffId && price.service_id === extra.service_id)
                : undefined;
            if (recorded) lines.push({
                key: extra.service_id,
                name: extra.service_name + " (phát sinh)",
                amount: Number(recorded.actual_price),
                isReference: false,
            });
        }
        return {
            index,
            staffName: worker?.name ?? "",
            lines,
            total: lines.reduce((sum, line) => sum + line.amount, 0),
            isEstimated: lines.some(line => line.isReference),
        };
    });
}

export function AppointmentHistoryCard({ appointment }: { appointment: Appointment }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const { branches } = useBranch();
    const status = appointment.status.toLowerCase();
    const code = (appointment.booking_group_id ?? appointment.id).slice(0, 8).toUpperCase();
    const summary = summarizePrices(appointment);
    const guests = buildGuestPrices(appointment);
    const totalText = summary.hasPrice ? formatVnd(summary.total) + " VND" : "—";
    const duration = summary.baseServices.reduce((sum, service) => sum + service.duration_minutes, 0);
    const amountLabel = summary.completePrices ? "Tổng giá thực tế" : "Tổng giá tạm tính";

    return (
        <article className="min-w-0 rounded-[22px] border border-line bg-surface p-5 shadow-[0_12px_34px_rgba(48,40,35,0.035)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Mã lịch hẹn</p>
                    <p className="mt-1 font-mono text-sm font-semibold tracking-[0.04em]">{code}</p>
                </div>
                <span className={"shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold " +
                    (statusClasses[status] ?? "border-line bg-cream text-muted")}>
                    {formatAppointmentStatus(status)}
                </span>
            </div>

            <div className="mt-5 rounded-[16px] bg-cream p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Thời gian đặt lịch</p>
                <p className="mt-2 font-serif text-[clamp(1.4rem,4vw,1.75rem)] leading-[1.25]">{formatDate(appointment.start_time)}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatTime(appointment.start_time)}–{formatTime(appointment.end_time)}
                </p>
            </div>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{amountLabel}</p>
                    <p className="mt-1 font-serif text-[clamp(1.35rem,4vw,1.75rem)] leading-[1.2] tabular-nums">{totalText}</p>
                </div>
                <button type="button" onClick={() => dialogRef.current?.showModal()}
                    aria-label={"Xem chi tiết lịch hẹn " + code}
                    className="focus-ring shrink-0 rounded-full border border-line bg-cream px-5 py-2.5 text-xs font-semibold text-ink transition-colors hover:border-accent/60">
                    Chi tiết
                </button>
            </div>

            <dialog ref={dialogRef} aria-labelledby={titleId}
                onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}
                className="fixed inset-0 m-auto max-h-[85dvh] w-[min(92vw,42rem)] max-w-none overflow-y-auto rounded-[24px] border border-line bg-surface p-0 text-ink shadow-[0_24px_80px_rgba(48,40,35,0.2)] backdrop:bg-black/55">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-4 sm:px-7">
                    <div className="min-w-0">
                        <h2 id={titleId} className="font-serif text-2xl leading-[1.2]">Chi tiết lịch hẹn</h2>
                        <p className="mt-1 font-mono text-xs font-semibold text-muted">{code}</p>
                    </div>
                    <button type="button" onClick={() => dialogRef.current?.close()}
                        className="focus-ring rounded-full border border-line px-4 py-2 text-xs font-semibold"
                        aria-label="Đóng chi tiết lịch hẹn">Đóng</button>
                </div>
                <div className="space-y-5 px-5 py-6 sm:px-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className={"rounded-full border px-3 py-1.5 text-xs font-semibold " +
                            (statusClasses[status] ?? "border-line bg-cream text-muted")}>
                            {formatAppointmentStatus(status)}
                        </span>
                        <span className="text-xs font-semibold">{appointment.party_size} người</span>
                    </div>
                    <div className="rounded-[16px] bg-cream p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Thời gian đặt lịch</p>
                        <p className="mt-2 font-serif text-xl leading-[1.25]">{formatDate(appointment.start_time)}</p>
                        <p className="mt-1 text-sm font-semibold tabular-nums">
                            {formatTime(appointment.start_time)}–{formatTime(appointment.end_time)}
                        </p>
                        <p className="mt-2 text-xs text-muted">Thời lượng dịch vụ: {duration} phút/người</p>
                        {branches.length > 1 ? (
                            <p className="mt-2 text-xs text-muted">
                                Cơ sở: {appointment.branch?.name
                                    ? localizeBranchName(appointment.branch.name)
                                    : "Cơ sở #" + appointment.branch_id}
                            </p>
                        ) : null}
                    </div>
                    <section>
                        <h3 className="text-sm font-semibold">Dịch vụ đã đặt</h3>
                        {summary.baseServices.length ? (
                            <div className="mt-3 space-y-3">
                                {summary.baseServices.map(service => (
                                    <div key={service.service_id} className="flex justify-between gap-4 border-b border-line pb-3 text-xs leading-5">
                                        <span>{service.service_name} · {service.duration_minutes} phút</span>
                                        <span className="shrink-0 font-semibold tabular-nums">{formatVnd(service.price)} VND/người</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="mt-2 text-xs text-muted">Không có dữ liệu dịch vụ.</p>}
                    </section>
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold">Giá dịch vụ theo từng khách</h3>
                        {guests.map(guest => (
                            <div key={guest.index} className="rounded-[16px] border border-line p-4">
                                <p className="text-sm font-semibold">
                                    Khách {guest.index + 1}
                                    {guest.staffName ? <span className="ml-2 text-xs font-normal text-muted">· {guest.staffName}</span> : null}
                                </p>
                                {guest.lines.length ? (
                                    <div className="mt-3 space-y-2">
                                        {guest.lines.map(line => (
                                            <div key={line.key} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-xs leading-5">
                                                <span className="min-w-0 flex-1">
                                                    {line.name}
                                                    {line.isReference ? <span className="ml-1 text-muted">(giá tham khảo)</span> : null}
                                                </span>
                                                <span className="shrink-0 font-semibold tabular-nums">{formatVnd(line.amount)} VND</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="mt-2 text-xs text-muted">Chưa có thông tin giá dịch vụ.</p>}
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs">
                                    <span className="font-semibold">{guest.isEstimated ? "Tạm tính khách " : "Tổng giá khách "}{guest.index + 1}</span>
                                    <strong className="tabular-nums">{formatVnd(guest.total)} VND</strong>
                                </div>
                            </div>
                        ))}
                    </section>
                    <div className="border-t border-line pt-4">
                        <div className="flex items-end justify-between gap-3">
                            <p className="text-xs font-semibold">{amountLabel}</p>
                            <p className="font-serif text-2xl tabular-nums">{totalText}</p>
                        </div>
                        {summary.estimated && summary.hasPrice ? (
                            <p className="mt-3 text-xs leading-5 text-muted">
                                {status === "completed"
                                    ? "Lịch đã hoàn thành. Một số giá thực tế chưa được ghi nhận; phần thiếu đang tính theo giá tham khảo."
                                    : "Tổng tạm tính theo giá đã ghi nhận và giá tham khảo cho phần chưa cập nhật."}
                            </p>
                        ) : null}
                        {status === "completed" ? (
                            <p className="mt-2 text-xs leading-5 text-muted">
                                Hệ thống chưa lưu thông tin xác nhận thanh toán; tổng giá không đồng nghĩa với số tiền đã thu.
                            </p>
                        ) : null}
                    </div>
                </div>
            </dialog>
        </article>
    );
}
