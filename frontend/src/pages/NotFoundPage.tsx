import { Link } from "react-router-dom";

function NotFoundPage() {
    return (
        <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
            <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">
                    404
                </p>

                <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                    Page not found
                </h1>

                <p className="mx-auto mt-4 max-w-md leading-7 text-stone-500">
                    The page you are looking for does not exist.
                </p>

                <Link
                    to="/"
                    className="mt-8 inline-flex rounded-full bg-stone-900 px-6 py-3 font-medium text-white transition hover:bg-stone-700"
                >
                    Back to home
                </Link>
            </div>
        </main>
    );
}

export default NotFoundPage;