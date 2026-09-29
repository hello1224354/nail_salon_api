import { Link } from "react-router-dom";

const appointment = {
    id: "APT-001",
    date: "02 Oct 2026",
    weekday: "Friday",
    time: "10:30",
    branch: "Nail Studio District 1",
    address: "District 1, Ho Chi Minh City",
    services: [
        {
            name: "Gel Manicure",
            durationMinutes: 45,
            price: 220000,
        },
        {
            name: "Nail Art",
            durationMinutes: 30,
            price: 150000,
        },
    ],
    durationMinutes: 75,
    totalPrice: 370000,
    status: "CONFIRMED",
};

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

function AppointmentDetailsPage() {
    return (
        <main className="min-h-[70vh]">
            <section className="border-b border-stone-200 bg-white">
                <div className="mx-auto max-w-5xl px-6 py-10">
                    <Link
                        to="/appointments"
                        className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
                    >
                        ← Back to appointments
                    </Link>

                    <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                                Appointment
                            </p>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Appointment details
                            </h1>

                            <p className="mt-3 text-stone-500">
                                {appointment.id}
                            </p>
                        </div>

                        <span className="w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                            {appointment.status}
                        </span>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-5xl px-6 py-10">
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-6">
                        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <p className="text-sm font-medium text-stone-500">
                                Schedule
                            </p>

                            <div className="mt-6 grid gap-6 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                        Date
                                    </p>

                                    <p className="mt-2 text-xl font-semibold">
                                        {appointment.date}
                                    </p>

                                    <p className="mt-1 text-sm text-stone-500">
                                        {appointment.weekday}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                        Time
                                    </p>

                                    <p className="mt-2 text-xl font-semibold">
                                        {appointment.time}
                                    </p>

                                    <p className="mt-1 text-sm text-stone-500">
                                        {appointment.durationMinutes} minutes
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <p className="text-sm font-medium text-stone-500">
                                Salon
                            </p>

                            <h2 className="mt-2 text-xl font-semibold">
                                {appointment.branch}
                            </h2>

                            <p className="mt-2 text-sm text-stone-500">
                                {appointment.address}
                            </p>
                        </section>

                        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <p className="text-sm font-medium text-stone-500">
                                Services
                            </p>

                            <div className="mt-6 divide-y divide-stone-200">
                                {appointment.services.map((service) => {
                                    return (
                                        <div
                                            key={service.name}
                                            className="flex items-start justify-between gap-6 py-5 first:pt-0 last:pb-0"
                                        >
                                            <div>
                                                <p className="font-semibold">
                                                    {service.name}
                                                </p>

                                                <p className="mt-1 text-sm text-stone-500">
                                                    {service.durationMinutes} minutes
                                                </p>
                                            </div>

                                            <p className="shrink-0 font-medium">
                                                {formatPrice(service.price)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <aside>
                        <div className="rounded-3xl border border-stone-200 bg-white p-6">
                            <p className="text-sm font-medium text-stone-500">
                                Summary
                            </p>

                            <div className="mt-6 space-y-4 border-t border-stone-200 pt-5">
                                <div className="flex justify-between gap-4 text-sm">
                                    <span className="text-stone-500">
                                        Services
                                    </span>

                                    <span className="font-medium">
                                        {appointment.services.length}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4 text-sm">
                                    <span className="text-stone-500">
                                        Duration
                                    </span>

                                    <span className="font-medium">
                                        {appointment.durationMinutes} min
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4 text-sm">
                                    <span className="text-stone-500">
                                        Status
                                    </span>

                                    <span className="font-medium">
                                        {appointment.status}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-5">
                                <span className="font-medium">
                                    Total
                                </span>

                                <span className="text-xl font-semibold">
                                    {formatPrice(appointment.totalPrice)}
                                </span>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}

export default AppointmentDetailsPage;