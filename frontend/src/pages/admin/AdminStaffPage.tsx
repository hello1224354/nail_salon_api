interface AdminStaff {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    branch: string;
    isActive: boolean;
}

const staffs: AdminStaff[] = [
    {
        id: "STF-001",
        fullName: "Nguyen Thi Mai",
        phone: "0912345678",
        email: "mai@nailstudio.com",
        branch: "Nail Studio District 1",
        isActive: true,
    },
    {
        id: "STF-002",
        fullName: "Tran Ngoc Anh",
        phone: "0987654321",
        email: "anh@nailstudio.com",
        branch: "Nail Studio District 1",
        isActive: true,
    },
    {
        id: "STF-003",
        fullName: "Le Thu Ha",
        phone: "0901234567",
        email: null,
        branch: "Nail Studio District 3",
        isActive: true,
    },
    {
        id: "STF-004",
        fullName: "Pham Minh Chau",
        phone: "0934567890",
        email: "chau@nailstudio.com",
        branch: "Nail Studio District 3",
        isActive: false,
    },
];

function AdminStaffPage() {
    const activeStaffs = staffs.filter((staff) => {
        return staff.isActive;
    }).length;

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

                        <button
                            type="button"
                            className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
                        >
                            Add staff
                        </button>
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
                            className="shrink-0 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
                        >
                            All branches
                        </button>

                        <button
                            type="button"
                            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200"
                        >
                            District 1
                        </button>

                        <button
                            type="button"
                            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200"
                        >
                            District 3
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
                        >
                            Active
                        </button>

                        <button
                            type="button"
                            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
                        >
                            Inactive
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
                    <div className="hidden grid-cols-[1.3fr_1fr_1fr_130px_180px] gap-4 border-b border-stone-200 bg-stone-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-stone-400 lg:grid">
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
                            Actions
                        </p>
                    </div>

                    <div className="divide-y divide-stone-200">
                        {staffs.map((staff) => {
                            return (
                                <article
                                    key={staff.id}
                                    className="grid gap-5 px-6 py-5 lg:grid-cols-[1.3fr_1fr_1fr_130px_180px] lg:items-center"
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

                                    <div className="flex flex-wrap gap-2 lg:justify-end">
                                        <button
                                            type="button"
                                            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-stone-100"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-stone-100"
                                        >
                                            {staff.isActive
                                                ? "Deactivate"
                                                : "Activate"}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>
        </main>
    );
}

export default AdminStaffPage;