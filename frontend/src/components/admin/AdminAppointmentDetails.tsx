"use client";

import type { Appointment } from "@/lib/api";
import { formatAppointmentStatus, formatVnd, shortBranchName } from "@/lib/studio-data";

function localTime(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(new Date(value));
}
const money = (amount: number) => formatVnd(amount) + "đ";
export function AdminAppointmentDetails({
    appointment,
}: {
    appointment: Appointment;
}) {
    const services = appointment.appointment_services ?? [];
    const workers = appointment.assigned_staff?.length
        ? appointment.assigned_staff
        : [{ id: appointment.staff_id, full_name: appointment.staff?.full_name ?? "Nhân viên" }];
    const actual = appointment.actual_prices ?? [];
    const complete = appointment.status === "completed";
    const estimatedPerPerson = services.reduce((sum, item) => sum + item.price, 0);
    const completedTotal = actual.reduce((sum, item) => sum + item.actual_price, 0);
    const expectedEntries = workers.length * services.length;
    return (
        <div className="space-y-5 text-sm">
            <div className="rounded-2xl border border-line bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Thông tin đặt lịch</p>
                <p className="mt-2 font-mono text-2xl font-semibold tracking-wide">
                    {(appointment.booking_group_id ?? appointment.id).slice(0, 8).toUpperCase()}
                </p>
                <span className="mt-3 inline-flex rounded-full border border-line bg-cream px-3 py-1 text-xs font-semibold">
                    {formatAppointmentStatus(appointment.status)}
                </span>
                <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                    {([
                        ["Khách hàng", appointment.customer?.full_name ?? "—"],
                        ["Số điện thoại", appointment.customer?.phone ?? "—"],
                        ["Email", appointment.customer?.email ?? "Không cung cấp"],
                        ["Số người", String(appointment.party_size)],
                        ["Chi nhánh", appointment.branch?.name ? shortBranchName(appointment.branch.name) : "#" + appointment.branch_id],
                        ["Địa chỉ", appointment.branch?.address ?? "—"],
                        ["Bắt đầu", localTime(appointment.start_time)],
                        ["Kết thúc", localTime(
                            complete && appointment.actual_completed_at
                                ? appointment.actual_completed_at : appointment.end_time
                        )],
                    ] as const).map(([label, value]) => (
                        <div key={label} className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
                            <p className="mt-1 break-words font-medium">{value}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-4 space-y-1 border-t border-line pt-4 text-xs text-muted">
                    {appointment.created_at ? <p>Tạo lịch: {localTime(appointment.created_at)}</p> : null}
                    {appointment.actual_started_at ? <p>Bắt đầu thực tế: {localTime(appointment.actual_started_at)}</p> : null}
                </div>
            </div>
            <section className="rounded-2xl border border-line bg-white p-5">
                <h3 className="font-serif text-xl">Dịch vụ đã đặt</h3>
                <div className="mt-4 divide-y divide-line">
                    {services.map(service => (
                        <div key={service.service_id} className="flex items-start justify-between gap-3 py-3 text-xs">
                            <span>{service.service_name} <span className="text-muted">· {service.duration_minutes} phút</span></span>
                            <strong className="shrink-0">{money(service.price)} / người</strong>
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-cream p-4">
                    <span className="text-xs text-muted">Tổng giá tham khảo · {appointment.party_size} người</span>
                    <strong>{money(estimatedPerPerson * appointment.party_size)}</strong>
                </div>
            </section>
            <section className="rounded-2xl border border-line bg-white p-5">
                <h3 className="font-serif text-xl">Nhân viên theo từng khách</h3>
                <div className="mt-3 space-y-3">
                    {workers.map((person, index) => {
                        const workerEntries = services.map(service => ({
                            service, row: actual.find(item => item.staff_id === person.id && item.service_id === service.service_id),
                        }));
                        const amount = workerEntries.reduce((sum, entry) => sum + (entry.row?.actual_price ?? 0), 0);
                        return <div key={person.id} className="rounded-xl bg-cream p-4">
                            <p className="text-xs font-semibold">Khách {index + 1} · {person.full_name}</p>
                            {appointment.status === "in_progress" && person.completed_at ?
                                <p className="mt-1 text-xs font-semibold text-accent">Đã hoàn thành phần việc</p> : null}
                            {complete ? (
                                <>
                                    <div className="mt-3 space-y-2">
                                        {workerEntries.map(({ service, row }) => (
                                            <div key={service.service_id} className="flex items-start justify-between gap-3 text-xs">
                                                <span>{service.service_name}</span>
                                                <span className="shrink-0 font-semibold">
                                                    {row ? money(row.actual_price) : "Chưa có giá"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-3 border-t border-line pt-3 text-right text-xs font-semibold">
                                        Giá thực tế khách {index + 1}: {money(amount)}
                                    </p>
                                </>
                            ) : <p className="mt-2 text-xs text-muted">Giá thực tế sẽ hiển thị khi lịch hoàn thành.</p>}
                        </div>;
                    })}
                </div>
                {complete ? <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#302823] p-4 text-white">
                    <span className="text-xs">Tổng giá thực tế {actual.length < expectedEntries ? "(chưa đủ dữ liệu)" : ""}</span>
                    <strong className="text-lg">{money(completedTotal)}</strong>
                </div> : null}
            </section>
        </div>
    );
}
