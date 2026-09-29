import {
    useEffect,
    useMemo,
    useState,
} from "react";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../App";

interface ServiceOption {
    id: string;
    branchId: number;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
}

interface DateOption {
    value: string;
    weekday: string;
    day: string;
    month: string;
}

const services: ServiceOption[] = [
    {
        id: "classic-manicure",
        branchId: 1,
        name: "Classic Manicure",
        description: "Nail shaping, cuticle care and polish.",
        durationMinutes: 30,
        price: 120000,
    },
    {
        id: "gel-manicure",
        branchId: 1,
        name: "Gel Manicure",
        description: "Long-lasting gel color with full nail care.",
        durationMinutes: 45,
        price: 220000,
    },
    {
        id: "classic-pedicure",
        branchId: 1,
        name: "Classic Pedicure",
        description: "Foot soak, nail care and classic polish.",
        durationMinutes: 45,
        price: 180000,
    },
    {
        id: "nail-art",
        branchId: 1,
        name: "Nail Art",
        description: "Custom decorative details for your nails.",
        durationMinutes: 30,
        price: 150000,
    },
    {
        id: "spa-pedicure",
        branchId: 2,
        name: "Spa Pedicure",
        description: "Relaxing foot care, nail shaping and polished finish.",
        durationMinutes: 60,
        price: 260000,
    },
    {
        id: "gel-pedicure",
        branchId: 2,
        name: "Gel Pedicure",
        description: "Complete pedicure with long-lasting gel color.",
        durationMinutes: 60,
        price: 280000,
    },
    {
        id: "nail-extension",
        branchId: 2,
        name: "Nail Extension",
        description: "Add length and shape with a polished extension finish.",
        durationMinutes: 75,
        price: 350000,
    },
    {
        id: "gel-removal",
        branchId: 2,
        name: "Gel Removal",
        description: "Gentle gel polish removal and nail cleanup.",
        durationMinutes: 20,
        price: 80000,
    },
];

const dates: DateOption[] = [
    {
        value: "2026-10-01",
        weekday: "Thu",
        day: "01",
        month: "Oct",
    },
    {
        value: "2026-10-02",
        weekday: "Fri",
        day: "02",
        month: "Oct",
    },
    {
        value: "2026-10-03",
        weekday: "Sat",
        day: "03",
        month: "Oct",
    },
    {
        value: "2026-10-04",
        weekday: "Sun",
        day: "04",
        month: "Oct",
    },
    {
        value: "2026-10-05",
        weekday: "Mon",
        day: "05",
        month: "Oct",
    },
    {
        value: "2026-10-06",
        weekday: "Tue",
        day: "06",
        month: "Oct",
    },
    {
        value: "2026-10-07",
        weekday: "Wed",
        day: "07",
        month: "Oct",
    },
];

const availableTimes = [
    "09:00",
    "09:15",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "13:30",
    "14:00",
    "15:15",
    "16:30",
];

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

function BookPage() {
    const { selectedBranch } = useOutletContext<AppOutletContext>();

    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const branchServices = useMemo(() => {
        return services.filter((service) => {
            return service.branchId === selectedBranch.id;
        });
    }, [selectedBranch.id]);

    const selectedServices = useMemo(() => {
        return branchServices.filter((service) => {
            return selectedServiceIds.includes(service.id);
        });
    }, [
        branchServices,
        selectedServiceIds,
    ]);

    useEffect(() => {
        setSelectedServiceIds([]);
        setSelectedDate(null);
        setSelectedTime(null);
    }, [selectedBranch.id]);

    const totalDurationMinutes = selectedServices.reduce((total, service) => {
        return total + service.durationMinutes;
    }, 0);

    const totalPrice = selectedServices.reduce((total, service) => {
        return total + service.price;
    }, 0);

    const toggleService = (serviceId: string) => {
        setSelectedServiceIds((current) => {
            if (current.includes(serviceId)) {
                return current.filter((id) => {
                    return id !== serviceId;
                });
            }

            return [
                ...current,
                serviceId,
            ];
        });

        setSelectedDate(null);
        setSelectedTime(null);
    };

    const selectDate = (date: string) => {
        setSelectedDate(date);
        setSelectedTime(null);
    };

    return (
        <main className="min-h-[70vh]">
            <section className="border-b border-stone-200 bg-white">
                <div className="mx-auto max-w-7xl px-6 py-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Appointment
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                        Book your visit
                    </h1>

                    <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                        Select your services, choose a date and pick an available appointment time.
                    </p>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
                <div className="space-y-8">
                    <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                        <div className="flex items-start justify-between gap-6">
                            <div>
                                <p className="text-sm font-medium text-stone-500">
                                    Step 01
                                </p>

                                <h2 className="mt-1 text-2xl font-semibold">
                                    Choose services
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-stone-500">
                                    Select one or more treatments available at {selectedBranch.name}.
                                </p>
                            </div>

                            <p className="shrink-0 text-sm text-stone-500">
                                {selectedServiceIds.length} selected
                            </p>
                        </div>

                        {branchServices.length === 0 ? (
                            <div className="mt-6 rounded-2xl bg-stone-100 px-5 py-8 text-center text-sm text-stone-500">
                                This branch does not currently have any available services.
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                {branchServices.map((service) => {
                                    const selected = selectedServiceIds.includes(
                                        service.id
                                    );

                                    return (
                                        <button
                                            key={service.id}
                                            type="button"
                                            onClick={() => {
                                                toggleService(service.id);
                                            }}
                                            className={`rounded-2xl border p-5 text-left transition ${
                                                selected
                                                    ? "border-stone-900 bg-stone-900 text-white"
                                                    : "border-stone-200 bg-white hover:border-stone-400"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="font-semibold">
                                                        {service.name}
                                                    </h3>

                                                    <p
                                                        className={`mt-2 text-sm leading-6 ${
                                                            selected
                                                                ? "text-stone-300"
                                                                : "text-stone-500"
                                                        }`}
                                                    >
                                                        {service.description}
                                                    </p>
                                                </div>

                                                <div
                                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                                                        selected
                                                            ? "border-white bg-white text-stone-900"
                                                            : "border-stone-300"
                                                    }`}
                                                >
                                                    {selected ? "✓" : ""}
                                                </div>
                                            </div>

                                            <div
                                                className={`mt-5 flex items-center justify-between border-t pt-4 text-sm ${
                                                    selected
                                                        ? "border-stone-700 text-stone-300"
                                                        : "border-stone-100 text-stone-500"
                                                }`}
                                            >
                                                <span>
                                                    {service.durationMinutes} min
                                                </span>

                                                <span className="font-medium">
                                                    {formatPrice(service.price)}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                        <div>
                            <p className="text-sm font-medium text-stone-500">
                                Step 02
                            </p>

                            <h2 className="mt-1 text-2xl font-semibold">
                                Choose a date
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-stone-500">
                                Pick the day that works best for you.
                            </p>
                        </div>

                        {selectedServiceIds.length === 0 ? (
                            <div className="mt-6 rounded-2xl bg-stone-100 px-5 py-8 text-center text-sm text-stone-500">
                                Choose at least one service before selecting a date.
                            </div>
                        ) : (
                            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
                                {dates.map((date) => {
                                    const selected = selectedDate === date.value;

                                    return (
                                        <button
                                            key={date.value}
                                            type="button"
                                            onClick={() => {
                                                selectDate(date.value);
                                            }}
                                            className={`rounded-2xl border px-3 py-4 text-center transition ${
                                                selected
                                                    ? "border-stone-900 bg-stone-900 text-white"
                                                    : "border-stone-200 bg-white hover:border-stone-400"
                                            }`}
                                        >
                                            <p
                                                className={`text-xs ${
                                                    selected
                                                        ? "text-stone-300"
                                                        : "text-stone-500"
                                                }`}
                                            >
                                                {date.weekday}
                                            </p>

                                            <p className="mt-1 text-xl font-semibold">
                                                {date.day}
                                            </p>

                                            <p
                                                className={`text-xs ${
                                                    selected
                                                        ? "text-stone-300"
                                                        : "text-stone-500"
                                                }`}
                                            >
                                                {date.month}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                        <div>
                            <p className="text-sm font-medium text-stone-500">
                                Step 03
                            </p>

                            <h2 className="mt-1 text-2xl font-semibold">
                                Available time
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-stone-500">
                                Available slots are shown for your selected services.
                            </p>
                        </div>

                        {selectedServiceIds.length === 0 ? (
                            <div className="mt-6 rounded-2xl bg-stone-100 px-5 py-8 text-center text-sm text-stone-500">
                                Choose at least one service first.
                            </div>
                        ) : selectedDate === null ? (
                            <div className="mt-6 rounded-2xl bg-stone-100 px-5 py-8 text-center text-sm text-stone-500">
                                Choose a date to view available times.
                            </div>
                        ) : (
                            <>
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm font-medium">
                                        Available slots
                                    </p>

                                    <p className="text-xs text-stone-400">
                                        15-minute intervals
                                    </p>
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                                    {availableTimes.map((time) => {
                                        const selected = selectedTime === time;

                                        return (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTime(time);
                                                }}
                                                className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                                                    selected
                                                        ? "border-stone-900 bg-stone-900 text-white"
                                                        : "border-stone-200 bg-white hover:border-stone-500"
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </section>
                </div>

                <aside className="lg:sticky lg:top-6 lg:self-start">
                    <div className="rounded-3xl border border-stone-200 bg-white p-6">
                        <p className="text-sm font-medium text-stone-500">
                            Booking summary
                        </p>

                        <h2 className="mt-1 text-2xl font-semibold">
                            Your appointment request
                        </h2>

                        <div className="mt-6 border-t border-stone-200 pt-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                Salon
                            </p>

                            <p className="mt-3 text-sm font-medium">
                                {selectedBranch.name}
                            </p>

                            <p className="mt-1 text-sm leading-6 text-stone-500">
                                {selectedBranch.address}
                            </p>
                        </div>

                        <div className="mt-5 border-t border-stone-200 pt-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                Services
                            </p>

                            {selectedServices.length === 0 ? (
                                <p className="mt-3 text-sm text-stone-500">
                                    No services selected.
                                </p>
                            ) : (
                                <div className="mt-3 space-y-3">
                                    {selectedServices.map((service) => {
                                        return (
                                            <div
                                                key={service.id}
                                                className="flex justify-between gap-4 text-sm"
                                            >
                                                <span>
                                                    {service.name}
                                                </span>

                                                <span className="shrink-0 text-stone-500">
                                                    {formatPrice(service.price)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="mt-5 space-y-3 border-t border-stone-200 pt-5">
                            <div className="flex justify-between gap-4 text-sm">
                                <span className="text-stone-500">
                                    Duration
                                </span>

                                <span className="font-medium">
                                    {totalDurationMinutes > 0
                                        ? `${totalDurationMinutes} min`
                                        : "—"}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4 text-sm">
                                <span className="text-stone-500">
                                    Date
                                </span>

                                <span className="font-medium">
                                    {selectedDate ?? "—"}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4 text-sm">
                                <span className="text-stone-500">
                                    Time
                                </span>

                                <span className="font-medium">
                                    {selectedTime ?? "—"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-5">
                            <span className="font-medium">
                                Estimated total
                            </span>

                            <span className="text-xl font-semibold">
                                {formatPrice(totalPrice)}
                            </span>
                        </div>

                        <button
                            type="button"
                            disabled={
                                selectedServiceIds.length === 0 ||
                                selectedDate === null ||
                                selectedTime === null
                            }
                            className="mt-6 w-full rounded-full bg-stone-900 px-5 py-3 font-medium text-white transition enabled:hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                        >
                            Send booking request
                        </button>

                        <div className="mt-4 rounded-2xl bg-stone-100 px-4 py-3">
                            <p className="text-center text-xs leading-5 text-stone-500">
                                After you send your request, the salon will contact you by phone to confirm the appointment.
                            </p>
                        </div>

                        <p className="mt-3 text-center text-xs leading-5 text-stone-400">
                            An available nail technician will be assigned automatically.
                        </p>
                    </div>
                </aside>
            </section>
        </main>
    );
}

export default BookPage;