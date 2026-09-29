import { Link } from "react-router-dom";

function RegisterPage() {
    return (
        <main className="min-h-[70vh]">
            <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_520px] lg:items-stretch lg:py-16">
                <div className="relative hidden min-h-[700px] overflow-hidden rounded-3xl bg-stone-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">
                            Nail Studio
                        </p>

                        <h1 className="mt-4 max-w-lg text-5xl font-semibold leading-tight tracking-tight">
                            Create your customer account.
                        </h1>

                        <p className="mt-6 max-w-lg text-lg leading-8 text-stone-300">
                            Book nail treatments, keep track of upcoming visits and manage your appointment history from one place.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-stone-700 bg-stone-800/70 p-5">
                            <div className="flex items-start gap-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-semibold text-stone-900">
                                    1
                                </span>

                                <div>
                                    <p className="font-semibold">
                                        Create your profile
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-stone-300">
                                        Add your name, phone number and optional email address.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-stone-700 bg-stone-800/70 p-5">
                            <div className="flex items-start gap-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-semibold text-stone-900">
                                    2
                                </span>

                                <div>
                                    <p className="font-semibold">
                                        Choose your appointment
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-stone-300">
                                        Select a salon, services, date and available time.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-stone-700 bg-stone-800/70 p-5">
                            <div className="flex items-start gap-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-semibold text-stone-900">
                                    3
                                </span>

                                <div>
                                    <p className="font-semibold">
                                        Manage your visits
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-stone-300">
                                        Review your upcoming and completed appointments.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-stone-700" />

                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-stone-700" />
                </div>

                <div className="flex items-center">
                    <div className="w-full rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 lg:p-10">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                                New customer
                            </p>

                            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Create an account
                            </h2>

                            <p className="mt-3 leading-7 text-stone-600">
                                Set up your Nail Studio customer profile.
                            </p>
                        </div>

                        <form
                            className="mt-8 space-y-5"
                            onSubmit={(event) => {
                                event.preventDefault();
                            }}
                        >
                            <div>
                                <label
                                    htmlFor="fullName"
                                    className="text-sm font-medium text-stone-700"
                                >
                                    Full name
                                </label>

                                <input
                                    id="fullName"
                                    name="full_name"
                                    type="text"
                                    autoComplete="name"
                                    placeholder="Nguyen Van A"
                                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="phone"
                                    className="text-sm font-medium text-stone-700"
                                >
                                    Phone number
                                </label>

                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    placeholder="0912345678"
                                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
                                />

                                <p className="mt-2 text-xs text-stone-400">
                                    This number will be used for your customer account.
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between gap-4">
                                    <label
                                        htmlFor="email"
                                        className="text-sm font-medium text-stone-700"
                                    >
                                        Email address
                                    </label>

                                    <span className="text-xs font-medium text-stone-400">
                                        Optional
                                    </span>
                                </div>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="customer@example.com"
                                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between gap-4">
                                    <label
                                        htmlFor="password"
                                        className="text-sm font-medium text-stone-700"
                                    >
                                        Password
                                    </label>

                                    <span className="text-xs font-medium text-stone-400">
                                        Minimum 8 characters
                                    </span>
                                </div>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Create a password"
                                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
                                />
                            </div>

                            <label className="flex items-start gap-3 rounded-2xl bg-stone-100 p-4">
                                <input
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 accent-stone-900"
                                />

                                <span className="text-sm leading-6 text-stone-600">
                                    I agree to the appointment and account terms for this salon service.
                                </span>
                            </label>

                            <button
                                type="submit"
                                className="w-full rounded-full bg-stone-900 px-5 py-3.5 font-medium text-white transition hover:bg-stone-700"
                            >
                                Create account
                            </button>
                        </form>

                        <div className="mt-8 border-t border-stone-200 pt-6">
                            <p className="text-center text-sm text-stone-500">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="font-semibold text-stone-900 underline underline-offset-4"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default RegisterPage;