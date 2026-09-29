import { NavLink, Outlet } from "react-router-dom";

function App() {
    const navClassName = ({ isActive }: { isActive: boolean }) => {
        return isActive
            ? "font-medium text-stone-900"
            : "text-stone-500 transition hover:text-stone-900";
    };

    return (
        <div className="min-h-screen bg-stone-50 text-stone-900">
            <header className="border-b border-stone-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <NavLink to="/">
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
                            className={navClassName}
                        >
                            Home
                        </NavLink>

                        <NavLink
                            to="/book"
                            className={navClassName}
                        >
                            Book
                        </NavLink>

                        <NavLink
                            to="/appointments"
                            className={navClassName}
                        >
                            Appointments
                        </NavLink>

                        <NavLink
                            to="/profile"
                            className={navClassName}
                        >
                            Profile
                        </NavLink>
                    </nav>

                    <div className="flex items-center gap-3">
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
            </header>

            <Outlet />

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