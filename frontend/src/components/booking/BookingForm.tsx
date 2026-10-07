"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
    ApiError,
    apiRequest,
    getApiErrorMessage,
    type Appointment,
    type Availability,
    type Branch,
    type BranchList,
    type ServiceList,
} from "@/lib/api";
import { clearSession, restoreSession, type AuthUser } from "@/lib/auth";
import {
    decorateService,
    formatVnd,
    localizeAddress,
    localizeBranchName,
    studio,
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
const CUSTOMER_ROLE = "customer";

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

function buildTimeGroups(): TimeGroup[] {
    const groups: TimeGroup[] = [
        { label: "Buổi sáng", times: [] },
        { label: "Buổi chiều", times: [] },
        { label: "Buổi tối", times: [] },
    ];

    for (let minuteOfDay = 9 * 60; minuteOfDay < 21 * 60; minuteOfDay += 15) {
        const hour = Math.floor(minuteOfDay / 60);
        const minute = minuteOfDay % 60;
        const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

        if (hour < 12) groups[0].times.push(label);
        else if (hour < 17) groups[1].times.push(label);
        else groups[2].times.push(label);
    }

    return groups;
}

const timeGroups = buildTimeGroups();

function formatDateRange(dates: BookingDate[]) {
    const first = dates[0];
    const last = dates.at(-1);
    if (!first || !last) return "";

    if (first.month === last.month && first.year === last.year) {
        return `${Number(first.day)}–${Number(last.day)} tháng ${Number(last.month)} năm ${last.year}`;
    }

    return `${Number(first.day)}/${Number(first.month)}/${first.year} – ${Number(last.day)}/${Number(last.month)}/${last.year}`;
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

function SectionHeading({ number, title, helper }: { number: string; title: string; helper?: string }) {
    return (
        <div>
            <div className="grid grid-cols-[46px_1fr] items-baseline sm:grid-cols-[60px_1fr]">
                <span className="font-serif text-[24px] font-medium leading-none tracking-[0.05em] text-accent sm:text-[26px]">{number}</span>
                <h2 className="font-serif text-2xl tracking-[-0.015em] sm:text-[30px]">{title}</h2>
            </div>
            {helper ? <p className="mt-2 pl-[46px] text-xs leading-5 text-muted sm:pl-[60px]">{helper}</p> : null}
        </div>
    );
}

export function BookingForm() {
    const router = useRouter();
    const dates = useMemo(() => getBusinessDates(), []);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
    const [services, setServices] = useState<StudioService[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [partySize, setPartySize] = useState(1);
    const [maxPartySize, setMaxPartySize] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(dates[0]?.value ?? "");
    const [availableSlots, setAvailableSlots] = useState<Map<string, string>>(new Map());
    const [selectedTime, setSelectedTime] = useState("");
    const [initialLoading, setInitialLoading] = useState(true);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
    const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);

    const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;
    const selectedServices = useMemo(
        () => services.filter((service) => selectedServiceIds.includes(service.id)),
        [selectedServiceIds, services]
    );
    const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration_minutes, 0);
    const pricePerPerson = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const totalPrice = pricePerPerson * partySize;
    const endTime = selectedTime && totalDuration > 0 ? addMinutes(selectedTime, totalDuration) : "";
    const createdServices = createdAppointment?.appointment_services ?? [];
    const createdTotalPrice =
        createdServices.reduce((sum, service) => sum + service.price, 0) *
        (createdAppointment?.party_size ?? 1);

    useEffect(() => {
        let cancelled = false;

        async function loadBookingContext() {
            try {
                const restored = await restoreSession();

                if (!restored) {
                    if (!cancelled) router.replace("/login");
                    return;
                }

                const [currentUser, branchData] = await Promise.all([
                    apiRequest<AuthUser>("/api/users/me"),
                    apiRequest<BranchList>("/api/branches?page=1&limit=100"),
                ]);

                if (cancelled) return;

                if (currentUser.role.toLowerCase() !== CUSTOMER_ROLE) {
                    setFormError("Trang đặt lịch này chỉ dành cho tài khoản khách hàng.");
                    setUser(currentUser);
                    setBranches(branchData.branches);
                    return;
                }

                setUser(currentUser);
                setBranches(branchData.branches);
                setSelectedBranchId(branchData.branches[0]?.id ?? null);
                setServicesLoading(branchData.branches.length > 0);
            } catch (loadError) {
                if (cancelled) return;

                if (loadError instanceof ApiError && loadError.status === 401) {
                    clearSession();
                    router.replace("/login");
                    return;
                }

                setFormError(getApiErrorMessage(loadError, "Không thể tải thông tin đặt lịch."));
            } finally {
                if (!cancelled) setInitialLoading(false);
            }
        }

        loadBookingContext();

        return () => {
            cancelled = true;
        };
    }, [router]);

    useEffect(() => {
        if (selectedBranchId === null || !user || user.role.toLowerCase() !== CUSTOMER_ROLE) {
            return;
        }

        let cancelled = false;

        async function loadServices() {
            try {
                const data = await apiRequest<ServiceList>(
                    `/api/services?branch_id=${selectedBranchId}&page=1&limit=100`
                );

                if (!cancelled) {
                    setServices(data.services.map(decorateService));
                }
            } catch (loadError) {
                if (!cancelled) {
                    setServices([]);
                    setFormError(getApiErrorMessage(loadError, "Không thể tải danh sách dịch vụ."));
                }
            } finally {
                if (!cancelled) setServicesLoading(false);
            }
        }

        loadServices();

        return () => {
            cancelled = true;
        };
    }, [selectedBranchId, user]);

    useEffect(() => {
        if (!user || user.role.toLowerCase() !== CUSTOMER_ROLE || selectedServiceIds.length === 0 || !selectedDate) {
            return;
        }

        let cancelled = false;

        async function loadAvailability() {
            try {
                const params = new URLSearchParams({
                    service_ids: selectedServiceIds.join(","),
                    date: `${selectedDate}T00:00:00+07:00`,
                    party_size: String(partySize),
                });
                const data = await apiRequest<Availability>(
                    `/api/appointments/availability?${params.toString()}`
                );

                if (cancelled) return;

                const slotMap = new Map<string, string>();
                for (const slot of data.slots) {
                    slotMap.set(formatSlotTime(slot), slot);
                }

                setMaxPartySize(data.max_party_size);
                setAvailableSlots(slotMap);
                setSelectedTime((current) => (slotMap.has(current) ? current : ""));
            } catch (loadError) {
                if (cancelled) return;

                if (loadError instanceof ApiError && loadError.status === 401) {
                    clearSession();
                    router.replace("/login");
                    return;
                }

                setAvailableSlots(new Map());
                setSelectedTime("");
                setFormError(getApiErrorMessage(loadError, "Không thể tải các khung giờ còn trống."));
            } finally {
                if (!cancelled) setAvailabilityLoading(false);
            }
        }

        loadAvailability();

        return () => {
            cancelled = true;
        };
    }, [availabilityRefreshKey, partySize, router, selectedDate, selectedServiceIds, user]);

    useEffect(() => {
        if (!createdAppointment) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeSuccessModal();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [createdAppointment]);

    function closeSuccessModal() {
        setCreatedAppointment(null);
        setSelectedServiceIds([]);
        setPartySize(1);
        setMaxPartySize(null);
        setSelectedTime("");
        setAvailableSlots(new Map());
        setAvailabilityLoading(false);
        setFormError("");
    }

    function viewMyAppointments() {
        closeSuccessModal();
        router.push("/appointments");
    }

    const handleBranchChange = (branchId: number) => {
        if (branchId === selectedBranchId) return;

        setSelectedBranchId(branchId);
        setServices([]);
        setServicesLoading(true);
        setSelectedServiceIds([]);
        setPartySize(1);
        setMaxPartySize(null);
        setAvailableSlots(new Map());
        setAvailabilityLoading(false);
        setSelectedTime("");
        setFormError("");
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
        setAvailabilityLoading(next.length > 0);
    };

    function changePartySize(nextPartySize: number) {
        if (nextPartySize < 1) return;
        if (maxPartySize !== null && nextPartySize > maxPartySize) return;

        setPartySize(nextPartySize);
        setSelectedTime("");
        setAvailableSlots(new Map());
        setAvailabilityLoading(selectedServiceIds.length > 0);
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

        if (user.role.toLowerCase() !== CUSTOMER_ROLE) {
            setFormError("Trang đặt lịch này chỉ dành cho tài khoản khách hàng.");
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
                    }),
                }
            );

            setCreatedAppointment(appointment);
            setSelectedTime("");
            setAvailabilityLoading(true);
            setAvailabilityRefreshKey((value) => value + 1);
        } catch (submitError) {
            if (submitError instanceof ApiError && submitError.status === 401) {
                clearSession();
                router.replace("/login");
                return;
            }

            setFormError(getApiErrorMessage(submitError, "Không thể tạo yêu cầu đặt lịch."));
        } finally {
            setSubmitting(false);
        }
    }

    const summaryReady =
        selectedServices.length > 0 &&
        selectedDate.length > 0 &&
        selectedTime.length > 0 &&
        availableSlots.has(selectedTime) &&
        user?.role.toLowerCase() === CUSTOMER_ROLE;

    if (initialLoading) {
        return (
            <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start xl:gap-10" aria-label="Đang tải biểu mẫu đặt lịch">
                <div className="h-[900px] animate-pulse rounded-[22px] border border-line bg-surface" />
                <div className="h-[520px] animate-pulse rounded-[22px] border border-line bg-surface" />
            </div>
        );
    }

    return (
        <>
        <form onSubmit={handleSubmit} className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start xl:gap-10">
            <div className="overflow-hidden rounded-[22px] border border-line bg-surface">
                <section className="p-5 sm:p-7 lg:p-8">
                    <SectionHeading number="01" title="Chi nhánh" helper="Chọn chi nhánh đang hoạt động của salon." />
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:pl-[60px]">
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
                                        <span>
                                            <span className="block text-sm font-semibold">{localizeBranchName(branch.name)}</span>
                                            <span className="mt-1 block text-[11px] leading-4 text-muted">{localizeAddress(branch.address)}</span>
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

                <div className="mx-5 h-px bg-line sm:mx-7 lg:mx-8" />

                <section className="p-5 sm:p-7 lg:p-8">
                    <SectionHeading number="02" title="Dịch vụ" helper="Chọn một hoặc nhiều dịch vụ cho buổi hẹn của bạn." />
                    <div className="mt-6 space-y-2 sm:pl-[60px]">
                        {servicesLoading ? (
                            Array.from({ length: 5 }, (_, index) => (
                                <div key={index} className="h-[62px] animate-pulse rounded-[12px] border border-line bg-cream" />
                            ))
                        ) : services.length > 0 ? (
                            services.map((service) => {
                                const selected = selectedServiceIds.includes(service.id);
                                return (
                                    <label
                                        key={service.id}
                                        className={`flex cursor-pointer items-center gap-3 rounded-[12px] border px-3 py-2.5 transition-colors ${
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
                                            <span className={`block truncate text-sm ${selected ? "font-semibold" : "font-medium"}`}>{service.name}</span>
                                            <span className="mt-0.5 block text-[10px] text-muted">{service.duration_minutes} phút</span>
                                        </span>
                                        <span className="shrink-0 text-xs font-semibold tabular-nums">{formatVnd(service.price)} VND</span>
                                    </label>
                                );
                            })
                        ) : (
                            <p className="rounded-[12px] border border-line bg-cream px-4 py-5 text-xs text-muted">
                                Chi nhánh này hiện chưa có dịch vụ đang hoạt động.
                            </p>
                        )}
                    </div>
                </section>

                <div className="mx-5 h-px bg-line sm:mx-7 lg:mx-8" />

                <section className="p-5 sm:p-7 lg:p-8">
                    <SectionHeading
                        number="03"
                        title="Số người"
                        helper="Mỗi người sẽ được hệ thống tự gán một nhân viên khác nhau đang rảnh trong cùng khung giờ."
                    />
                    <div className="mt-6 sm:pl-[60px]">
                        <div className="flex max-w-sm items-center justify-between rounded-[14px] border border-line bg-cream p-3">
                            <div>
                                <p className="text-sm font-semibold">{partySize} người</p>
                                <p className="mt-1 text-[11px] leading-4 text-muted">
                                    {maxPartySize === null
                                        ? "Chọn dịch vụ để kiểm tra sức chứa nhân viên."
                                        : maxPartySize > 0
                                          ? `Tối đa ${maxPartySize} người cùng lúc với dịch vụ đã chọn.`
                                          : "Hiện chưa có nhân viên phù hợp tại chi nhánh này."}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
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

                <div className="mx-5 h-px bg-line sm:mx-7 lg:mx-8" />

                <section className="p-5 sm:p-7 lg:p-8">
                    <SectionHeading number="04" title="Ngày" helper={`Có thể đặt lịch: ${formatDateRange(dates)}`} />
                    <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-7 sm:pl-[60px]">
                        {dates.map((date) => {
                            const selected = date.value === selectedDate;
                            return (
                                <button
                                    key={date.value}
                                    type="button"
                                    onClick={() => {
                                        setSelectedDate(date.value);
                                        setAvailableSlots(new Map());
                                        setAvailabilityLoading(selectedServiceIds.length > 0);
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

                <div className="mx-5 h-px bg-line sm:mx-7 lg:mx-8" />

                <section className="p-5 sm:p-7 lg:p-8">
                    <SectionHeading number="05" title="Giờ còn trống" helper={`Chỉ hiện các giờ còn đủ ${partySize} nhân viên khác nhau.`} />
                    <div className="mt-6 sm:pl-[60px]">
                        {selectedServiceIds.length === 0 ? (
                            <div className="rounded-[14px] border border-line bg-cream px-4 py-5 text-xs leading-5 text-muted">
                                Chọn ít nhất một dịch vụ để xem các khung giờ còn trống.
                            </div>
                        ) : availabilityLoading ? (
                            <div className="space-y-3" aria-label="Đang tải khung giờ">
                                {Array.from({ length: 3 }, (_, index) => (
                                    <div key={index} className="h-[74px] animate-pulse rounded-[14px] border border-line bg-cream" />
                                ))}
                            </div>
                        ) : availableSlots.size === 0 ? (
                            <div className="rounded-[14px] border border-line bg-cream px-4 py-5">
                                <p className="text-sm font-semibold">Không còn khung giờ đủ nhân viên cho {partySize} người.</p>
                                <p className="mt-1 text-xs leading-5 text-muted">Giảm số người hoặc chọn một ngày khác để kiểm tra lại.</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {timeGroups.map((group) => (
                                    <div key={group.label}>
                                        <p className="mb-2 text-xs font-semibold">{group.label}</p>
                                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
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

                <div className="mx-5 h-px bg-line sm:mx-7 lg:mx-8" />

                <section className="p-5 sm:p-7 lg:p-8">
                    <SectionHeading number="06" title="Thông tin tài khoản" helper="Một yêu cầu nhóm sẽ tạo lịch riêng cho từng người dưới cùng tài khoản đặt lịch." />
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:pl-[60px]">
                        <div className="rounded-[12px] border border-line bg-cream px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Họ và tên</p>
                            <p className="mt-1 text-sm font-semibold">{user?.full_name || "—"}</p>
                        </div>
                        <div className="rounded-[12px] border border-line bg-cream px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Số điện thoại</p>
                            <p className="mt-1 text-sm font-semibold">{user?.phone || "—"}</p>
                        </div>
                        <div className="rounded-[12px] border border-line bg-cream px-4 py-3 sm:col-span-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Email</p>
                            <p className="mt-1 text-sm font-semibold">{user?.email || "Chưa cung cấp"}</p>
                        </div>
                    </div>
                </section>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-[98px]">
                <section className="rounded-[22px] border-2 border-accent bg-surface p-5 shadow-[0_16px_40px_rgba(48,40,35,0.06)] sm:p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Tóm tắt đặt lịch</p>
                    <h2 className="mt-2 font-serif text-3xl">Yêu cầu của bạn</h2>
                    <div className="my-5 h-px bg-line" />

                    <div className="space-y-5">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">Chi nhánh</p>
                            <p className="mt-1 text-sm font-semibold">{selectedBranch ? localizeBranchName(selectedBranch.name) : "Chọn chi nhánh"}</p>
                        </div>

                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">Dịch vụ đã chọn</p>
                            <div className="mt-2 space-y-1.5">
                                {selectedServices.length > 0 ? (
                                    selectedServices.map((service) => (
                                        <div key={service.id} className="flex items-start justify-between gap-4 text-xs">
                                            <span>{service.name}</span>
                                            <span className="shrink-0 font-semibold tabular-nums">{formatVnd(service.price)}</span>
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
                            <span>Thời lượng mỗi người</span>
                            <span className="font-semibold text-ink">{totalDuration} phút</span>
                        </div>

                        <div>
                            <p className="text-sm font-semibold">{formatLongDate(selectedDate)}</p>
                            <p className="mt-1 text-xs text-muted">
                                {selectedTime && totalDuration > 0 ? `${selectedTime}–${endTime}` : "Chọn khung giờ còn trống"}
                            </p>
                        </div>
                    </div>

                    <div className="my-5 h-px bg-line" />
                    <div className="flex items-end justify-between gap-4">
                        <span className="text-xs text-muted">Tổng dự kiến</span>
                        <span className="font-serif text-2xl tabular-nums">{formatVnd(totalPrice)} VND</span>
                    </div>

                    {formError ? <p className="mt-4 rounded-lg bg-[#f7e8e3] px-3 py-2 text-xs leading-5 text-[#8b4334]">{formError}</p> : null}

                    <button
                        type="submit"
                        disabled={!summaryReady || submitting}
                        className="focus-ring mt-5 w-full rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {submitting ? "Đang gửi…" : "Gửi"}
                    </button>
                </section>

                <section className="rounded-[20px] bg-tint p-5 sm:p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Thông tin cần biết</p>
                    <p className="mt-3 font-serif text-lg">Hằng ngày 09:00–21:00</p>
                    <p className="mt-3 text-xs leading-5 text-muted">Cần thay đổi hoặc hủy lịch? Hãy gọi cho salon.</p>
                    <a href={studio.phoneHref} className="mt-3 block w-fit text-sm font-semibold hover:text-accent">
                        {studio.phoneDisplay}
                    </a>
                </section>

            </aside>
        </form>

        {createdAppointment ? (
            <div
                className="booking-success-overlay fixed inset-0 z-[100] flex items-end justify-center bg-ink/60 px-0 sm:items-center sm:px-6"
                role="presentation"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) closeSuccessModal();
                }}
            >
                <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="booking-success-title"
                    className="booking-success-panel relative max-h-[calc(100dvh-24px)] w-full max-w-[560px] overflow-y-auto rounded-t-[28px] border border-white/40 bg-surface p-6 shadow-[0_-18px_70px_rgba(48,40,35,0.28)] sm:rounded-[28px] sm:p-8 sm:shadow-[0_28px_90px_rgba(48,40,35,0.28)]"
                >
                    <button
                        type="button"
                        aria-label="Đóng thông báo"
                        onClick={closeSuccessModal}
                        className="focus-ring absolute right-5 top-5 grid size-9 place-items-center rounded-full border border-line bg-cream text-lg leading-none text-muted transition-colors hover:border-accent hover:text-ink"
                    >
                        ×
                    </button>

                    <div className="grid size-12 place-items-center rounded-full bg-tint text-accent sm:size-14">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 sm:size-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="m5 12.5 4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Đã gửi</p>
                    <h2 id="booking-success-title" className="mt-2 pr-10 font-serif text-[34px] leading-[1.05] tracking-[-0.025em] sm:text-[42px]">
                        Yêu cầu đặt lịch đã được ghi nhận
                    </h2>
                    <div className="mt-4 inline-flex rounded-full border border-accent/35 bg-tint px-3 py-1.5 text-[11px] font-semibold text-accent">
                        Đang chờ xác nhận
                    </div>

                    <div className="my-6 h-px bg-line" />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Chi nhánh</p>
                            <p className="mt-1 text-sm font-semibold">{selectedBranch ? localizeBranchName(selectedBranch.name) : "—"}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Thời gian</p>
                            <p className="mt-1 text-sm font-semibold">{formatLongDate(createdAppointment.start_time.slice(0, 10))}</p>
                            <p className="mt-0.5 text-xs text-muted">
                                {formatSlotTime(createdAppointment.start_time)}–{formatSlotTime(createdAppointment.end_time)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Số người</p>
                            <p className="mt-1 text-sm font-semibold">{createdAppointment.party_size} người</p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Dịch vụ mỗi người</p>
                            <p className="mt-1 text-sm leading-6">
                                {(createdServices.length > 0 ? createdServices.map((service) => service.service_name) : selectedServices.map((service) => service.name)).join(" · ")}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex items-end justify-between gap-5 rounded-[18px] bg-cream p-4">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Mã nhóm đặt lịch</p>
                            <p className="mt-1 font-mono text-xs font-semibold tracking-[0.04em]">
                                {(createdAppointment.booking_group_id ?? createdAppointment.id).slice(0, 8).toUpperCase()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Tổng dự kiến cả nhóm</p>
                            <p className="mt-1 font-serif text-xl tabular-nums">{formatVnd(createdServices.length > 0 ? createdTotalPrice : totalPrice)} VND</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-2 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={closeSuccessModal}
                            className="focus-ring rounded-full border border-line bg-surface px-5 py-3.5 text-xs font-semibold text-ink transition-colors hover:border-accent/50"
                        >
                            Đóng
                        </button>
                        <button
                            type="button"
                            onClick={viewMyAppointments}
                            className="focus-ring rounded-full bg-ink px-5 py-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            Xem lịch của tôi
                        </button>
                    </div>
                </section>
            </div>
        ) : null}
        </>
    );
}
