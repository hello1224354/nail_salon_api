import { NavLink, Outlet } from "react-router-dom";

function App() {
    const desktopNavClassName = ({ isActive }: { isActive: boolean }) => {
        return isActive
            ? "font-medium text-stone-900"
            : "text-stone-500 transition hover:text-stone-900";
    };

    const mobileNavClassName = ({ isActive }: { isActive: boolean }) => {
        return isActive
            ? "rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            : "rounded-full px-4 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900";
    };

    return (
        <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
            <header className="border-b border-stone-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
                    <NavLink
                        to="/"
                        className="shrink-0"
                    >
                        <p className="text-xl font-semibold tracking-tight">
                            Nail Studio
                        </p>

                        <p className="text-sm text-stone-500">
                            Beauty & Nail Care
                        </p>
                    </NavLink>

                    <nav className="hidden items-center gap-8 md:flex">
                        <NavLink
                            to="/"
                            end
                            className={desktopNavClassName}
                        >
                            Home
                        </NavLink>

                        <NavLink
                            to="/services"
                            className={desktopNavClassName}
                        >
                            Services
                        </NavLink>

                        <NavLink
                            to="/book"
                            className={desktopNavClassName}
                        >
                            Book
                        </NavLink>

                        <NavLink
                            to="/appointments"
                            className={desktopNavClassName}
                        >
                            Appointments
                        </NavLink>

                        <NavLink
                            to="/profile"
                            className={desktopNavClassName}
                        >
                            Profile
                        </NavLink>
                    </nav>

                    <div className="flex shrink-0 items-center gap-3">
                        <NavLink
                            to="/login"
                            className="hidden text-sm font-medium text-stone-600 transition hover:text-stone-900 sm:block"
                        >
                            Sign in
                        </NavLink>

                        <NavLink
                            to="/book"
                            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
                        >
                            Book now
                        </NavLink>
                    </div>
                </div>

                <nav className="border-t border-stone-100 md:hidden">
                    <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-3">
                        <NavLink
                            to="/"
                            end
                            className={mobileNavClassName}
                        >
                            Home
                        </NavLink>

                        <NavLink
                            to="/services"
                            className={mobileNavClassName}
                        >
                            Services
                        </NavLink>

                        <NavLink
                            to="/book"
                            className={mobileNavClassName}
                        >
                            Book
                        </NavLink>

                        <NavLink
                            to="/appointments"
                            className={mobileNavClassName}
                        >
                            Appointments
                        </NavLink>

                        <NavLink
                            to="/profile"
                            className={mobileNavClassName}
                        >
                            Profile
                        </NavLink>

                        <NavLink
                            to="/login"
                            className={mobileNavClassName}
                        >
                            Sign in
                        </NavLink>
                    </div>
                </nav>
            </header>

            <div className="flex-1">
                <Outlet />
            </div>

            <footer className="bg-stone-950 text-stone-300">
                <div className="mx-auto max-w-7xl px-6 py-12">
                    <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
                        <div>
                            <p className="text-xl font-semibold text-white">
                                Nail Studio
                            </p>

                            <p className="mt-2 text-sm text-stone-500">
                                Beauty & Nail Care
                            </p>

                            <p className="mt-5 max-w-sm text-sm leading-6 text-stone-400">
                                Simple nail care booking with convenient times and automatic staff assignment.
                            </p>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-white">
                                Explore
                            </p>

                            <div className="mt-4 flex flex-col gap-3 text-sm text-stone-400">
                                <NavLink
                                    to="/"
                                    className="transition hover:text-white"
                                >
                                    Home
                                </NavLink>

                                <NavLink
                                    to="/services"
                                    className="transition hover:text-white"
                                >
                                    Services
                                </NavLink>

                                <NavLink
                                    to="/book"
                                    className="transition hover:text-white"
                                >
                                    Book appointment
                                </NavLink>

                                <NavLink
                                    to="/appointments"
                                    className="transition hover:text-white"
                                >
                                    My appointments
                                </NavLink>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-white">
                                Account
                            </p>

                            <div className="mt-4 flex flex-col gap-3 text-sm text-stone-400">
                                <NavLink
                                    to="/login"
                                    className="transition hover:text-white"
                                >
                                    Sign in
                                </NavLink>

                                <NavLink
                                    to="/register"
                                    className="transition hover:text-white"
                                >
                                    Create account
                                </NavLink>

                                <NavLink
                                    to="/profile"
                                    className="transition hover:text-white"
                                >
                                    Profile
                                </NavLink>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col gap-3 border-t border-stone-800 pt-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            Nail salon appointment system
                        </p>

                        <p>
                            Open daily · 09:00–21:00
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;