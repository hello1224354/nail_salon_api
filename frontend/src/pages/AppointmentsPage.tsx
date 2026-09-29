interface AppointmentItem {
    id: string;
    date: string;
    weekday: string;
    time: string;
    branch: string;
    address: string;
    services: string[];
    durationMinutes: number;
    totalPrice: number;
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
}

const appointments: AppointmentItem[] = [
    {
        id: "APT-001",
        date: "02 Oct 2026",
        weekday: "Friday",
        time: "10:30",
        branch: "Nail Studio District 1",
        address: "District 1, Ho Chi Minh City",
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
        weekday: "Thursday",
        time: "14:00",
        branch: "Nail Studio District 3",
        address: "District 3, Ho Chi Minh City",
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
        weekday: "Sunday",
        time: "09:15",
        branch: "Nail Studio District 1",
        address: "District 1, Ho Chi Minh City",
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

                    <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                My appointments
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                                Keep track of your upcoming visits and previous nail appointments.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="w-fit rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
                        >
                            Book new appointment
                        </button>
                    </div>
                </div>
            </section>

            <section className="border-b border-stone-200 bg-stone-100">
                <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-4">
                    <button
                        type="button"
                        className="shrink-0 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
                    >
                        All appointments
                    </button>

                    <button
                        type="button"
                        className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200"
                    >
                        Upcoming
                    </button>

                    <button
                        type="button"
                        className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200"
                    >
                        Completed
                    </button>

                    <button
                        type="button"
                        className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200"
                    >
                        Cancelled
                    </button>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Upcoming
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                            2
                        </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Completed
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                            1
                        </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Total visits
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                            3
                        </p>
                    </div>
                </div>

                <div className="space-y-5">
                    {appointments.map((appointment) => {
                        return (
                            <article
                                key={appointment.id}
                                className="overflow-hidden rounded-3xl border border-stone-200 bg-white"
                            >
                                <div className="grid md:grid-cols-[200px_1fr]">
                                    <div className="border-b border-stone-200 bg-stone-100 p-6 md:border-b-0 md:border-r">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                                            {appointment.weekday}
                                        </p>

                                        <p className="mt-2 text-2xl font-semibold">
                                            {appointment.date}
                                        </p>

                                        <p className="mt-4 text-3xl font-semibold tracking-tight">
                                            {appointment.time}
                                        </p>

                                        <span
                                            className={`mt-5 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClassName(
                                                appointment.status
                                            )}`}
                                        >
                                            {appointment.status}
                                        </span>
                                    </div>

                                    <div className="p-6 sm:p-8">
                                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                                    {appointment.id}
                                                </p>

                                                <h2 className="mt-2 text-xl font-semibold">
                                                    {appointment.branch}
                                                </h2>

                                                <p className="mt-1 text-sm text-stone-500">
                                                    {appointment.address}
                                                </p>
                                            </div>

                                            <div className="lg:text-right">
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

                                        <div className="mt-7 border-t border-stone-200 pt-6">
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
                                        </div>

                                        <div className="mt-6 flex flex-col gap-5 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-xs uppercase tracking-wider text-stone-400">
                                                    Estimated duration
                                                </p>

                                                <p className="mt-1 text-sm font-medium">
                                                    {appointment.durationMinutes} minutes
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    type="button"
                                                    className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-stone-100"
                                                >
                                                    View details
                                                </button>

                                                {appointment.status === "COMPLETED" && (
                                                    <button
                                                        type="button"
                                                        className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
                                                    >
                                                        Book again
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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