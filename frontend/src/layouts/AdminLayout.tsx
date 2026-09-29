import { NavLink, Outlet } from "react-router-dom";

function AdminLayout() {
    const navClassName = ({ isActive }: { isActive: boolean }) => {
        return isActive
            ? "flex items-center rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white"
            : "flex items-center rounded-xl px-4 py-3 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900";
    };

    return (
        <div className="min-h-screen bg-stone-100 text-stone-900">
            <header className="border-b border-stone-200 bg-white lg:hidden">
                <div className="flex items-center justify-between px-6 py-4">
                    <div>
                        <p className="font-semibold">
                            Nail Studio
                        </p>

                        <p className="text-xs text-stone-500">
                            Admin
                        </p>
                    </div>

                    <div className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600">
                        Administrator
                    </div>
                </div>

                <nav className="flex gap-2 overflow-x-auto border-t border-stone-100 px-6 py-3">
                    <NavLink
                        to="/admin/appointments"
                        className={navClassName}
                    >
                        Appointments
                    </NavLink>

                    <NavLink
                        to="/admin/services"
                        className={navClassName}
                    >
                        Services
                    </NavLink>

                    <NavLink
                        to="/admin/branches"
                        className={navClassName}
                    >
                        Branches
                    </NavLink>

                    <NavLink
                        to="/admin/staff"
                        className={navClassName}
                    >
                        Staff
                    </NavLink>
                </nav>
            </header>

            <div className="mx-auto flex min-h-screen max-w-[1600px]">
                <aside className="hidden w-72 shrink-0 border-r border-stone-200 bg-white lg:flex lg:flex-col">
                    <div className="border-b border-stone-200 px-7 py-6">
                        <p className="text-xl font-semibold tracking-tight">
                            Nail Studio
                        </p>

                        <p className="mt-1 text-sm text-stone-500">
                            Administration
                        </p>
                    </div>

                    <nav className="flex-1 p-4">
                        <p className="px-4 pb-3 pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                            Management
                        </p>

                        <div className="space-y-1">
                            <NavLink
                                to="/admin/appointments"
                                className={navClassName}
                            >
                                Appointments
                            </NavLink>

                            <NavLink
                                to="/admin/services"
                                className={navClassName}
                            >
                                Services
                            </NavLink>

                            <NavLink
                                to="/admin/branches"
                                className={navClassName}
                            >
                                Branches
                            </NavLink>

                            <NavLink
                                to="/admin/staff"
                                className={navClassName}
                            >
                                Staff
                            </NavLink>
                        </div>
                    </nav>

                    <div className="border-t border-stone-200 p-4">
                        <div className="rounded-2xl bg-stone-100 p-4">
                            <p className="text-sm font-medium">
                                Administrator
                            </p>

                            <p className="mt-1 text-xs text-stone-500">
                                admin@nailstudio.com
                            </p>
                        </div>
                    </div>
                </aside>

                <div className="min-w-0 flex-1">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default AdminLayout;