import { Link, useParams } from "react-router-dom";

interface StaffFormData {
    fullName: string;
    phone: string;
    email: string;
    branchId: number;
    isActive: boolean;
}

const mockStaffs: Record<string, StaffFormData> = {
    "STF-001": {
        fullName: "Nguyen Thi Mai",
        phone: "0912345678",
        email: "mai@nailstudio.com",
        branchId: 1,
        isActive: true,
    },
    "STF-002": {
        fullName: "Tran Ngoc Anh",
        phone: "0987654321",
        email: "anh@nailstudio.com",
        branchId: 1,
        isActive: true,
    },
    "STF-003": {
        fullName: "Le Thu Ha",
        phone: "0901234567",
        email: "",
        branchId: 2,
        isActive: true,
    },
    "STF-004": {
        fullName: "Pham Minh Chau",
        phone: "0934567890",
        email: "chau@nailstudio.com",
        branchId: 2,
        isActive: false,
    },
};

const emptyStaff: StaffFormData = {
    fullName: "",
    phone: "",
    email: "",
    branchId: 1,
    isActive: true,
};

function AdminStaffFormPage() {
    const { id } = useParams();

    const isEditing = id !== undefined;

    const staff =
        id !== undefined && mockStaffs[id] !== undefined
            ? mockStaffs[id]
            : emptyStaff;

    return (
        <main>
            <section className="border-b border-stone-200 bg-white">
                <div className="px-6 py-8 sm:px-8 lg:px-10">
                    <Link
                        to="/admin/staff"
                        className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
                    >
                        ← Back to staff
                    </Link>

                    <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Admin
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        {isEditing
                            ? "Edit staff"
                            : "Add staff"}
                    </h1>

                    <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                        {isEditing
                            ? "Manage the staff member's branch assignment and account availability."
                            : "Create a staff account and assign it to a salon branch."}
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
                                Staff account
                            </p>

                            <h2 className="mt-1 text-xl font-semibold">
                                Account details
                            </h2>
                        </div>

                        <div className="mt-8 space-y-6">
                            <div>
                                <label
                                    htmlFor="full-name"
                                    className="text-sm font-medium text-stone-700"
                                >
                                    Full name
                                </label>

                                <input
                                    id="full-name"
                                    name="full_name"
                                    type="text"
                                    maxLength={255}
                                    defaultValue={staff.fullName}
                                    placeholder="Nguyen Thi Mai"
                                    readOnly={isEditing}
                                    className={`mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3.5 outline-none transition ${
                                        isEditing
                                            ? "cursor-not-allowed bg-stone-100 text-stone-500"
                                            : "bg-white placeholder:text-stone-400 focus:border-stone-900"
                                    }`}
                                />
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="text-sm font-medium text-stone-700"
                                    >
                                        Phone
                                    </label>

                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        defaultValue={staff.phone}
                                        placeholder="0912345678"
                                        readOnly={isEditing}
                                        className={`mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3.5 outline-none transition ${
                                            isEditing
                                                ? "cursor-not-allowed bg-stone-100 text-stone-500"
                                                : "bg-white placeholder:text-stone-400 focus:border-stone-900"
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="text-sm font-medium text-stone-700"
                                    >
                                        Email
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        maxLength={255}
                                        defaultValue={staff.email}
                                        placeholder="staff@nailstudio.com"
                                        readOnly={isEditing}
                                        className={`mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3.5 outline-none transition ${
                                            isEditing
                                                ? "cursor-not-allowed bg-stone-100 text-stone-500"
                                                : "bg-white placeholder:text-stone-400 focus:border-stone-900"
                                        }`}
                                    />

                                    {!isEditing && (
                                        <p className="mt-2 text-xs text-stone-400">
                                            Optional
                                        </p>
                                    )}
                                </div>
                            </div>

                            {!isEditing && (
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="text-sm font-medium text-stone-700"
                                    >
                                        Password
                                    </label>

                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        minLength={8}
                                        placeholder="At least 8 characters"
                                        className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
                                    />

                                    <p className="mt-2 text-xs text-stone-400">
                                        Minimum 8 characters
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                        <div>
                            <p className="text-sm font-medium text-stone-500">
                                Assignment
                            </p>

                            <h2 className="mt-1 text-xl font-semibold">
                                Branch
                            </h2>
                        </div>

                        <div className="mt-6">
                            <label
                                htmlFor="branch"
                                className="text-sm font-medium text-stone-700"
                            >
                                Assigned branch
                            </label>

                            <select
                                id="branch"
                                name="branch_id"
                                defaultValue={staff.branchId}
                                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition focus:border-stone-900"
                            >
                                <option value={1}>
                                    Nail Studio District 1
                                </option>

                                <option value={2}>
                                    Nail Studio District 3
                                </option>
                            </select>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <p className="text-sm font-medium text-stone-500">
                                Account availability
                            </p>

                            <div className="mt-5 flex items-start justify-between gap-6 border-t border-stone-200 pt-5">
                                <div>
                                    <p className="font-medium">
                                        Active staff
                                    </p>

                                    <p className="mt-1 max-w-xl text-sm leading-6 text-stone-500">
                                        Active staff members can receive automatically assigned appointments.
                                    </p>
                                </div>

                                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        defaultChecked={staff.isActive}
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
                            to="/admin/staff"
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
                                : "Create staff"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default AdminStaffFormPage;