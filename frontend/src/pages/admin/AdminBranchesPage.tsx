import { Link } from "react-router-dom";

interface AdminBranch {
    id: number;
    name: string;
    address: string;
    isActive: boolean;
}

const branches: AdminBranch[] = [
    {
        id: 1,
        name: "Nail Studio District 1",
        address: "District 1, Ho Chi Minh City",
        isActive: true,
    },
    {
        id: 2,
        name: "Nail Studio District 3",
        address: "District 3, Ho Chi Minh City",
        isActive: true,
    },
];

function AdminBranchesPage() {
    const activeBranches = branches.filter((branch) => {
        return branch.isActive;
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
                                Branches
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                                Manage salon locations and control which branches are available to customers.
                            </p>
                        </div>

                        <Link
                            to="/admin/branches/new"
                            className="w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
                        >
                            Add branch
                        </Link>
                    </div>
                </div>
            </section>

            <section className="border-b border-stone-200 bg-stone-50">
                <div className="grid gap-4 px-6 py-5 sm:grid-cols-3 sm:px-8 lg:px-10">
                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Total branches
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {branches.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Active
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {activeBranches}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5">
                        <p className="text-sm text-stone-500">
                            Inactive
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {branches.length - activeBranches}
                        </p>
                    </div>
                </div>
            </section>

            <section className="px-6 py-8 sm:px-8 lg:px-10">
                <div className="grid gap-5 xl:grid-cols-2">
                    {branches.map((branch) => {
                        return (
                            <article
                                key={branch.id}
                                className="rounded-3xl border border-stone-200 bg-white"
                            >
                                <div className="flex flex-col gap-5 border-b border-stone-200 p-6 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                                            Branch #{branch.id}
                                        </p>

                                        <h2 className="mt-2 text-xl font-semibold">
                                            {branch.name}
                                        </h2>
                                    </div>

                                    <span
                                        className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                                            branch.isActive
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-stone-200 text-stone-600"
                                        }`}
                                    >
                                        {branch.isActive
                                            ? "ACTIVE"
                                            : "INACTIVE"}
                                    </span>
                                </div>

                                <div className="p-6">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                            Address
                                        </p>

                                        <p className="mt-2 leading-7 text-stone-600">
                                            {branch.address}
                                        </p>
                                    </div>

                                    <div className="mt-6 border-t border-stone-200 pt-5">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                            Customer availability
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-stone-500">
                                            {branch.isActive
                                                ? "Customers can select this branch when viewing services and booking appointments."
                                                : "This branch is hidden from new customer bookings."}
                                        </p>
                                    </div>

                                    <div className="mt-6 border-t border-stone-200 pt-5">
                                        <Link
                                            to={`/admin/branches/${branch.id}/edit`}
                                            className="inline-flex rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-stone-100"
                                        >
                                            Edit branch
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}

export default AdminBranchesPage;