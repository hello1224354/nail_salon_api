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
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
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
];

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

function getStatusClassName(status: AdminAppointment["status"]) {
    switch (status) {
        case "PENDING":
            return "bg-amber-100 text-amber-700";

        case "CONFIRMED":
            return "bg-emerald-100 text-emerald-700";

        case "COMPLETED":
            return "bg-stone-200 text-stone-600";

        case "CANCELLED":
            return "bg-red-100 text-red-700";
    }
}

function AdminAppointmentsPage() {
    const pendingCount = appointments.filter((appointment) => {
        return appointment.status === "PENDING";
    }).length;

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
                    <button
                        type="button"
                        className="shrink-0 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
                    >
                        New requests
                    </button>

                    <button
                        type="button"
                        className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200"
                    >
                        All
                    </button>

                    <button
                        type="button"
                        className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200"
                    >
                        Confirmed
                    </button>

                    <button
                        type="button"
                        className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200"
                    >
                        Completed
                    </button>
                </div>
            </section>

            <section className="px-6 py-8 sm:px-8 lg:px-10">
                <div className="space-y-5">
                    {appointments.map((appointment) => {
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

                                {appointment.status === "PENDING" ? (
                                    <div className="flex flex-col gap-4 border-t border-stone-200 bg-stone-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-medium">
                                                Customer confirmation required
                                            </p>

                                            <p className="mt-1 text-sm text-stone-500">
                                                Call the customer before confirming this appointment.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
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
                                        </div>
                                    </div>
                                ) : null}
                            </article>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}

export default AdminAppointmentsPage;