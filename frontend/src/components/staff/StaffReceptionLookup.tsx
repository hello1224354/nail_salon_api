"use client";

import { useState, type FormEvent } from "react";
import { apiRequest, getApiErrorMessage } from "@/lib/api";
import { formatAppointmentStatus } from "@/lib/studio-data";
import { useBranch } from "@/components/branch/BranchProvider";

type ReceptionBooking = {
    id: string;
    booking_code: string;
    customer_name: string;
    party_size: number;
    start_time: string;
    status: string;
    staff: Array<{ id: string; full_name: string; position: number }>;
    services: string[];
};
const dateVN = (value: string) => new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(new Date(value));

export function StaffReceptionLookup() {
    const { branches } = useBranch();
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<ReceptionBooking[] | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    async function find(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy || !search.trim()) return;
        setBusy(true); setError(""); setResults(null);
        try {
            const found = await apiRequest<ReceptionBooking[]>("/api/appointments/reception/search?q=" + encodeURIComponent(search.trim()));
            setResults(found);
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Không tìm được booking."));
        } finally { setBusy(false); }
    }
    return <section className="rounded-[20px] border border-line bg-white p-4 sm:p-6">
        <h2 className="text-sm font-semibold">Tiếp khách có đặt lịch</h2>
        <p className="mt-1 text-xs text-muted">{branches.length > 1 ? "Nhân viên có thể tra lịch tại cơ sở của mình. " : ""}Tra cứu không làm thay đổi người phụ trách.</p>
        <form onSubmit={e => void find(e)} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input value={search} onChange={e => setSearch(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-accent"
                maxLength={32} placeholder="Mã đặt lịch 8 ký tự hoặc số điện thoại" aria-label="Mã lịch hoặc số điện thoại" />
            <button type="submit" disabled={busy || !search.trim()}
                className="rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white disabled:opacity-50">
                {busy ? "Đang tìm…" : "Tìm lịch"}
            </button>
        </form>
        {results?.length === 0 ? <p className="mt-4 text-xs text-muted">{branches.length > 1 ? "Không tìm thấy lịch phù hợp tại cơ sở này." : "Không tìm thấy lịch phù hợp."}</p> : null}
        {results?.map(item => <div key={item.id} className="mt-4 rounded-xl border border-line bg-cream p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold">{item.customer_name} · {item.party_size} người</p>
                <span className="text-xs font-semibold">{formatAppointmentStatus(item.status)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">#{item.booking_code} · {dateVN(item.start_time)}</p>
            <p className="mt-2 text-xs text-muted">Dịch vụ: {item.services.join(", ")}</p>
            <p className="mt-3 text-xs font-semibold">Nhân viên được phân công</p>
            <div className="mt-2 flex flex-wrap gap-2">{item.staff.map(person =>
                <span key={person.id} className="rounded-full border border-line bg-white px-3 py-2 text-xs">
                    Khách {person.position + 1}: {person.full_name}
                </span>)}</div>
            <p className="mt-3 text-xs text-muted">Chỉ người được phân công mới có thể bắt đầu hoặc chuyển phần việc của mình.</p>
        </div>)}
        {error ? <p role="alert" className="mt-3 text-xs text-red-700">{error}</p> : null}
    </section>;
}
