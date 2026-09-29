import { useState } from "react";
import { Link } from "react-router-dom";

type BranchFilter =
    | "ALL"
    | 1
    | 2;

type StatusFilter =
    | "ALL"
    | "ACTIVE"
    | "INACTIVE";

interface AdminService {
    id: string;
    branchId: number;
    branch: string;
    name: string;
    durationMinutes: number;
    price: number;
    isActive: boolean;
}

const services: AdminService[] = [
    {
        id: "SRV-001",
        branchId: 1,
        branch: "Nail Studio District 1",
        name: "Classic Manicure",
        durationMinutes: 30,
        price: 120000,
        isActive: true,
    },
    {
        id: "SRV-002",
        branchId: 1,
        branch: "Nail Studio District 1",
        name: "Gel Manicure",
        durationMinutes: 45,
        price: 220000,
        isActive: true,
    },
    {
        id: "SRV-003",
        branchId: 1,
        branch: "Nail Studio District 1",
        name: "Classic Pedicure",
        durationMinutes: 45,
        price: 180000,
        isActive: true,
    },
    {
        id: "SRV-004",
        branchId: 1,
        branch: "Nail Studio District 1",
        name: "Nail Art",
        durationMinutes: 30,
        price: 150000,
        isActive: true,
    },
    {
        id: "SRV-005",
        branchId: 2,
        branch: "Nail Studio District 3",
        name: "Spa Pedicure",
        durationMinutes: 60,
        price: 260000,
        isActive: true,
    },
    {
        id: "SRV-006",
        branchId: 2,
        branch: "Nail Studio District 3",
        name: "Gel Pedicure",
        durationMinutes: 60,
        price: 280000,
        isActive: true,
    },
    {
        id: "SRV-007",
        branchId: 2,
        branch: "Nail Studio District 3",
        name: "Nail Extension",
        durationMinutes: 75,
        price: 350000,
        isActive: true,
    },
    {
        id: "SRV-008",
        branchId: 2,
        branch: "Nail Studio District 3",
        name: "Gel Removal",
        durationMinutes: 20,
        price: 80000,
        isActive: false,
    },
];

function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
}

function AdminServicesPage() {
    const [branchFilter, setBranchFilter] =
        useState<BranchFilter>("ALL");

    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("ALL");

    const activeServices = services.filter((service) => {
        return service.isActive;
    }).length;

    const filteredServices = services.filter((service) => {
        const matchesBranch =
            branchFilter === "ALL" ||
            service.branchId === branchFilter;

        const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" && service.isActive) ||
            (statusFilter === "INACTIVE" && !service.isActive);

        return matchesBranch && matchesStatus;
    });

    const getBranchButtonClassName = (
        value: BranchFilter
    ) => {
        return branchFilter === value
            ? "shrink-0 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            : "shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200";
    };

    const getStatusButtonClassName = (
        value: StatusFilter
    ) => {
        return statusFilter === value
            ? "rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            : "rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100";
    };

    return (
        <main>
            <section className="border-b border-stone-200 bg-white">
                <div className="px-6 py-8 sm:px-8 lg:px-10">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                                Admin
                            </p>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                                Services
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                                Manage service names, prices, duration and availability for each branch.
                            </p>
                        </div>

                        <Link
                            to="/admin/services/new"
                            className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
                        >
                            Add service
                        </Link>
                    </div>
                </div>
            </section>

            <section className="border-b border-stone-200 bg-stone-50">
                <div className="grid gap-4 px-6 py-5 sm:grid-cols-3 sm:px-8 lg:px-10">
                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Total services
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {services.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Active
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {activeServices}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Inactive
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {services.length - activeServices}
                        </p>
                    </div>
                </div>
            </section>

            <section className="px-6 py-8 sm:px-8 lg:px-10">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => {
                                setBranchFilter("ALL");
                            }}
                            className={getBranchButtonClassName("ALL")}
                        >
                            All branches
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setBranchFilter(1);
                            }}
                            className={getBranchButtonClassName(1)}
                        >
                            District 1
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setBranchFilter(2);
                            }}
                            className={getBranchButtonClassName(2)}
                        >
                            District 3
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => {
                                setStatusFilter("ALL");
                            }}
                            className={getStatusButtonClassName("ALL")}
                        >
                            All
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setStatusFilter("ACTIVE");
                            }}
                            className={getStatusButtonClassName("ACTIVE")}
                        >
                            Active
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setStatusFilter("INACTIVE");
                            }}
                            className={getStatusButtonClassName("INACTIVE")}
                        >
                            Inactive
                        </button>
                    </div>
                </div>

                {filteredServices.length === 0 ? (
                    <div className="rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center">
                        <h2 className="text-lg font-semibold">
                            No services found
                        </h2>

                        <p className="mt-2 text-sm text-stone-500">
                            No services match the selected filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
                        <div className="hidden grid-cols-[1.4fr_1fr_120px_150px_110px_100px] gap-4 border-b border-stone-200 bg-stone-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-stone-400 lg:grid">
                            <p>
                                Service
                            </p>

                            <p>
                                Branch
                            </p>

                            <p>
                                Duration
                            </p>

                            <p>
                                Price
                            </p>

                            <p>
                                Status
                            </p>

                            <p className="text-right">
                                Action
                            </p>
                        </div>

                        <div className="divide-y divide-stone-200">
                            {filteredServices.map((service) => {
                                return (
                                    <article
                                        key={service.id}
                                        className="grid gap-5 px-6 py-5 lg:grid-cols-[1.4fr_1fr_120px_150px_110px_100px] lg:items-center"
                                    >
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 lg:hidden">
                                                Service
                                            </p>

                                            <p className="mt-1 font-semibold lg:mt-0">
                                                {service.name}
                                            </p>

                                            <p className="mt-1 text-xs text-stone-400">
                                                {service.id}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 lg:hidden">
                                                Branch
                                            </p>

                                            <p className="mt-1 text-sm text-stone-600 lg:mt-0">
                                                {service.branch}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 lg:hidden">
                                                Duration
                                            </p>

                                            <p className="mt-1 text-sm font-medium lg:mt-0">
                                                {service.durationMinutes} min
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 lg:hidden">
                                                Price
                                            </p>

                                            <p className="mt-1 font-medium lg:mt-0">
                                                {formatPrice(service.price)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 lg:hidden">
                                                Status
                                            </p>

                                            <span
                                                className={`mt-1 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold lg:mt-0 ${
                                                    service.isActive
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-stone-200 text-stone-600"
                                                }`}
                                            >
                                                {service.isActive
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                            </span>
                                        </div>

                                        <div className="lg:text-right">
                                            <Link
                                                to={`/admin/services/${service.id}/edit`}
                                                className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-stone-100"
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

export default AdminServicesPage;