import { Link, useParams } from "react-router-dom";

interface ServiceFormData {
    branchId: number;
    name: string;
    durationMinutes: number;
    price: number;
    isActive: boolean;
}

const mockServices: Record<string, ServiceFormData> = {
    "SRV-001": {
        branchId: 1,
        name: "Classic Manicure",
        durationMinutes: 30,
        price: 120000,
        isActive: true,
    },
    "SRV-002": {
        branchId: 1,
        name: "Gel Manicure",
        durationMinutes: 45,
        price: 220000,
        isActive: true,
    },
    "SRV-003": {
        branchId: 1,
        name: "Classic Pedicure",
        durationMinutes: 45,
        price: 180000,
        isActive: true,
    },
    "SRV-004": {
        branchId: 1,
        name: "Nail Art",
        durationMinutes: 30,
        price: 150000,
        isActive: true,
    },
    "SRV-005": {
        branchId: 2,
        name: "Spa Pedicure",
        durationMinutes: 60,
        price: 260000,
        isActive: true,
    },
    "SRV-006": {
        branchId: 2,
        name: "Gel Pedicure",
        durationMinutes: 60,
        price: 280000,
        isActive: true,
    },
    "SRV-007": {
        branchId: 2,
        name: "Nail Extension",
        durationMinutes: 75,
        price: 350000,
        isActive: true,
    },
    "SRV-008": {
        branchId: 2,
        name: "Gel Removal",
        durationMinutes: 20,
        price: 80000,
        isActive: false,
    },
};

const emptyService: ServiceFormData = {
    branchId: 1,
    name: "",
    durationMinutes: 30,
    price: 0,
    isActive: true,
};

function AdminServiceFormPage() {
    const { id } = useParams();

    const isEditing = id !== undefined;

    const service =
        id !== undefined && mockServices[id] !== undefined
            ? mockServices[id]
            : emptyService;

    return (
        <main>
            <section className="border-b border-stone-200 bg-white">
                <div className="px-6 py-8 sm:px-8 lg:px-10">
                    <Link
                        to="/admin/services"
                        className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
                    >
                        ← Back to services
                    </Link>

                    <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Admin
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        {isEditing
                            ? "Edit service"
                            : "Add service"}
                    </h1>

                    <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                        {isEditing
                            ? "Update the service information shown to customers."
                            : "Create a new service for one salon branch."}
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
                                Service information
                            </p>

                            <h2 className="mt-1 text-xl font-semibold">
                                Basic details
                            </h2>
                        </div>

                        <div className="mt-8 space-y-6">
                            <div>
                                <label
                                    htmlFor="branch"
                                    className="text-sm font-medium text-stone-700"
                                >
                                    Branch
                                </label>

                                <select
                                    id="branch"
                                    name="branch_id"
                                    defaultValue={service.branchId}
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

                            <div>
                                <label
                                    htmlFor="name"
                                    className="text-sm font-medium text-stone-700"
                                >
                                    Service name
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    defaultValue={service.name}
                                    placeholder="Gel Manicure"
                                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none transition placeholder:text-stone-400 focus:border-stone-900"
                                />
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="duration"
                                        className="text-sm font-medium text-stone-700"
                                    >
                                        Duration
                                    </label>

                                    <div className="relative mt-2">
                                        <input
                                            id="duration"
                                            name="duration_minutes"
                                            type="number"
                                            min="1"
                                            defaultValue={service.durationMinutes}
                                            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 pr-16 outline-none transition focus:border-stone-900"
                                        />

                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                                            min
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="price"
                                        className="text-sm font-medium text-stone-700"
                                    >
                                        Price
                                    </label>

                                    <div className="relative mt-2">
                                        <input
                                            id="price"
                                            name="price"
                                            type="number"
                                            min="0"
                                            step="1000"
                                            defaultValue={service.price}
                                            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 pr-14 outline-none transition focus:border-stone-900"
                                        />

                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                                            ₫
                                        </span>
                                    </div>
                                </div>
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
                                        Active service
                                    </p>

                                    <p className="mt-1 max-w-xl text-sm leading-6 text-stone-500">
                                        Active services can be shown to customers and selected when booking.
                                    </p>
                                </div>

                                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        defaultChecked={service.isActive}
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
                            to="/admin/services"
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
                                : "Create service"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default AdminServiceFormPage;