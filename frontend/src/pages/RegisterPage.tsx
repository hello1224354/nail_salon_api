import { Link } from "react-router-dom";

function RegisterPage() {
    return (
        <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
            <div className="w-full max-w-lg">
                <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Account
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Create an account
                    </h1>

                    <p className="mt-3 leading-7 text-stone-600">
                        Enter your customer information below.
                    </p>

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
                        </div>

                        <div>
                            <div className="flex items-center justify-between gap-4">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-stone-700"
                                >
                                    Email address
                                </label>

                                <span className="text-xs text-stone-400">
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
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-stone-700"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
                            />

                            <p className="mt-2 text-xs text-stone-400">
                                Minimum 8 characters.
                            </p>
                        </div>

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
        </main>
    );
}

export default RegisterPage;