import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

export interface BranchOption {
    id: number;
    shortName: string;
    compactName: string;
    name: string;
    address: string;
}

export interface AppOutletContext {
    selectedBranch: BranchOption;
}

const branches: BranchOption[] = [
    {
        id: 1,
        shortName: "District 1",
        compactName: "D1",
        name: "Nail Studio District 1",
        address: "District 1, Ho Chi Minh City",
    },
    {
        id: 2,
        shortName: "District 3",
        compactName: "D3",
        name: "Nail Studio District 3",
        address: "District 3, Ho Chi Minh City",
    },
];

function App() {
    const [selectedBranchId, setSelectedBranchId] = useState(1);
    const [branchMenuOpen, setBranchMenuOpen] = useState(false);

    const selectedBranch =
        branches.find((branch) => {
            return branch.id === selectedBranchId;
        }) ?? branches[0];

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
            <header className="relative z-50 border-b border-stone-200 bg-white">
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
                        <div className="relative">
                            <button
                                type="button"
                                aria-expanded={branchMenuOpen}
                                onClick={() => {
                                    setBranchMenuOpen((current) => {
                                        return !current;
                                    });
                                }}
                                className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 sm:px-4"
                            >
                                <svg
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    className="h-4 w-4 shrink-0 text-stone-500"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M10 10.5C11.6569 10.5 13 9.15685 13 7.5C13 5.84315 11.6569 4.5 10 4.5C8.34315 4.5 7 5.84315 7 7.5C7 9.15685 8.34315 10.5 10 10.5Z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />

                                    <path
                                        d="M15.5 7.5C15.5 12 10 16 10 16C10 16 4.5 12 4.5 7.5C4.5 4.46243 6.96243 2 10 2C13.0376 2 15.5 4.46243 15.5 7.5Z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                                <span className="hidden sm:inline">
                                    {selectedBranch.shortName}
                                </span>

                                <span className="sm:hidden">
                                    {selectedBranch.compactName}
                                </span>

                                <svg
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    className={`h-4 w-4 shrink-0 text-stone-400 transition ${
                                        branchMenuOpen
                                            ? "rotate-180"
                                            : ""
                                    }`}
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M6 8L10 12L14 8"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>

                            {branchMenuOpen ? (
                                <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
                                    <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                                        Select branch
                                    </p>

                                    <div className="space-y-1">
                                        {branches.map((branch) => {
                                            const selected =
                                                branch.id === selectedBranch.id;

                                            return (
                                                <button
                                                    key={branch.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedBranchId(
                                                            branch.id
                                                        );

                                                        setBranchMenuOpen(false);
                                                    }}
                                                    className={`flex w-full items-start justify-between gap-4 rounded-xl px-3 py-3 text-left transition ${
                                                        selected
                                                            ? "bg-stone-100"
                                                            : "hover:bg-stone-50"
                                                    }`}
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-stone-900">
                                                            {branch.name}
                                                        </p>

                                                        <p className="mt-1 text-xs leading-5 text-stone-500">
                                                            {branch.address}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                                                            selected
                                                                ? "border-stone-900 bg-stone-900 text-white"
                                                                : "border-stone-300"
                                                        }`}
                                                    >
                                                        {selected ? "✓" : ""}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <NavLink
                            to="/login"
                            className="hidden text-sm font-medium text-stone-600 transition hover:text-stone-900 lg:block"
                        >
                            Sign in
                        </NavLink>

                        <NavLink
                            to="/book"
                            className="hidden rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 sm:inline-flex"
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
                <Outlet
                    context={{
                        selectedBranch,
                    }}
                />
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