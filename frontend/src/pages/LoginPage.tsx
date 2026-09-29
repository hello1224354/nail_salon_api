import { Link } from "react-router-dom";

function LoginPage() {
    return (
        <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
            <div className="w-full max-w-md">
                <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Account
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Sign in
                    </h1>

                    <p className="mt-3 leading-7 text-stone-600">
                        Enter your phone number and password.
                    </p>

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
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
                            />
                        </div>

                        <label className="flex items-center gap-3 text-sm text-stone-600">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                            />

                            Remember me
                        </label>

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
                </div>
            </div>
        </main>
    );
}

export default LoginPage;