import { Link, useParams } from "react-router-dom";

type AppointmentStatus =
    | "PENDING"
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

interface AppointmentService {
    name: string;
    durationMinutes: number;
    price: number;
}

interface AdminAppointmentDetails {
    id: string;
    customerName: string;
    phone: string;
    date: string;
    time: string;
    branch: string;
    staffName: string;
    services: AppointmentService[];
    status: AppointmentStatus;
}

const appointments: Record<string, AdminAppointmentDetails> = {
    "APT-001": {
        id: "APT-001",
        customerName: "Nguyen Van A",
        phone: "0912345678",
        date: "02 Oct 2026",
        time: "10:30",
        branch: "Nail Studio District 1",
        staffName: "Nguyen Thi Mai",
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
        status: "PENDING",
    },
    "APT-002": {
        id: "APT-002",
        customerName: "Tran Thi B",
        phone: "0987654321",
        date: "02 Oct 2026",
        time: "14:00",
        branch: "Nail Studio District 1",
        staffName: "Tran Ngoc Anh",
        services: [
            {
                name: "Classic Pedicure",
                durationMinutes: 45,
                price: 180000,
            },
        ],
        status: "PENDING",
    },
    "APT-003": {
        id: "APT-003",
        customerName: "Le Minh C",
        phone: "0901234567",
        date: "03 Oct 2026",
        time: "09:15",
        branch: "Nail Studio District 3",
        staffName: "Le Thu Ha",
        services: [
            {
                name: "Classic Manicure",
                durationMinutes: 30,
                price: 120000,
            },
        ],
        status: "CONFIRMED",
    },
};

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

function AdminAppointmentDetailsPage() {
    const { id } = useParams();

    const appointment =
        id !== undefined
            ? appointments[id]
            : undefined;

    if (appointment === undefined) {
        return (
            <main className="px-6 py-12 sm:px-8 lg:px-10">
                <div className="max-w-2xl rounded-3xl border border-stone-200 bg-white p-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">
                        Appointment
                    </p>

                    <h1 className="mt-3 text-2xl font-semibold">
                        Appointment not found
                    </h1>

                    <p className="mt-3 text-stone-500">
                        The requested appointment could not be found.
                    </p>

                    <Link
                        to="/admin/appointments"
                        className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
                    >
                        Back to appointments
                    </Link>
                </div>
            </main>
        );
    }

    const totalDuration = appointment.services.reduce(
        (total, service) => {
            return total + service.durationMinutes;
        },
        0
    );

    const estimatedTotal = appointment.services.reduce(
        (total, service) => {
            return total + service.price;
        },
        0
    );

    return (
        <main>
            <section className="border-b border-stone-200 bg-white">
                <div className="px-6 py-8 sm:px-8 lg:px-10">
                    <Link
                        to="/admin/appointments"
                        className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
                    >
                        ← Back to appointments
                    </Link>

                    <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                                Appointment
                            </p>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                                {appointment.id}
                            </h1>

                            <p className="mt-3 text-stone-600">
                                Review the booking request before confirming it with the customer.
                            </p>
                        </div>

                        <span
                            className={`w-fit rounded-full px-4 py-2 text-xs font-semibold ${getStatusClassName(
                                appointment.status
                            )}`}
                        >
                            {appointment.status}
                        </span>
                    </div>
                </div>
            </section>

            <section className="px-6 py-8 sm:px-8 lg:px-10">
                <div className="grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <p className="text-sm font-medium text-stone-500">
                                Customer
                            </p>

                            <div className="mt-5 border-t border-stone-200 pt-5">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                            Full name
                                        </p>

                                        <p className="mt-2 font-semibold">
                                            {appointment.customerName}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                            Phone
                                        </p>

                                        <p className="mt-2 font-semibold">
                                            {appointment.phone}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <p className="text-sm font-medium text-stone-500">
                                Schedule
                            </p>

                            <div className="mt-5 grid gap-6 border-t border-stone-200 pt-5 sm:grid-cols-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                        Date
                                    </p>

                                    <p className="mt-2 font-semibold">
                                        {appointment.date}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                        Time
                                    </p>

                                    <p className="mt-2 font-semibold">
                                        {appointment.time}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                        Duration
                                    </p>

                                    <p className="mt-2 font-semibold">
                                        {totalDuration} min
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-stone-200 pt-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                    Branch
                                </p>

                                <p className="mt-2 font-semibold">
                                    {appointment.branch}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <p className="text-sm font-medium text-stone-500">
                                Services
                            </p>

                            <div className="mt-5 divide-y divide-stone-200 border-t border-stone-200">
                                {appointment.services.map((service) => {
                                    return (
                                        <div
                                            key={service.name}
                                            className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <p className="font-semibold">
                                                    {service.name}
                                                </p>

                                                <p className="mt-1 text-sm text-stone-500">
                                                    {service.durationMinutes} min
                                                </p>
                                            </div>

                                            <p className="font-semibold">
                                                {formatPrice(service.price)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-3xl border border-stone-200 bg-white p-6">
                            <p className="text-sm font-medium text-stone-500">
                                Appointment summary
                            </p>

                            <div className="mt-5 space-y-4 border-t border-stone-200 pt-5">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-stone-500">
                                        Services
                                    </span>

                                    <span className="text-sm font-medium">
                                        {appointment.services.length}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-stone-500">
                                        Duration
                                    </span>

                                    <span className="text-sm font-medium">
                                        {totalDuration} min
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-4 border-t border-stone-200 pt-4">
                                    <span className="font-medium">
                                        Estimated total
                                    </span>

                                    <span className="text-lg font-semibold">
                                        {formatPrice(estimatedTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-stone-200 bg-white p-6">
                            <p className="text-sm font-medium text-stone-500">
                                Assigned staff
                            </p>

                            <div className="mt-5 border-t border-stone-200 pt-5">
                                <p className="font-semibold">
                                    {appointment.staffName}
                                </p>
                            </div>
                        </div>

                        {appointment.status === "PENDING" && (
                            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                                <p className="font-semibold text-amber-900">
                                    Customer confirmation required
                                </p>

                                <p className="mt-2 text-sm leading-6 text-amber-800">
                                    Call the customer before confirming this appointment.
                                </p>

                                <div className="mt-5 space-y-3">
                                    <button
                                        type="button"
                                        className="w-full rounded-full border border-amber-300 bg-white px-5 py-3 text-sm font-medium text-stone-900 transition hover:bg-amber-100"
                                    >
                                        Call customer
                                    </button>

                                    <button
                                        type="button"
                                        className="w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
                                    >
                                        Confirm appointment
                                    </button>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </section>
        </main>
    );
}

export default AdminAppointmentDetailsPage;