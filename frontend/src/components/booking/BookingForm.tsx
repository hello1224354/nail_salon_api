"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    ApiError,
    apiRequest,
    fetchAllPages,
    getApiErrorMessage,
    type Appointment,
    type Availability,
    type Branch,
} from "@/lib/api";
import { clearSession, restoreSession, type AuthUser } from "@/lib/auth";
import { useBranch } from "@/components/branch/BranchProvider";
import { canUseCustomerFeatures as canBook } from "@/lib/roles";
import {
    decorateService,
    formatServicePrice,
    formatVnd,
    localizeAddress,
    shortBranchName,
    type StudioService,
} from "@/lib/studio-data";

type BookingDate = {
    value: string;
    weekday: string;
    day: string;
    month: string;
    year: string;
};

type TimeGroup = {
    label: string;
    times: string[];
};

const BUSINESS_TIMEZONE = "Asia/Ho_Chi_Minh";

function getBusinessDates(): BookingDate[] {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: BUSINESS_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const todayParts = formatter.formatToParts(new Date());
    const year = Number(todayParts.find((part) => part.type === "year")?.value);
    const month = Number(todayParts.find((part) => part.type === "month")?.value);
    const day = Number(todayParts.find((part) => part.type === "day")?.value);
    const base = Date.UTC(year, month - 1, day);

    return Array.from({ length: 14 }, (_, index) => {
        const date = new Date(base + index * 24 * 60 * 60 * 1000);
        const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
        const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

        return {
            value,
            weekday: dayLabels[date.getUTCDay()],
            day: String(date.getUTCDate()).padStart(2, "0"),
            month: String(date.getUTCMonth() + 1).padStart(2, "0"),
            year: String(date.getUTCFullYear()),
        };
    });
}

function buildTimeGroups(availableTimes: Iterable<string>): TimeGroup[] {
    const groups: TimeGroup[] = [
        { label: "Buổi sáng", times: [] },
        { label: "Buổi chiều", times: [] },
        { label: "Buổi tối", times: [] },
    ];
    for (const time of availableTimes) {
        const hour = Number(time.slice(0, 2));
        if (!Number.isInteger(hour)) continue;
        if (hour < 12) groups[0].times.push(time);
        else if (hour < 17) groups[1].times.push(time);
        else groups[2].times.push(time);
    }
    return groups.filter(group => group.times.length > 0).map(group => ({
        ...group,
        times: group.times.sort((a, b) => a.localeCompare(b)),
    }));
}

function formatLongDate(value: string) {
    if (!value) return "Chọn ngày";
    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: BUSINESS_TIMEZONE,
        weekday: "short",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatSlotTime(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: BUSINESS_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(value));
}

function addMinutes(time: string, minutesToAdd: number) {
    const [hour, minute] = time.split(":").map(Number);
    const total = hour * 60 + minute + minutesToAdd;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function normalizeVietnamesePhone(value: string) {
    const compact = value.replace(/[\s.-]/g, "");

    if (compact.startsWith("+84")) return compact;
    if (compact.startsWith("84")) return `+${compact}`;
    if (compact.startsWith("0")) return `+84${compact.slice(1)}`;

    return compact;
}

function isValidVietnamesePhone(value: string) {
    return /^\+84\d{9}$/.test(normalizeVietnamesePhone(value));
}

function SectionHeading({ number, title, helper }: { number: string; title: string; helper?: string }) {
    return (
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-[clamp(0.75rem,2vw,1rem)]">
            <span className="font-serif text-[clamp(1.35rem,2.5vw,1.625rem)] font-medium leading-none tracking-[0.05em] text-accent">{number}</span>
            <h2 className="min-w-0 font-serif text-[clamp(1.4rem,3vw,1.875rem)] leading-tight tracking-[-0.015em]">{title}</h2>
            {helper ? <p className="col-start-2 mt-2 min-w-0 text-xs leading-5 text-muted">{helper}</p> : null}
        </div>
    );
}

export function BookingForm() {
    const router = useRouter();
    const dates = useMemo(() => getBusinessDates(), []);
    const [user, setUser] = useState<AuthUser | null>(null);
    const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
    const [services, setServices] = useState<StudioService[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [partySize, setPartySize] = useState(1);
    const [maxPartySize, setMaxPartySize] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(dates[0]?.value ?? "");
    const [availableSlots, setAvailableSlots] = useState<Map<string, string>>(new Map());
    const [selectedTime, setSelectedTime] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [initialLoading, setInitialLoading] = useState(true);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [servicesError, setServicesError] = useState("");
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
    const successDialogRef = useRef<HTMLDialogElement | null>(null);
    const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);

    const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;
    const createdBranchName = createdAppointment?.branch?.name
        || branches.find((branch) => branch.id === createdAppointment?.branch_id)?.name
        || selectedBranch?.name;

    const timeGroups = useMemo(() => buildTimeGroups(availableSlots.keys()), [availableSlots]);
    const selectedServices = useMemo(
        () => services.filter((service) => selectedServiceIds.includes(service.id)),
        [selectedServiceIds, services]
    );
    const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration_minutes ?? 0), 0);
    const pricePerPerson = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const totalPrice = pricePerPerson * partySize;
    const endTime = selectedTime && totalDuration > 0 ? addMinutes(selectedTime, totalDuration) : "";
    const createdServices = createdAppointment?.appointment_services ?? [];
    const createdTotalPrice =
        createdServices.reduce((sum, service) => sum + service.price, 0) *
        (createdAppointment?.party_size ?? 1);

    // Only the latest branch request may update the service list.
    const servicesRequestId = useRef(0);
    const servicesAbortRef = useRef<AbortController | null>(null);

    const loadServicesForBranch = useCallback(async (branchId: number) => {
        const requestId = ++servicesRequestId.current;
        servicesAbortRef.current?.abort();
        const controller = new AbortController();
        servicesAbortRef.current = controller;
        setServices([]);
        setServicesError("");
        setServicesLoading(true);

        const timeout = window.setTimeout(() => controller.abort(), 12_000);
        try {
            const data = await fetchAllPages<StudioService>(
                `/api/services?branch_id=${branchId}`, "services",
                { signal: controller.signal }
            );
            if (servicesRequestId.current !== requestId) return;
            setServices(data
                .filter(service => service.booking_enabled && service.duration_minutes !== null)
                .map(decorateService));
        } catch (error) {
            if (servicesRequestId.current !== requestId) return;
            setServicesError(controller.signal.aborted
                ? "Tải dịch vụ quá thời gian chờ. Vui lòng thử lại."
                : getApiErrorMessage(error, "Không tải được dịch vụ. Vui lòng thử lại."));
        } finally {
            window.clearTimeout(timeout);
            if (servicesAbortRef.current === controller) servicesAbortRef.current = null;
            if (servicesRequestId.current === requestId) setServicesLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadBookingContext() {
            try {
                const restored = await restoreSession();

                if (!restored) {
                    if (!cancelled) router.replace("/login");
                    return;
                }

                const currentUser = await apiRequest<AuthUser>("/api/users/me");

                if (cancelled) return;

                if (!canBook(currentUser.role)) {
                    setFormError("Trang đặt lịch dành cho tài khoản CUSTOMER, STAFF hoặc ADMIN.");
                    setUser(currentUser);
                    return;
                }

                setUser(currentUser);

            } catch (loadError) {
                if (cancelled) return;

                if (loadError instanceof ApiError && loadError.status === 401) {
                    clearSession();
                    router.replace("/login");
                    return;
                }

                setFormError(getApiErrorMessage(loadError, "Chưa tải được thông tin để đặt lịch."));
            } finally {
                if (!cancelled) setInitialLoading(false);
            }
        }

        loadBookingContext();

        return () => {
            cancelled = true;
            servicesRequestId.current += 1;
            servicesAbortRef.current?.abort();
        };
    }, [router, loadServicesForBranch]);

    // The shared branch selector is the single source of truth for booking,
    // header, services and footer. A change resets only branch-specific data.
    useEffect(() => {
        if (!user || !canBook(user.role) || selectedBranchId === null) return;
        setSelectedServiceIds([]);
        setPartySize(1);
        setMaxPartySize(null);
        setAvailableSlots(new Map());
        setSelectedTime("");
        setFormError("");
        void loadServicesForBranch(selectedBranchId);
        return () => {
            servicesRequestId.current += 1;
            servicesAbortRef.current?.abort();
        };
    }, [user, selectedBranchId, loadServicesForBranch]);

    // The availability effect is the only owner of its loading state.
    // Refreshing the selected date still changes availabilityRefreshKey.
    useEffect(() => {
        if (!user || !canBook(user.role) || selectedServiceIds.length === 0 || !selectedDate) {
            setAvailabilityLoading(false);
            setAvailabilityError("");
            setAvailableSlots(new Map());
            setMaxPartySize(null);
            setSelectedTime("");
            return;
        }

        let cancelled = false;
        const controller = new AbortController();
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let timedOut = false;
        setAvailabilityLoading(true);
        setAvailabilityError("");
        setAvailableSlots(new Map());
        setMaxPartySize(null);
        setSelectedTime("");

        async function loadAvailability() {
            try {
                const params = new URLSearchParams({
                    service_ids: selectedServiceIds.join(","),
                    date: `${selectedDate}T00:00:00+07:00`,
                    party_size: String(partySize),
                });
                // Promise.race bounds the entire API call, including session-refresh
                // handling that might otherwise outlive an aborted fetch.
                const timeoutFailure = new Promise<never>((_, reject) => {
                    timeout = setTimeout(() => {
                        timedOut = true;
                        controller.abort();
                        reject(new Error("AVAILABILITY_TIMEOUT"));
                    }, 12_000);
                });
                const data = await Promise.race([
                    apiRequest<Availability>(
                        `/api/appointments/availability?${params.toString()}`,
                        { signal: controller.signal }
                    ),
                    timeoutFailure,
                ]);
                if (cancelled) return;

                const slotMap = new Map<string, string>();
                for (const slot of data.slots) {
                    slotMap.set(formatSlotTime(slot), slot);
                }
                setMaxPartySize(data.max_party_size);
                setAvailableSlots(slotMap);
            } catch (loadError) {
                if (cancelled) return;

                if (loadError instanceof ApiError && loadError.status === 401) {
                    clearSession();
                    router.replace("/login");
                    return;
                }
                setAvailableSlots(new Map());
                setSelectedTime("");
                setMaxPartySize(null);
                setAvailabilityError(
                    timedOut
                        ? "Kiểm tra giờ trống quá thời gian chờ. Vui lòng thử lại."
                        : getApiErrorMessage(loadError, "Chưa kiểm tra được các giờ còn trống.")
                );
            } finally {
                if (timeout !== undefined) clearTimeout(timeout);
                if (!cancelled) setAvailabilityLoading(false);
            }
        }
        // One availability read after interactions settle. Clicking a different
        // date or +/- rapidly should not create one server request per tap.
        const debounceTimer = window.setTimeout(() => {
            void loadAvailability();
        }, 200);
        return () => {
            cancelled = true;
            window.clearTimeout(debounceTimer);
            controller.abort();
            if (timeout !== undefined) clearTimeout(timeout);
        };
    }, [availabilityRefreshKey, partySize, router, selectedDate, selectedServiceIds, user]);

    useEffect(() => {
        if (!createdAppointment) return;
        const dialog = successDialogRef.current;
        if (!dialog) return;

        const previouslyFocused = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

        // Native modal top layer works independently of the animated page
        // sections, sticky header and stacking contexts.
        if (!dialog.open) dialog.showModal();

        return () => {
            if (dialog.open) dialog.close();
            previouslyFocused?.focus();
        };
    }, [createdAppointment]);

    function closeSuccessModal() {
        setCreatedAppointment(null);
        setSelectedServiceIds([]);
        setPartySize(1);
        setMaxPartySize(null);
        setSelectedTime("");
        setAvailableSlots(new Map());
        setFormError("");
    }

    function viewMyAppointments() {
        closeSuccessModal();
        router.push("/appointments");
    }

    const handleBranchChange = (branchId: number) => {
        if (branchId === selectedBranchId) return;

        setSelectedBranchId(branchId);

    };

    const toggleService = (id: string) => {
        setFormError("");
        setSelectedTime("");
        setAvailableSlots(new Map());
        const next = selectedServiceIds.includes(id)
            ? selectedServiceIds.filter((serviceId) => serviceId !== id)
            : [...selectedServiceIds, id];

        setSelectedServiceIds(next);
        setMaxPartySize(null);
    };

    function changePartySize(nextPartySize: number) {
        if (nextPartySize < 1) return;
        if (maxPartySize !== null && nextPartySize > maxPartySize) return;

        setPartySize(nextPartySize);
        setSelectedTime("");
        setAvailableSlots(new Map());
        setFormError("");
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitting) return;
        setFormError("");

        if (!user) {
            router.replace("/login");
            return;
        }

        if (!canBook(user.role)) {
            setFormError("Trang đặt lịch dành cho tài khoản CUSTOMER, STAFF hoặc ADMIN.");
            return;
        }

        if (!isValidVietnamesePhone(customerPhone)) {
            setFormError("Vui lòng nhập số điện thoại Việt Nam hợp lệ để tiệm xác nhận lịch.");
            return;
        }

        if (selectedServiceIds.length === 0) {
            setFormError("Vui lòng chọn ít nhất một dịch vụ.");
            return;
        }

        const startTime = availableSlots.get(selectedTime);
        if (!selectedDate || !selectedTime || !startTime) {
            setFormError("Vui lòng chọn ngày và khung giờ còn trống.");
            return;
        }

        setSubmitting(true);

        try {
            const appointment = await apiRequest<Appointment>(
                "/api/appointments",
                {
                    method: "POST",
                    body: JSON.stringify({
                        service_ids: selectedServiceIds,
                        start_time: startTime,
                        party_size: partySize,
                        customer_phone: normalizeVietnamesePhone(customerPhone),
                    }),
                }
            );

            setCreatedAppointment(appointment);
            setSelectedTime("");
            setAvailabilityRefreshKey((value) => value + 1);
        } catch (submitError) {
            if (submitError instanceof ApiError && submitError.status === 401) {
                clearSession();
                router.replace("/login");
                return;
            }

            setFormError(getApiErrorMessage(submitError, "Chưa đặt được lịch. Vui lòng thử lại."));
        } finally {
            setSubmitting(false);
        }
    }

    const summaryReady =
        selectedServices.length > 0 &&
        selectedDate.length > 0 &&
        selectedTime.length > 0 &&
        availableSlots.has(selectedTime) &&
        isValidVietnamesePhone(customerPhone) &&
        (user !== null && canBook(user.role));

    if (initialLoading) {
        return (
            <div className="grid min-w-0 gap-[clamp(1.25rem,3vw,2.5rem)] xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] xl:items-start" aria-label="Đang tải biểu mẫu đặt lịch">
                <div className="min-h-[55vh] animate-pulse rounded-[22px] border border-line bg-surface" />
                <div className="min-h-[35vh] animate-pulse rounded-[22px] border border-line bg-surface" />
            </div>
        );
    }

    return (
        <>
        <form onSubmit={handleSubmit} className="grid min-w-0 gap-[clamp(1.25rem,3vw,2.5rem)] xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] xl:items-start">
            <div className="min-w-0 rounded-[22px] border border-line bg-surface">
                <section className="min-w-0 p-[clamp(1rem,2.5vw,2rem)]">
                    <SectionHeading number="01" title="Chi nhánh" />
                    <div className="mt-6 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))]">
                        {branches.length > 0 ? (
                            branches.map((branch) => {
                                const selected = branch.id === selectedBranchId;
                                return (
                                    <label
                                        key={branch.id}
                                        className={`flex cursor-pointer items-start gap-3 rounded-[14px] border p-4 transition-colors ${
                                            selected ? "border-accent bg-tint" : "border-line bg-white hover:border-accent/40"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="branch"
                                            checked={selected}
                                            onChange={() => handleBranchChange(branch.id)}
                                            className="mt-0.5 accent-[#986a58]"
                                        />
                                        <span className="min-w-0">
                                            <span className="block break-words text-sm font-semibold">{shortBranchName(branch.name)}</span>
                                            <span className="mt-1 block break-words text-[11px] leading-4 text-muted">{localizeAddress(branch.address)}</span>
                                        </span>
                                    </label>
                                );
                            })
                        ) : (
                            <div className="rounded-[14px] border border-line bg-cream p-4 text-xs text-muted sm:col-span-2">
                                Hiện chưa có chi nhánh đang hoạt động.
                            </div>
                        )}
                    </div>
                </section>

                <div className="mx-[clamp(1rem,2.5vw,2rem)] h-px bg-line" />

                <section className="min-w-0 p-[clamp(1rem,2.5vw,2rem)]">
                    <SectionHeading number="02" title="Dịch vụ" helper="Chọn dịch vụ bạn muốn làm trong lần hẹn này." />
                    <div className="mt-6 min-w-0 space-y-2">
                        {servicesLoading ? (
                            Array.from({ length: 5 }, (_, index) => (
                                <div key={index} className="h-[62px] animate-pulse rounded-[12px] border border-line bg-cream" />
                            ))
                        ) : servicesError ? (
                            <div role="alert" className="rounded-[12px] border border-[#cdaea1] bg-[#f7e8e3] px-4 py-4 text-xs leading-5 text-[#8b4334]">
                                <p>{servicesError}</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedBranchId !== null) void loadServicesForBranch(selectedBranchId);
                                    }}
                                    className="focus-ring mt-3 rounded-full border border-[#8b4334] px-4 py-2 font-semibold hover:bg-white"
                                >
                                    Thử tải lại dịch vụ
                                </button>
                            </div>
                        ) : services.length > 0 ? (
                            services.map((service) => {
                                const selected = selectedServiceIds.includes(service.id);
                                return (
                                    <label
                                        key={service.id}
                                        className={`grid min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1 rounded-[12px] border px-3 py-2.5 transition-colors ${
                                            selected ? "border-accent bg-tint" : "border-line bg-surface hover:border-accent/40"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => toggleService(service.id)}
                                            className="size-4 shrink-0 accent-[#986a58]"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className={`block break-words text-sm ${selected ? "font-semibold" : "font-medium"}`}>{service.name}</span>
                                            <span className="mt-0.5 block text-[10px] text-muted">{service.duration_minutes} phút</span>
                                        </span>
                                        <span className="col-start-2 min-w-0 text-xs font-semibold tabular-nums">Giá tham khảo: {formatServicePrice(service)}</span>
                                    </label>
                                );
                            })
                        ) : (
                            <p className="rounded-[12px] border border-line bg-cream px-4 py-5 text-xs text-muted">
                                Hiện chưa có dịch vụ nào đủ thông tin thời lượng để đặt trực tuyến.
                            </p>
                        )}
                    </div>
                </section>

                <div className="mx-[clamp(1rem,2.5vw,2rem)] h-px bg-line" />

                <section className="min-w-0 p-[clamp(1rem,2.5vw,2rem)]">
                    <SectionHeading number="03" title="Số người" />
                    <div className="mt-6 min-w-0">
                        <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-[14px] border border-line bg-cream p-[clamp(0.75rem,2vw,1.125rem)]">
                            <div className="min-w-0 flex-[1_1_12rem]">
                                <p className="text-sm font-semibold">{partySize} người</p>
                                <p className="mt-1 text-[11px] leading-4 text-muted">
                                    {maxPartySize === null
                                        ? "Chọn dịch vụ để kiểm tra số nhân viên còn nhận lịch."
                                        : maxPartySize > 0
                                          ? `Khung giờ phù hợp có thể nhận tối đa ${maxPartySize} người cùng lúc.`
                                          : "Hiện chưa có nhân viên phù hợp tại chi nhánh này."}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => changePartySize(partySize - 1)}
                                    disabled={partySize <= 1}
                                    className="focus-ring grid size-10 place-items-center rounded-full border border-line bg-white text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-35"
                                    aria-label="Giảm số người"
                                >
                                    −
                                </button>
                                <span className="min-w-8 text-center font-serif text-2xl tabular-nums">{partySize}</span>
                                <button
                                    type="button"
                                    onClick={() => changePartySize(partySize + 1)}
                                    disabled={
                                        selectedServiceIds.length === 0 ||
                                        (maxPartySize !== null && partySize >= maxPartySize)
                                    }
                                    className="focus-ring grid size-10 place-items-center rounded-full border border-line bg-white text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-35"
                                    aria-label="Tăng số người"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mx-[clamp(1rem,2.5vw,2rem)] h-px bg-line" />

                <section className="min-w-0 p-[clamp(1rem,2.5vw,2rem)]">
                    <SectionHeading number="04" title="Ngày" helper="Đặt lịch trước tối thiểu 3 giờ và tối đa 14 ngày." />
                    <div className="mt-6 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,4.25rem),1fr))] gap-2">
                        {dates.map((date) => {
                            const selected = date.value === selectedDate;
                            return (
                                <button
                                    key={date.value}
                                    type="button"
                                    onClick={() => {
                                        setSelectedDate(date.value);
                                        // Also refetch when tapping the currently selected day.
                                        setAvailabilityRefreshKey((value) => value + 1);
                                        setAvailableSlots(new Map());
                                        setSelectedTime("");
                                        setFormError("");
                                    }}
                                    className={`focus-ring rounded-[12px] border px-2 py-3 text-center transition-colors ${
                                        selected ? "border-accent bg-accent text-white" : "border-line bg-cream hover:border-accent/45"
                                    }`}
                                >
                                    <span className={`block text-[9px] font-semibold tracking-wide ${selected ? "text-white/80" : "text-muted"}`}>{date.weekday}</span>
                                    <span className="mt-1 block font-serif text-xl leading-none">{date.day}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <div className="mx-[clamp(1rem,2.5vw,2rem)] h-px bg-line" />

                <section className="min-w-0 p-[clamp(1rem,2.5vw,2rem)]">
                    <SectionHeading number="05" title="Giờ còn trống" />
                    <div className="mt-6 min-w-0">
                        {selectedServiceIds.length === 0 ? (
                            <div className="rounded-[14px] border border-line bg-cream px-4 py-5 text-xs leading-5 text-muted">
                                Chọn dịch vụ trước để xem giờ còn trống.
                            </div>
                        ) : availabilityLoading ? (
                            <div className="space-y-3" aria-label="Đang tải khung giờ">
                                {Array.from({ length: 3 }, (_, index) => (
                                    <div key={index} className="h-[74px] animate-pulse rounded-[14px] border border-line bg-cream" />
                                ))}
                            </div>
                        ) : availabilityError ? (
                            <div role="alert" className="rounded-[14px] border border-[#cdaea1] bg-[#f7e8e3] px-4 py-5 text-xs leading-5 text-[#8b4334]">
                                <p>{availabilityError}</p>
                                <button
                                    type="button"
                                    onClick={() => setAvailabilityRefreshKey((value) => value + 1)}
                                    className="focus-ring mt-3 rounded-full border border-[#8b4334] px-4 py-2 font-semibold hover:bg-white"
                                >
                                    Thử kiểm tra lại giờ trống
                                </button>
                            </div>
                        ) : availableSlots.size === 0 ? (
                            <div className="rounded-[14px] border border-line bg-cream px-4 py-5">
                                <p className="text-sm font-semibold">Ngày này chưa còn giờ phù hợp cho {partySize} người.</p>
                                <p className="mt-1 text-xs leading-5 text-muted">Bạn có thể giảm số người hoặc chọn ngày khác.</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {timeGroups.map((group) => (
                                    <div key={group.label}>
                                        <p className="mb-2 text-xs font-semibold">{group.label}</p>
                                        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,4.4rem),1fr))] gap-2">
                                            {group.times.map((time) => {
                                                const available = availableSlots.has(time);
                                                const selected = time === selectedTime && available;

                                                return (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        disabled={!available}
                                                        onClick={() => {
                                                            setSelectedTime(time);
                                                            setFormError("");
                                                        }}
                                                        className={`focus-ring rounded-[10px] border px-2 py-2 text-[11px] tabular-nums transition-colors ${
                                                            selected
                                                                ? "border-accent bg-accent font-semibold text-white"
                                                                : !available
                                                                  ? "cursor-not-allowed border-transparent bg-[#efebe6] text-muted/40 line-through"
                                                                  : "border-line bg-white hover:border-accent/45"
                                                        }`}
                                                    >
                                                        {time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <div className="mx-[clamp(1rem,2.5vw,2rem)] h-px bg-line" />

                <section className="booking-contact-section min-w-0 p-[clamp(1rem,2.5vw,2rem)]">
                    <SectionHeading
                        number="06"
                        title="Thông tin liên hệ"
                    />
                    <div className="booking-contact-fields mt-6">
                        <div className="min-w-0 rounded-[12px] border border-line bg-cream px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Họ và tên</p>
                            <p className="mt-1 text-sm font-semibold">{user?.full_name || "—"}</p>
                        </div>
                        <div className="min-w-0 rounded-[12px] border border-line bg-cream px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Email tài khoản</p>
                            <p className="mt-1 break-all text-sm font-semibold">{user?.email || "—"}</p>
                        </div>
                        <label className="booking-contact-phone block min-w-0">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                                Số điện thoại liên lạc
                            </span>
                            <input
                                type="tel"
                                value={customerPhone}
                                onChange={(event) => {
                                    setCustomerPhone(event.target.value);
                                    setFormError("");
                                }}
                                placeholder="0901 234 567"
                                autoComplete="tel"
                                inputMode="tel"
                                required
                                className="focus-ring mt-2.5 h-12 w-full rounded-[12px] border border-line bg-cream px-4 text-sm outline-none placeholder:text-muted/45 hover:border-accent/45"
                            />
                        </label>
                    </div>
                </section>
            </div>

            <aside className="min-w-0 space-y-5">
                <section className="rounded-[22px] border-2 border-accent bg-surface p-5 shadow-[0_16px_40px_rgba(48,40,35,0.06)] sm:p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Lịch bạn đang chọn</p>
                    <h2 className="mt-2 font-serif text-3xl">Xem lại trước khi đặt</h2>
                    <div className="my-5 h-px bg-line" />

                    <div className="space-y-5">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">Chi nhánh</p>
                            <p className="mt-1 text-sm font-semibold">{selectedBranch ? shortBranchName(selectedBranch.name) : "Chọn chi nhánh"}</p>
                        </div>

                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">Dịch vụ</p>
                            <div className="mt-2 space-y-1.5">
                                {selectedServices.length > 0 ? (
                                    selectedServices.map((service) => (
                                        <div key={service.id} className="flex items-start justify-between gap-4 text-xs">
                                            <span>{service.name}</span>
                                            <span className="shrink-0 font-semibold tabular-nums">Giá tham khảo: {formatServicePrice(service)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted">Chưa chọn dịch vụ</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted">
                            <span>Số người</span>
                            <span className="font-semibold text-ink">{partySize}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted">
                            <span>Thời lượng dự kiến</span>
                            <span className="font-semibold text-ink">{totalDuration} phút</span>
                        </div>

                        <div>
                            <p className="text-sm font-semibold">{formatLongDate(selectedDate)}</p>
                            <p className="mt-1 text-xs text-muted">
                                {selectedTime && totalDuration > 0 ? `${selectedTime}–${endTime}` : "Chọn khung giờ còn trống"}
                            </p>
                        </div>
                    </div>

                    <div role="note" className="mt-5 rounded-xl border-2 border-[#a47560] bg-[#f9ede4] px-4 py-3 text-xs leading-5 text-[#623f33]">
                        <strong className="block text-sm">Giá có thể thay đổi</strong>
                        Đây là giá tham khảo khi đặt lịch, không phải số tiền thanh toán cuối cùng. Giá thực tế có thể cao hơn tùy tình trạng móng, mẫu, vật liệu và yêu cầu phát sinh. Nhân viên sẽ báo giá trước khi thực hiện.
                    </div>
                    <div className="my-5 h-px bg-line" />
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <span className="text-xs text-muted">Tổng giá tham khảo</span>
                        <span className="font-serif text-2xl tabular-nums">{formatVnd(totalPrice)} VND</span>
                    </div>

                    {formError ? <p className="mt-4 rounded-lg bg-[#f7e8e3] px-3 py-2 text-xs leading-5 text-[#8b4334]">{formError}</p> : null}

                    <button
                        type="submit"
                        disabled={!summaryReady || submitting}
                        className="focus-ring mt-5 w-full rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {submitting ? "Đang đặt lịch…" : "Đặt lịch"}
                    </button>
                </section>

                <section className="rounded-[20px] bg-tint p-5 sm:p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Thông tin cần biết</p>
                    <p className="mt-3 font-serif text-lg">{selectedBranch?.opening_hours || "09:00–20:30"}</p>
                    <p className="mt-3 text-xs leading-5 text-muted">Cần đổi hoặc hủy lịch, bạn có thể gọi trực tiếp cho tiệm.</p>
                    <a
                        href={selectedBranch?.phone ? `tel:${selectedBranch.phone.replace(/[^+\d]/g, "")}` : "tel:+84818798098"}
                        className="mt-3 block w-fit text-sm font-semibold hover:text-accent"
                    >
                        {selectedBranch?.phone || "081 879 8098"}
                    </a>
                </section>

            </aside>
        </form>

        {createdAppointment && typeof document !== "undefined" ? createPortal(
                <dialog
                    ref={successDialogRef}
                    aria-labelledby="booking-success-title"
                    aria-describedby="booking-success-status"
                    onCancel={(event) => {
                        event.preventDefault();
                        closeSuccessModal();
                    }}
                    className="booking-success-dialog booking-success-panel min-h-0 flex-col overflow-hidden rounded-[24px] border border-white/40 bg-surface p-0 focus:outline-none sm:rounded-[28px]"
                >
                    <div className="relative shrink-0 px-5 pb-4 pt-5 sm:px-8 sm:pb-5 sm:pt-7">
                        <button
                            type="button"
                            aria-label="Đóng thông báo"
                            onClick={closeSuccessModal}
                            className="focus-ring absolute right-5 top-5 flex size-9 items-center justify-center rounded-full border border-line bg-cream text-muted transition-colors hover:border-accent hover:text-ink sm:right-8 sm:top-7"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M4 4 20 20M20 4 4 20" />
                            </svg>
                        </button>

                        <div className="grid size-10 place-items-center rounded-full bg-tint text-accent sm:size-12">
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 sm:size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="m5 12.5 4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent sm:mt-4">Đặt lịch thành công</p>
                        <h2 id="booking-success-title" className="mt-1.5 max-w-[28rem] font-serif text-[clamp(1.5rem,5vw,2.35rem)] leading-[1.12] tracking-[-0.02em]">
                            Serpente đã nhận lịch của bạn
                        </h2>
                        <p id="booking-success-status" className="mt-3 inline-flex rounded-full border border-accent/35 bg-tint px-3 py-1.5 text-[11px] font-semibold text-accent">
                            Chờ tiệm xác nhận
                        </p>
                    </div>

                    <div className="booking-success-details min-h-0 touch-pan-y overflow-y-auto overscroll-contain border-t border-line px-5 py-4 sm:px-8 sm:py-5">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Chi nhánh</p>
                                <p className="mt-1 break-words text-sm font-semibold">{createdBranchName ? shortBranchName(createdBranchName) : "Đang cập nhật"}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Số người</p>
                                <p className="mt-1 text-sm font-semibold">{createdAppointment.party_size} người</p>
                            </div>
                            <div className="col-span-2 min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Thời gian</p>
                                <p className="mt-1 text-sm font-semibold">{formatLongDate(createdAppointment.start_time.slice(0, 10))}</p>
                                <p className="mt-0.5 text-xs text-muted">
                                    {formatSlotTime(createdAppointment.start_time)}–{formatSlotTime(createdAppointment.end_time)}
                                </p>
                            </div>
                            <div className="col-span-2 min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Dịch vụ</p>
                                <p className="mt-1 break-words text-sm leading-5">
                                    {(createdServices.length > 0 ? createdServices.map((service) => service.service_name) : selectedServices.map((service) => service.name)).join(" · ")}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid min-w-0 grid-cols-2 items-end gap-3 rounded-[16px] bg-cream p-3.5 sm:mt-5 sm:p-4">
                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">Mã lịch hẹn</p>
                                <p className="mt-1 break-all font-mono text-xs font-semibold tracking-[0.04em]">
                                    {(createdAppointment.booking_group_id ?? createdAppointment.id).slice(0, 8).toUpperCase()}
                                </p>
                            </div>
                            <div className="min-w-0 text-right">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">Tổng giá tham khảo</p>
                                <p className="mt-1 break-words font-serif text-[clamp(1rem,3.5vw,1.25rem)] tabular-nums">
                                    {formatVnd(createdServices.length > 0 ? createdTotalPrice : totalPrice)} VND
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="booking-success-actions grid shrink-0 grid-cols-2 gap-2 border-t border-line bg-surface px-5 py-4 sm:px-8 sm:py-5">
                        <button
                            type="button"
                            onClick={closeSuccessModal}
                            className="focus-ring min-h-11 min-w-0 rounded-full border border-line bg-surface px-3 py-3 text-xs font-semibold text-ink transition-colors hover:border-accent/50"
                        >
                            Đóng
                        </button>
                        <button
                            type="button"
                            onClick={viewMyAppointments}
                            className="focus-ring min-h-11 min-w-0 rounded-full bg-ink px-3 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            Xem lịch của tôi
                        </button>
                    </div>
                </dialog>,
            document.body,
        ) : null}
        </>
    );
}
