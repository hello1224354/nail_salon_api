import { Link } from "react-router-dom";

function HomePage() {
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
                            Simple, polished treatments for your everyday nail care.
                        </p>
                    </div>

                    <Link
                        to="/services"
                        className="text-sm font-medium text-stone-600 underline underline-offset-4 transition hover:text-stone-900"
                    >
                        View all services
                    </Link>
                </div>

                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
                        <div className="flex h-44 items-center justify-center bg-stone-200 text-sm text-stone-500">
                            Manicure image
                        </div>

                        <div className="p-5">
                            <h3 className="text-lg font-semibold">
                                Classic Manicure
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-stone-500">
                                Nail shaping, cuticle care and classic polish.
                            </p>

                            <div className="mt-5 flex items-center justify-between text-sm">
                                <span className="text-stone-500">
                                    30 min
                                </span>

                                <span className="font-semibold">
                                    120.000 ₫
                                </span>
                            </div>
                        </div>
                    </article>

                    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
                        <div className="flex h-44 items-center justify-center bg-stone-200 text-sm text-stone-500">
                            Gel manicure image
                        </div>

                        <div className="p-5">
                            <h3 className="text-lg font-semibold">
                                Gel Manicure
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-stone-500">
                                Long-lasting gel color with complete nail care.
                            </p>

                            <div className="mt-5 flex items-center justify-between text-sm">
                                <span className="text-stone-500">
                                    45 min
                                </span>

                                <span className="font-semibold">
                                    220.000 ₫
                                </span>
                            </div>
                        </div>
                    </article>

                    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
                        <div className="flex h-44 items-center justify-center bg-stone-200 text-sm text-stone-500">
                            Pedicure image
                        </div>

                        <div className="p-5">
                            <h3 className="text-lg font-semibold">
                                Classic Pedicure
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-stone-500">
                                Foot soak, nail care and a clean classic finish.
                            </p>

                            <div className="mt-5 flex items-center justify-between text-sm">
                                <span className="text-stone-500">
                                    45 min
                                </span>

                                <span className="font-semibold">
                                    180.000 ₫
                                </span>
                            </div>
                        </div>
                    </article>

                    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
                        <div className="flex h-44 items-center justify-center bg-stone-200 text-sm text-stone-500">
                            Nail art image
                        </div>

                        <div className="p-5">
                            <h3 className="text-lg font-semibold">
                                Nail Art
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-stone-500">
                                Decorative details and custom designs for your nails.
                            </p>

                            <div className="mt-5 flex items-center justify-between text-sm">
                                <span className="text-stone-500">
                                    30 min
                                </span>

                                <span className="font-semibold">
                                    150.000 ₫
                                </span>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <section className="border-y border-stone-200 bg-white">
                <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 md:grid-cols-3">
                    <article className="rounded-2xl border border-stone-200 p-6">
                        <p className="text-sm text-stone-500">
                            Step 01
                        </p>

                        <h2 className="mt-2 text-xl font-semibold">
                            Choose services
                        </h2>

                        <p className="mt-3 leading-7 text-stone-600">
                            Select the nail services you want for your visit.
                        </p>
                    </article>

                    <article className="rounded-2xl border border-stone-200 p-6">
                        <p className="text-sm text-stone-500">
                            Step 02
                        </p>

                        <h2 className="mt-2 text-xl font-semibold">
                            Pick a time
                        </h2>

                        <p className="mt-3 leading-7 text-stone-600">
                            See available appointment times and choose one that works for you.
                        </p>
                    </article>

                    <article className="rounded-2xl border border-stone-200 p-6">
                        <p className="text-sm text-stone-500">
                            Step 03
                        </p>

                        <h2 className="mt-2 text-xl font-semibold">
                            Confirm booking
                        </h2>

                        <p className="mt-3 leading-7 text-stone-600">
                            Confirm your appointment and we will handle staff assignment automatically.
                        </p>
                    </article>
                </div>
            </section>
        </main>
    );
}

export default HomePage;