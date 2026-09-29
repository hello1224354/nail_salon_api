import { useState } from "react";
import { Link } from "react-router-dom";

type AppointmentStatus =
    | "PENDING"
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

type AppointmentFilter =
    | "ALL"
    | AppointmentStatus;

interface AdminAppointment {
    id: string;
    customerName: string;
    phone: string;
    date: string;
    time: string;
    branch: string;
    services: string[];
    durationMinutes: number;
    estimatedTotal: number;
    status: AppointmentStatus;
}

const appointments: AdminAppointment[] = [
    {
        id: "APT-001",
        customerName: "Nguyen Van A",
        phone: "0912345678",
        date: "02 Oct 2026",
        time: "10:30",
        branch: "Nail Studio District 1",
        services: [
            "Gel Manicure",
            "Nail Art",
        ],
        durationMinutes: 75,
        estimatedTotal: 370000,
        status: "PENDING",
    },
    {
        id: "APT-002",
        customerName: "Tran Thi B",
        phone: "0987654321",
        date: "02 Oct 2026",
        time: "14:00",
        branch: "Nail Studio District 1",
        services: [
            "Classic Pedicure",
        ],
        durationMinutes: 45,
        estimatedTotal: 180000,
        status: "PENDING",
    },
    {
        id: "APT-003",
        customerName: "Le Minh C",
        phone: "0901234567",
        date: "03 Oct 2026",
        time: "09:15",
        branch: "Nail Studio District 3",
        services: [
            "Classic Manicure",
        ],
        durationMinutes: 30,
        estimatedTotal: 120000,
        status: "CONFIRMED",
    },
    {
        id: "APT-004",
        customerName: "Pham Thi Lan",
        phone: "0934567890",
        date: "03 Oct 2026",
        time: "13:30",
        branch: "Nail Studio District 3",
        services: [
            "Gel Pedicure",
        ],
        durationMinutes: 60,
        estimatedTotal: 280000,
        status: "IN_PROGRESS",
    },
    {
        id: "APT-005",
        customerName: "Hoang Minh Anh",
        phone: "0976543210",
        date: "01 Oct 2026",
        time: "15:15",
        branch: "Nail Studio District 1",
        services: [
            "Classic Manicure",
            "Gel Removal",
        ],
        durationMinutes: 50,
        estimatedTotal: 200000,
        status: "COMPLETED",
    },
    {
        id: "APT-006",
        customerName: "Do Thu Trang",
        phone: "0965432109",
        date: "01 Oct 2026",
        time: "16:30",
        branch: "Nail Studio District 3",
        services: [
            "Spa Pedicure",
        ],
        durationMinutes: 60,
        estimatedTotal: 260000,
        status: "CANCELLED",
    },
];

const filters: {
    label: string;
    value: AppointmentFilter;
}[] = [
    {
        label: "New requests",
        value: "PENDING",
    },
    {
        label: "All",
        value: "ALL",
    },
    {
        label: "Confirmed",
        value: "CONFIRMED",
    },
    {
        label: "In progress",
        value: "IN_PROGRESS",
    },
    {
        label: "Completed",
        value: "COMPLETED",
    },
    {
        label: "Cancelled",
        value: "CANCELLED",
    },
];

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

function getStatusClassName(status: AppointmentStatus) {
    switch (status) {
        case "PENDING":
            return "bg-amber-100 text-amber-700";

        case "CONFIRMED":
            return "bg-emerald-100 text-emerald-700";

        case "IN_PROGRESS":
            return "bg-blue-100 text-blue-700";

        case "COMPLETED":
            return "bg-stone-200 text-stone-600";

        case "CANCELLED":
            return "bg-red-100 text-red-700";
    }
}

function AdminAppointmentsPage() {
    const [activeFilter, setActiveFilter] =
        useState<AppointmentFilter>("PENDING");

    const pendingCount = appointments.filter((appointment) => {
        return appointment.status === "PENDING";
    }).length;

    const filteredAppointments = appointments.filter((appointment) => {
        if (activeFilter === "ALL") {
            return true;
        }

        return appointment.status === activeFilter;
    });

    return (
        <main>
            <section className="border-b border-stone-200 bg-white">
                <div className="px-6 py-8 sm:px-8 lg:px-10">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                                Admin
                            </p>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                                Appointments
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                                Review booking requests and confirm appointments with customers by phone.
                            </p>
                        </div>

                        <div className="w-fit rounded-2xl bg-amber-50 px-4 py-3">
                            <p className="text-xs font-medium text-amber-600">
                                Waiting for confirmation
                            </p>

                            <p className="mt-1 text-2xl font-semibold text-amber-800">
                                {pendingCount}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-stone-200 bg-stone-50">
                <div className="flex gap-2 overflow-x-auto px-6 py-4 sm:px-8 lg:px-10">
                    {filters.map((filter) => {
                        const isActive =
                            activeFilter === filter.value;

                        return (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => {
                                    setActiveFilter(filter.value);
                                }}
                                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                                    isActive
                                        ? "bg-stone-900 text-white"
                                        : "bg-white text-stone-600 hover:bg-stone-200"
                                }`}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="px-6 py-8 sm:px-8 lg:px-10">
                {filteredAppointments.length === 0 ? (
                    <div className="rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center">
                        <h2 className="text-lg font-semibold">
                            No appointments
                        </h2>

                        <p className="mt-2 text-sm text-stone-500">
                            There are no appointments in this status.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {filteredAppointments.map((appointment) => {
                            return (
                                <article
                                    key={appointment.id}
                                    className="rounded-3xl border border-stone-200 bg-white"
                                >
                                    <div className="flex flex-col gap-5 border-b border-stone-200 p-6 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                                    {appointment.id}
                                                </p>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(
                                                        appointment.status
                                                    )}`}
                                                >
                                                    {appointment.status}
                                                </span>
                                            </div>

                                            <h2 className="mt-3 text-xl font-semibold">
                                                {appointment.customerName}
                                            </h2>

                                            <p className="mt-1 text-sm text-stone-500">
                                                {appointment.phone}
                                            </p>
                                        </div>

                                        <div className="sm:text-right">
                                            <p className="text-sm text-stone-500">
                                                Appointment time
                                            </p>

                                            <p className="mt-1 text-lg font-semibold">
                                                {appointment.date} · {appointment.time}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr_180px]">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                                Branch
                                            </p>

                                            <p className="mt-2 text-sm font-medium">
                                                {appointment.branch}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                                Services
                                            </p>

                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {appointment.services.map((service) => {
                                                    return (
                                                        <span
                                                            key={service}
                                                            className="rounded-full bg-stone-100 px-3 py-1.5 text-sm text-stone-700"
                                                        >
                                                            {service}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                                Estimate
                                            </p>

                                            <p className="mt-2 font-semibold">
                                                {formatPrice(
                                                    appointment.estimatedTotal
                                                )}
                                            </p>

                                            <p className="mt-1 text-sm text-stone-500">
                                                {appointment.durationMinutes} min
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 border-t border-stone-200 bg-stone-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            {appointment.status === "PENDING" ? (
                                                <>
                                                    <p className="text-sm font-medium">
                                                        Customer confirmation required
                                                    </p>

                                                    <p className="mt-1 text-sm text-stone-500">
                                                        Call the customer before confirming this appointment.
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-sm text-stone-500">
                                                    View the complete appointment information.
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <Link
                                                to={`/admin/appointments/${appointment.id}`}
                                                className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-stone-100"
                                            >
                                                View details
                                            </Link>

                                            {appointment.status === "PENDING" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-stone-100"
                                                    >
                                                        Call customer
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
                                                    >
                                                        Confirm appointment
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}

export default AdminAppointmentsPage;