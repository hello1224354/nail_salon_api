function App() {
    return (
        <div className="min-h-screen bg-stone-50 text-stone-900">
            <header className="border-b border-stone-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div>
                        <p className="text-xl font-semibold tracking-tight">
                            Nail Studio
                        </p>
                        <p className="text-sm text-stone-500">
                            Beauty & Nail Care
                        </p>
                    </div>

                    <nav className="hidden items-center gap-8 md:flex">
                        <button
                            type="button"
                            className="font-medium text-stone-900"
                        >
                            Home
                        </button>

                        <button
                            type="button"
                            className="text-stone-500 transition hover:text-stone-900"
                        >
                            Book
                        </button>

                        <button
                            type="button"
                            className="text-stone-500 transition hover:text-stone-900"
                        >
                            Appointments
                        </button>

                        <button
                            type="button"
                            className="text-stone-500 transition hover:text-stone-900"
                        >
                            Profile
                        </button>
                    </nav>

                    <button
                        type="button"
                        className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
                    >
                        Book now
                    </button>
                </div>
            </header>

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
                            Choose your services, pick an available time, and let
                            us take care of the rest.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <button
                                type="button"
                                className="rounded-full bg-stone-900 px-6 py-3 font-medium text-white transition hover:bg-stone-700"
                            >
                                Book appointment
                            </button>

                            <button
                                type="button"
                                className="rounded-full border border-stone-300 bg-white px-6 py-3 font-medium transition hover:bg-stone-100"
                            >
                                View services
                            </button>
                        </div>
                    </div>

                    <div className="min-h-[420px] rounded-3xl bg-stone-200">
                        <div className="flex h-full min-h-[420px] items-center justify-center text-stone-500">
                            Salon image
                        </div>
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
                                See available appointment times and choose one
                                that works for you.
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
                                Confirm your appointment and we will handle staff
                                assignment automatically.
                            </p>
                        </article>
                    </div>
                </section>
            </main>

            <footer className="bg-stone-950 text-stone-300">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-white">
                        Nail Studio
                    </p>

                    <p className="text-sm text-stone-500">
                        Nail salon appointment system
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;