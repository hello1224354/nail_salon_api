import { Link } from "react-router-dom";

function LoginPage() {
    return (
        <main className="min-h-[70vh]">
            <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_480px] lg:items-stretch lg:py-16">
                <div className="relative hidden min-h-[620px] overflow-hidden rounded-3xl bg-stone-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">
                            Nail Studio
                        </p>

                        <h1 className="mt-4 max-w-lg text-5xl font-semibold leading-tight tracking-tight">
                            Your appointments, all in one place.
                        </h1>

                        <p className="mt-6 max-w-lg text-lg leading-8 text-stone-300">
                            Sign in to view upcoming visits, check appointment details and book your next nail treatment.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-stone-700 bg-stone-800/70 p-5">
                            <p className="text-2xl font-semibold">
                                01
                            </p>

                            <p className="mt-2 text-sm text-stone-300">
                                Choose your services
                            </p>
                        </div>

                        <div className="rounded-2xl border border-stone-700 bg-stone-800/70 p-5">
                            <p className="text-2xl font-semibold">
                                02
                            </p>

                            <p className="mt-2 text-sm text-stone-300">
                                Pick an available time
                            </p>
                        </div>

                        <div className="rounded-2xl border border-stone-700 bg-stone-800/70 p-5">
                            <p className="text-2xl font-semibold">
                                03
                            </p>

                            <p className="mt-2 text-sm text-stone-300">
                                Manage your visits
                            </p>
                        </div>
                    </div>

                    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-stone-700" />

                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-stone-700" />
                </div>

                <div className="flex items-center">
                    <div className="w-full rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 lg:p-10">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                                Welcome back
                            </p>

                            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Sign in
                            </h2>

                            <p className="mt-3 leading-7 text-stone-600">
                                Access your Nail Studio customer account.
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
                                    Use the phone number linked to your account.
                                </p>
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
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
                                />
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <label className="flex items-center gap-3 text-sm text-stone-600">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                                    />

                                    Remember me
                                </label>

                                <button
                                    type="button"
                                    className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-full bg-stone-900 px-5 py-3.5 font-medium text-white transition hover:bg-stone-700"
                            >
                                Sign in
                            </button>
                        </form>

                        <div className="mt-8 border-t border-stone-200 pt-6">
                            <p className="text-center text-sm text-stone-500">
                                New customer?{" "}
                                <Link
                                    to="/register"
                                    className="font-semibold text-stone-900 underline underline-offset-4"
                                >
                                    Create an account
                                </Link>
                            </p>
                        </div>

                        <div className="mt-6 rounded-2xl bg-stone-100 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                Customer access
                            </p>

                            <p className="mt-2 text-sm leading-6 text-stone-500">
                                Sign in to view your profile and appointment history.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default LoginPage;