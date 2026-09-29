import { Link, useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../App";

interface PopularService {
    id: string;
    branchId: number;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    imageLabel: string;
}

const popularServices: PopularService[] = [
    {
        id: "classic-manicure",
        branchId: 1,
        name: "Classic Manicure",
        description: "Nail shaping, cuticle care and classic polish.",
        durationMinutes: 30,
        price: 120000,
        imageLabel: "Manicure image",
    },
    {
        id: "gel-manicure",
        branchId: 1,
        name: "Gel Manicure",
        description: "Long-lasting gel color with complete nail care.",
        durationMinutes: 45,
        price: 220000,
        imageLabel: "Gel manicure image",
    },
    {
        id: "classic-pedicure",
        branchId: 1,
        name: "Classic Pedicure",
        description: "Foot soak, nail care and a clean classic finish.",
        durationMinutes: 45,
        price: 180000,
        imageLabel: "Pedicure image",
    },
    {
        id: "nail-art",
        branchId: 1,
        name: "Nail Art",
        description: "Decorative details and custom designs for your nails.",
        durationMinutes: 30,
        price: 150000,
        imageLabel: "Nail art image",
    },
    {
        id: "spa-pedicure",
        branchId: 2,
        name: "Spa Pedicure",
        description: "Relaxing foot care, nail shaping and polished finish.",
        durationMinutes: 60,
        price: 260000,
        imageLabel: "Spa pedicure image",
    },
    {
        id: "gel-pedicure",
        branchId: 2,
        name: "Gel Pedicure",
        description: "Complete pedicure finished with long-lasting gel color.",
        durationMinutes: 60,
        price: 280000,
        imageLabel: "Gel pedicure image",
    },
    {
        id: "nail-extension",
        branchId: 2,
        name: "Nail Extension",
        description: "Add length and shape with a polished extension finish.",
        durationMinutes: 75,
        price: 350000,
        imageLabel: "Nail extension image",
    },
    {
        id: "gel-removal",
        branchId: 2,
        name: "Gel Removal",
        description: "Gentle removal of existing gel polish and nail cleanup.",
        durationMinutes: 20,
        price: 80000,
        imageLabel: "Gel removal image",
    },
];

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

function HomePage() {
    const { selectedBranch } = useOutletContext<AppOutletContext>();

    const branchServices = popularServices.filter((service) => {
        return service.branchId === selectedBranch.id;
    });

    return (
        <main>
            <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
                <div>
                    <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Nail care made simple
                    </p>

                    <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                        Your next nail appointment, without the waiting.
                    </h1>

                    <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
                        Choose your services, pick an available time, and let us take care of the rest.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            to="/book"
                            className="rounded-full bg-stone-900 px-6 py-3 font-medium text-white transition hover:bg-stone-700"
                        >
                            Book appointment
                        </Link>

                        <Link
                            to="/services"
                            className="rounded-full border border-stone-300 bg-white px-6 py-3 font-medium transition hover:bg-stone-100"
                        >
                            View services
                        </Link>
                    </div>
                </div>

                <div className="relative min-h-[420px] overflow-hidden rounded-3xl bg-stone-200">
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-stone-500">
                        Salon image
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/60 bg-white/90 p-5 backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Easy booking
                        </p>

                        <div className="mt-3 flex items-end justify-between gap-4">
                            <div>
                                <p className="text-lg font-semibold">
                                    Pick a service and time
                                </p>

                                <p className="mt-1 text-sm text-stone-500">
                                    We assign an available nail technician for you.
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-stone-900" />
                                <span className="h-2 w-2 rounded-full bg-stone-300" />
                                <span className="h-2 w-2 rounded-full bg-stone-300" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 pb-16 lg:pb-24">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Our services
                        </p>

                        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                            Popular nail treatments
                        </h2>

                        <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                            Available treatments at {selectedBranch.name}.
                        </p>
                    </div>

                    <Link
                        to="/services"
                        className="text-sm font-medium text-stone-600 underline underline-offset-4 transition hover:text-stone-900"
                    >
                        View all services
                    </Link>
                </div>

                {branchServices.length === 0 ? (
                    <div className="mt-8 rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center">
                        <h3 className="text-lg font-semibold">
                            No services available
                        </h3>

                        <p className="mt-2 text-sm text-stone-500">
                            This branch does not currently have any available services.
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {branchServices.map((service) => {
                            return (
                                <article
                                    key={service.id}
                                    className="overflow-hidden rounded-3xl border border-stone-200 bg-white"
                                >
                                    <div className="flex h-44 items-center justify-center bg-stone-200 text-sm text-stone-500">
                                        {service.imageLabel}
                                    </div>

                                    <div className="p-5">
                                        <h3 className="text-lg font-semibold">
                                            {service.name}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-stone-500">
                                            {service.description}
                                        </p>

                                        <div className="mt-5 flex items-center justify-between text-sm">
                                            <span className="text-stone-500">
                                                {service.durationMinutes} min
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
                )}
            </section>
        </main>
    );
}

export default HomePage;