import { Link, useParams } from "react-router-dom";

interface BranchFormData {
    name: string;
    address: string;
    isActive: boolean;
}

const mockBranches: Record<string, BranchFormData> = {
    "1": {
        name: "Nail Studio District 1",
        address: "District 1, Ho Chi Minh City",
        isActive: true,
    },
    "2": {
        name: "Nail Studio District 3",
        address: "District 3, Ho Chi Minh City",
        isActive: true,
    },
};

const emptyBranch: BranchFormData = {
    name: "",
    address: "",
    isActive: true,
};

function AdminBranchFormPage() {
    const { id } = useParams();

    const isEditing = id !== undefined;

    const branch =
        id !== undefined && mockBranches[id] !== undefined
            ? mockBranches[id]
            : emptyBranch;

    return (
        <main>
            <section className="border-b border-stone-200 bg-white">
                <div className="px-6 py-8 sm:px-8 lg:px-10">
                    <Link
                        to="/admin/branches"
                        className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
                    >
                        ← Back to branches
                    </Link>

                    <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Admin
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        {isEditing
                            ? "Edit branch"
                            : "Add branch"}
                    </h1>

                    <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                        {isEditing
                            ? "Update the salon location information."
                            : "Create a new salon branch."}
                    </p>
                </div>
            </section>

            <section className="px-6 py-8 sm:px-8 lg:px-10">
                <form
                    className="max-w-3xl"
                    onSubmit={(event) => {
                        event.preventDefault();
                    }}
                >
                    <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                        <div>
                            <p className="text-sm font-medium text-stone-500">
                                Branch information
                            </p>

                            <h2 className="mt-1 text-xl font-semibold">
                                Location details
                            </h2>
                        </div>

                        <div className="mt-8 space-y-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="text-sm font-medium text-stone-700"
                                >
                                    Branch name
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    maxLength={255}
                                    defaultValue={branch.name}
                                    placeholder="Nail Studio District 1"
                                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="address"
                                    className="text-sm font-medium text-stone-700"
                                >
                                    Address
                                </label>

                                <input
                                    id="address"
                                    name="address"
                                    type="text"
                                    maxLength={255}
                                    defaultValue={branch.address}
                                    placeholder="District 1, Ho Chi Minh City"
                                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
                                />
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <p className="text-sm font-medium text-stone-500">
                                Availability
                            </p>

                            <div className="mt-5 flex items-start justify-between gap-6 border-t border-stone-200 pt-5">
                                <div>
                                    <p className="font-medium">
                                        Active branch
                                    </p>

                                    <p className="mt-1 max-w-xl text-sm leading-6 text-stone-500">
                                        Active branches can be selected by customers when viewing services and booking appointments.
                                    </p>
                                </div>

                                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        defaultChecked={branch.isActive}
                                        className="peer sr-only"
                                    />

                                    <span className="h-7 w-12 rounded-full bg-stone-300 transition peer-checked:bg-stone-900" />

                                    <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            to="/admin/branches"
                            className="rounded-full border border-stone-300 bg-white px-6 py-3 text-center text-sm font-medium transition hover:bg-stone-100"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
                        >
                            {isEditing
                                ? "Save changes"
                                : "Create branch"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default AdminBranchFormPage;