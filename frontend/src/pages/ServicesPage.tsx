import { Link } from "react-router-dom";

interface ServiceItem {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
}

interface BranchServices {
    id: number;
    name: string;
    address: string;
    services: ServiceItem[];
}

const branches: BranchServices[] = [
    {
        id: 1,
        name: "Nail Studio District 1",
        address: "District 1, Ho Chi Minh City",
        services: [
            {
                id: "classic-manicure",
                name: "Classic Manicure",
                description: "Nail shaping, cuticle care and classic polish.",
                durationMinutes: 30,
                price: 120000,
            },
            {
                id: "gel-manicure",
                name: "Gel Manicure",
                description: "Long-lasting gel color with complete nail care.",
                durationMinutes: 45,
                price: 220000,
            },
            {
                id: "classic-pedicure",
                name: "Classic Pedicure",
                description: "Foot soak, nail care and a clean classic finish.",
                durationMinutes: 45,
                price: 180000,
            },
            {
                id: "nail-art",
                name: "Nail Art",
                description: "Decorative details and custom designs for your nails.",
                durationMinutes: 30,
                price: 150000,
            },
        ],
    },
    {
        id: 2,
        name: "Nail Studio District 3",
        address: "District 3, Ho Chi Minh City",
        services: [
            {
                id: "classic-manicure-d3",
                name: "Classic Manicure",
                description: "Nail shaping, cuticle care and classic polish.",
                durationMinutes: 30,
                price: 120000,
            },
            {
                id: "gel-manicure-d3",
                name: "Gel Manicure",
                description: "Long-lasting gel color with complete nail care.",
                durationMinutes: 45,
                price: 220000,
            },
            {
                id: "spa-pedicure",
                name: "Spa Pedicure",
                description: "Extended foot care with nail shaping and polish.",
                durationMinutes: 60,
                price: 260000,
            },
            {
                id: "nail-art-d3",
                name: "Nail Art",
                description: "Decorative details and custom designs for your nails.",
                durationMinutes: 30,
                price: 150000,
            },
        ],
    },
];

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

function ServicesPage() {
    return (
        <main className="min-h-[70vh]">
            <section className="border-b border-stone-200 bg-white">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Nail care
                    </p>

                    <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                                Services for your next visit.
                            </h1>

                            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
                                Explore available nail treatments, estimated duration and pricing at each Nail Studio location.
                            </p>
                        </div>

                        <Link
                            to="/book"
                            className="w-fit shrink-0 rounded-full bg-stone-900 px-6 py-3 font-medium text-white transition hover:bg-stone-700"
                        >
                            Book appointment
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-12">
                <div className="space-y-16">
                    {branches.map((branch, branchIndex) => {
                        return (
                            <section key={branch.id}>
                                <div className="flex flex-col gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-stone-400">
                                            Location {String(branchIndex + 1).padStart(2, "0")}
                                        </p>

                                        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                                            {branch.name}
                                        </h2>

                                        <p className="mt-2 text-sm text-stone-500">
                                            {branch.address}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-stone-500">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                        <span>
                                            Open daily · 09:00–21:00
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                    {branch.services.map((service) => {
                                        return (
                                            <article
                                                key={service.id}
                                                className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:border-stone-400"
                                            >
                                                <div className="relative flex h-44 items-center justify-center overflow-hidden bg-stone-200">
                                                    <span className="text-sm text-stone-500">
                                                        Service image
                                                    </span>

                                                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-600 backdrop-blur">
                                                        {service.durationMinutes} min
                                                    </span>
                                                </div>

                                                <div className="flex flex-1 flex-col p-5">
                                                    <h3 className="text-lg font-semibold">
                                                        {service.name}
                                                    </h3>

                                                    <p className="mt-2 flex-1 text-sm leading-6 text-stone-500">
                                                        {service.description}
                                                    </p>

                                                    <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
                                                        <span className="text-sm text-stone-500">
                                                            From
                                                        </span>

                                                        <span className="font-semibold">
                                                            {formatPrice(service.price)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </section>

            <section className="border-t border-stone-200 bg-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Ready to book?
                        </p>

                        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                            Choose your salon, services and available time.
                        </h2>

                        <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                            You do not need to choose a nail technician. An available staff member will be assigned automatically.
                        </p>
                    </div>

                    <Link
                        to="/book"
                        className="w-fit rounded-full bg-stone-900 px-6 py-3 font-medium text-white transition hover:bg-stone-700"
                    >
                        Start booking
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default ServicesPage;