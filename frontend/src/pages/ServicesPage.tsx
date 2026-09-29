interface ServiceItem {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
}

const services: ServiceItem[] = [
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
    {
        id: "spa-pedicure",
        name: "Spa Pedicure",
        description: "Relaxing foot care, nail shaping and polished finish.",
        durationMinutes: 60,
        price: 260000,
    },
    {
        id: "gel-pedicure",
        name: "Gel Pedicure",
        description: "Complete pedicure finished with long-lasting gel color.",
        durationMinutes: 60,
        price: 280000,
    },
    {
        id: "nail-extension",
        name: "Nail Extension",
        description: "Add length and shape with a polished extension finish.",
        durationMinutes: 75,
        price: 350000,
    },
    {
        id: "gel-removal",
        name: "Gel Removal",
        description: "Gentle removal of existing gel polish and nail cleanup.",
        durationMinutes: 20,
        price: 80000,
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
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                                Nail care
                            </p>

                            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                                Our services
                            </h1>

                            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
                                Explore nail treatments, estimated duration and pricing available at Nail Studio.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="mt-1 hidden shrink-0 items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 sm:flex"
                        >
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />

                            <span>
                                District 1
                            </span>

                            <svg
                                viewBox="0 0 20 20"
                                fill="none"
                                className="h-4 w-4 text-stone-400"
                                aria-hidden="true"
                            >
                                <path
                                    d="M6 8L10 12L14 8"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>

                    <button
                        type="button"
                        className="mt-6 flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 sm:hidden"
                    >
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        <span>
                            District 1
                        </span>

                        <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            className="h-4 w-4 text-stone-400"
                            aria-hidden="true"
                        >
                            <path
                                d="M6 8L10 12L14 8"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
                <div className="mb-8 flex items-end justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Available treatments
                        </h2>

                        <p className="mt-2 text-sm text-stone-500">
                            Showing services available at District 1.
                        </p>
                    </div>

                    <p className="hidden text-sm text-stone-400 sm:block">
                        {services.length} services
                    </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {services.map((service) => {
                        return (
                            <article
                                key={service.id}
                                className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:border-stone-400"
                            >
                                <div className="relative flex h-48 items-center justify-center overflow-hidden bg-stone-200">
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

                                    <div className="mt-6 flex items-end justify-between border-t border-stone-100 pt-4">
                                        <span className="text-sm text-stone-500">
                                            Price
                                        </span>

                                        <span className="text-lg font-semibold">
                                            {formatPrice(service.price)}
                                        </span>
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

export default ServicesPage;