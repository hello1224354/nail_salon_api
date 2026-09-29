import { Link } from "react-router-dom";

function LoginPage() {
    return (
        <main className="flex min-h-[70vh] items-center justify-center px-6 py-12">
            <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Welcome back
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Sign in
                    </h1>

                    <p className="mt-3 leading-7 text-stone-600">
                        Sign in to manage your appointments and book your next visit.
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
                            className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-stone-900"
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
                            className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-stone-900"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-full bg-stone-900 px-5 py-3 font-medium text-white transition hover:bg-stone-700"
                    >
                        Sign in
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-stone-500">
                    New customer?{" "}
                    <Link
                        to="/register"
                        className="font-medium text-stone-900 underline underline-offset-4"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default LoginPage;