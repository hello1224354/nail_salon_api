"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    ApiError,
    apiRequest,
    fetchAllPages,
    getApiErrorMessage,
    type Appointment,
} from "@/lib/api";
import { clearSession, restoreSession, type AuthUser } from "@/lib/auth";
import { canUseCustomerFeatures as canBook } from "@/lib/roles";
import { AppointmentHistoryCard } from "@/components/appointments/AppointmentHistoryCard";

const filters = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "in_progress", label: "Đang làm" },
    { value: "no_show", label: "Chưa đến" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
] as const;

type FilterValue = (typeof filters)[number]["value"];

async function fetchAppointmentContext() {
    return await Promise.all([
        apiRequest<AuthUser>("/api/users/me"),
        fetchAllPages<Appointment>("/api/appointments?scope=mine", "appointments"),
    ]);
}

function AppointmentSkeleton() {
    return (
        <div className="grid gap-4 lg:grid-cols-2" aria-label="Đang tải lịch hẹn">
            {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-[300px] animate-pulse rounded-[22px] border border-line bg-surface" />
            ))}
        </div>
    );
}

export function MyAppointments() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filter, setFilter] = useState<FilterValue>("all");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadInitial() {
            try {
                const restored = await restoreSession();

                if (!restored) {
                    if (!cancelled) router.replace("/login");
                    return;
                }

                const [currentUser, appointmentData] = await fetchAppointmentContext();
                if (cancelled) return;

                if (!canBook(currentUser.role)) {
                    setError("Trang này dành cho tài khoản CUSTOMER, STAFF hoặc ADMIN.");
                    setAppointments([]);
                    return;
                }

                setAppointments(appointmentData);
            } catch (loadError) {
                if (cancelled) return;

                if (loadError instanceof ApiError && loadError.status === 401) {
                    clearSession();
                    router.replace("/login");
                    return;
                }

                setError(getApiErrorMessage(loadError, "Chưa tải được lịch hẹn của bạn."));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadInitial();

        return () => {
            cancelled = true;
        };
    }, [router]);

    async function refreshAppointments() {
        setRefreshing(true);
        setError("");

        try {
            const restored = await restoreSession();

            if (!restored) {
                router.replace("/login");
                return;
            }

            const [currentUser, appointmentData] = await fetchAppointmentContext();

            if (!canBook(currentUser.role)) {
                setError("Trang này dành cho tài khoản CUSTOMER, STAFF hoặc ADMIN.");
                setAppointments([]);
                return;
            }

            setAppointments(appointmentData);
        } catch (loadError) {
            if (loadError instanceof ApiError && loadError.status === 401) {
                clearSession();
                router.replace("/login");
                return;
            }

            setError(getApiErrorMessage(loadError, "Chưa tải được lịch hẹn của bạn."));
        } finally {
            setRefreshing(false);
        }
    }

    const visibleAppointments = useMemo(() => {
        const filtered = filter === "all"
            ? appointments
            : appointments.filter((appointment) => appointment.status.toLowerCase() === filter);

        const activeStatuses = new Set(["pending", "confirmed", "in_progress"]);

        return [...filtered].sort((a, b) => {
            const aActive = activeStatuses.has(a.status.toLowerCase());
            const bActive = activeStatuses.has(b.status.toLowerCase());

            if (aActive !== bActive) return aActive ? -1 : 1;

            const aTime = new Date(a.start_time).getTime();
            const bTime = new Date(b.start_time).getTime();
            return aActive ? aTime - bTime : bTime - aTime;
        });
    }, [appointments, filter]);

    return (
        <div>
            <div className="flex flex-col gap-4 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Quản lý lịch hẹn</p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                        Theo dõi trạng thái, thời gian và các dịch vụ trong những lịch hẹn đã gửi.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={refreshAppointments}
                    disabled={loading || refreshing}
                    className="focus-ring w-fit rounded-full border border-line bg-surface px-5 py-2.5 text-xs font-semibold transition-colors hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {refreshing ? "Đang cập nhật…" : "Cập nhật"}
                </button>
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible" role="group" aria-label="Lọc lịch hẹn theo trạng thái">
                {filters.map((item) => {
                    const active = item.value === filter;
                    return (
                        <button
                            key={item.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setFilter(item.value)}
                            className={`focus-ring shrink-0 rounded-full px-3 py-2 text-xs transition-colors ${
                                active
                                    ? "bg-ink font-semibold text-white"
                                    : "border border-line bg-surface text-ink hover:border-accent/45"
                            }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {error ? (
                <div className="mt-7 flex flex-col gap-4 rounded-[18px] border border-[#cdaea1] bg-[#f5e8e1] px-5 py-5 text-sm text-[#734738] sm:flex-row sm:items-center sm:justify-between" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={refreshAppointments} className="focus-ring shrink-0 rounded-full border border-[#cdaea1] px-4 py-2 text-xs font-semibold">
                        Thử lại
                    </button>
                </div>
            ) : null}

            <div className="mt-7">
                {loading ? <AppointmentSkeleton /> : null}

                {!loading && !error && visibleAppointments.length === 0 ? (
                    <div className="rounded-[24px] border border-line bg-surface px-6 py-12 text-center sm:px-10">
                        <div className="mx-auto grid size-12 place-items-center rounded-full bg-tint text-accent">
                            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                                <path d="M6 3v3M18 3v3M4.5 8.5h15M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h2 className="mt-5 font-serif text-3xl">{filter === "all" ? "Chưa có lịch hẹn" : "Không có lịch ở trạng thái này"}</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                            {filter === "all"
                                ? "Sau khi đặt lịch, bạn có thể xem trạng thái xác nhận và thông tin buổi hẹn tại đây."
                                : "Chọn trạng thái khác hoặc xem tất cả lịch hẹn của bạn."}
                        </p>
                        {filter === "all" ? (
                            <Link href="/book" className="focus-ring mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-xs font-semibold text-white">
                                Đặt lịch ngay
                            </Link>
                        ) : (
                            <button type="button" onClick={() => setFilter("all")} className="focus-ring mt-6 rounded-full border border-line px-6 py-3 text-xs font-semibold">
                                Xem tất cả
                            </button>
                        )}
                    </div>
                ) : null}

                {!loading && !error && visibleAppointments.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {visibleAppointments.map(appointment => (
                            <AppointmentHistoryCard key={appointment.id} appointment={appointment} />
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
