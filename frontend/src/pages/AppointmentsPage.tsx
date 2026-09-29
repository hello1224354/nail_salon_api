interface AppointmentItem {
    id: string;
    date: string;
    time: string;
    services: string[];
    durationMinutes: number;
    totalPrice: number;
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
}

const appointments: AppointmentItem[] = [
    {
        id: "APT-001",
        date: "02 Oct 2026",
        time: "10:30",
        services: [
            "Gel Manicure",
            "Nail Art",
        ],
        durationMinutes: 75,
        totalPrice: 370000,
        status: "CONFIRMED",
    },
    {
        id: "APT-002",
        date: "08 Oct 2026",
        time: "14:00",
        services: [
            "Classic Pedicure",
        ],
        durationMinutes: 45,
        totalPrice: 180000,
        status: "PENDING",
    },
    {
        id: "APT-003",
        date: "20 Sep 2026",
        time: "09:15",
        services: [
            "Classic Manicure",
        ],
        durationMinutes: 30,
        totalPrice: 120000,
        status: "COMPLETED",
    },
];

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

function getStatusClassName(status: AppointmentItem["status"]) {
    switch (status) {
        case "CONFIRMED":
            return "bg-emerald-100 text-emerald-700";

        case "PENDING":
            return "bg-amber-100 text-amber-700";

        case "COMPLETED":
            return "bg-stone-200 text-stone-600";

        case "CANCELLED":
            return "bg-red-100 text-red-700";
    }
}

function AppointmentsPage() {
    return (
        <main className="min-h-[70vh]">
            <section className="border-b border-stone-200 bg-white">
                <div className="mx-auto max-w-7xl px-6 py-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Appointments
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                        My appointments
                    </h1>

                    <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                        View your upcoming and previous salon appointments.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10">
                <div className="flex flex-col gap-4">
                    {appointments.map((appointment) => {
                        return (
                            <article
                                key={appointment.id}
                                className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8"
                            >
                                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <p className="text-sm text-stone-400">
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

                                        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                            <h2 className="text-2xl font-semibold">
                                                {appointment.date}
                                            </h2>

                                            <p className="text-stone-500">
                                                at {appointment.time}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="md:text-right">
                                        <p className="text-sm text-stone-500">
                                            Total
                                        </p>

                                        <p className="mt-1 text-xl font-semibold">
                                            {formatPrice(
                                                appointment.totalPrice
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-6 border-t border-stone-200 pt-6 md:grid-cols-[1fr_auto] md:items-end">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                            Services
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {appointment.services.map(
                                                (service) => {
                                                    return (
                                                        <span
                                                            key={service}
                                                            className="rounded-full bg-stone-100 px-3 py-1.5 text-sm text-stone-700"
                                                        >
                                                            {service}
                                                        </span>
                                                    );
                                                }
                                            )}
                                        </div>

                                        <p className="mt-4 text-sm text-stone-500">
                                            {appointment.durationMinutes} min
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-stone-100"
                                    >
                                        View details
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}

export default AppointmentsPage;