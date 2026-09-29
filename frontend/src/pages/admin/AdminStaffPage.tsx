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

interface AdminStaff {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    branchId: number;
    branch: string;
    isActive: boolean;
}

const staffs: AdminStaff[] = [
    {
        id: "STF-001",
        fullName: "Nguyen Thi Mai",
        phone: "0912345678",
        email: "mai@nailstudio.com",
        branchId: 1,
        branch: "Nail Studio District 1",
        isActive: true,
    },
    {
        id: "STF-002",
        fullName: "Tran Ngoc Anh",
        phone: "0987654321",
        email: "anh@nailstudio.com",
        branchId: 1,
        branch: "Nail Studio District 1",
        isActive: true,
    },
    {
        id: "STF-003",
        fullName: "Le Thu Ha",
        phone: "0901234567",
        email: null,
        branchId: 2,
        branch: "Nail Studio District 3",
        isActive: true,
    },
    {
        id: "STF-004",
        fullName: "Pham Minh Chau",
        phone: "0934567890",
        email: "chau@nailstudio.com",
        branchId: 2,
        branch: "Nail Studio District 3",
        isActive: false,
    },
];

function AdminStaffPage() {
    const [branchFilter, setBranchFilter] =
        useState<BranchFilter>("ALL");

    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("ALL");

    const activeStaffs = staffs.filter((staff) => {
        return staff.isActive;
    }).length;

    const filteredStaffs = staffs.filter((staff) => {
        const matchesBranch =
            branchFilter === "ALL" ||
            staff.branchId === branchFilter;

        const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" && staff.isActive) ||
            (statusFilter === "INACTIVE" && !staff.isActive);

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
                                Staff
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                                Manage salon staff, branch assignments and account availability.
                            </p>
                        </div>

                        <Link
                            to="/admin/staff/new"
                            className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
                        >
                            Add staff
                        </Link>
                    </div>
                </div>
            </section>

            <section className="border-b border-stone-200 bg-stone-50">
                <div className="grid gap-4 px-6 py-5 sm:grid-cols-3 sm:px-8 lg:px-10">
                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Total staff
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {staffs.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Active
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {activeStaffs}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Inactive
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {staffs.length - activeStaffs}
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

                {filteredStaffs.length === 0 ? (
                    <div className="rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center">
                        <h2 className="text-lg font-semibold">
                            No staff found
                        </h2>

                        <p className="mt-2 text-sm text-stone-500">
                            No staff members match the selected filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
                        <div className="hidden grid-cols-[1.3fr_1fr_1fr_130px_100px] gap-4 border-b border-stone-200 bg-stone-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-stone-400 lg:grid">
                            <p>
                                Staff
                            </p>

                            <p>
                                Contact
                            </p>

                            <p>
                                Branch
                            </p>

                            <p>
                                Status
                            </p>

                            <p className="text-right">
                                Action
                            </p>
                        </div>

                        <div className="divide-y divide-stone-200">
                            {filteredStaffs.map((staff) => {
                                return (
                                    <article
                                        key={staff.id}
                                        className="grid gap-5 px-6 py-5 lg:grid-cols-[1.3fr_1fr_1fr_130px_100px] lg:items-center"
                                    >
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 lg:hidden">
                                                Staff
                                            </p>

                                            <p className="mt-1 font-semibold lg:mt-0">
                                                {staff.fullName}
                                            </p>

                                            <p className="mt-1 text-xs text-stone-400">
                                                {staff.id}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 lg:hidden">
                                                Contact
                                            </p>

                                            <p className="mt-1 text-sm font-medium lg:mt-0">
                                                {staff.phone}
                                            </p>

                                            <p className="mt-1 text-xs text-stone-500">
                                                {staff.email ?? "No email"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 lg:hidden">
                                                Branch
                                            </p>

                                            <p className="mt-1 text-sm text-stone-600 lg:mt-0">
                                                {staff.branch}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 lg:hidden">
                                                Status
                                            </p>

                                            <span
                                                className={`mt-1 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold lg:mt-0 ${
                                                    staff.isActive
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-stone-200 text-stone-600"
                                                }`}
                                            >
                                                {staff.isActive
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                            </span>
                                        </div>

                                        <div className="lg:text-right">
                                            <Link
                                                to={`/admin/staff/${staff.id}/edit`}
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

export default AdminStaffPage;