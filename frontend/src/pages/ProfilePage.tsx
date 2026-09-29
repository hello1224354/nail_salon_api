interface ProfileData {
    fullName: string;
    phone: string;
    email: string | null;
    role: "customer";
    isActive: boolean;
    createdAt: string;
}

const profile: ProfileData = {
    fullName: "Nguyen Van A",
    phone: "+84912345678",
    email: "customer@example.com",
    role: "customer",
    isActive: true,
    createdAt: "15 Sep 2026",
};

function ProfilePage() {
    const initials = profile.fullName
        .split(" ")
        .slice(-2)
        .map((part) => {
            return part.charAt(0);
        })
        .join("")
        .toUpperCase();

    return (
        <main className="min-h-[70vh]">
            <section className="border-b border-stone-200 bg-white">
                <div className="mx-auto max-w-7xl px-6 py-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Account
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                        Your profile
                    </h1>

                    <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                        View your personal information and customer account details.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
                    <aside className="space-y-5">
                        <div className="rounded-3xl border border-stone-200 bg-white p-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-900 text-2xl font-semibold text-white">
                                {initials}
                            </div>

                            <h2 className="mt-5 text-2xl font-semibold">
                                {profile.fullName}
                            </h2>

                            <p className="mt-1 text-sm capitalize text-stone-500">
                                {profile.role}
                            </p>

                            <div className="mt-5 flex items-center gap-2">
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${
                                        profile.isActive
                                            ? "bg-emerald-500"
                                            : "bg-red-500"
                                    }`}
                                />

                                <span className="text-sm text-stone-600">
                                    {profile.isActive
                                        ? "Active account"
                                        : "Inactive account"}
                                </span>
                            </div>

                            <div className="mt-6 border-t border-stone-200 pt-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                                    Member since
                                </p>

                                <p className="mt-2 text-sm font-medium">
                                    {profile.createdAt}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-stone-200 bg-stone-100 p-6">
                            <p className="text-sm font-semibold">
                                Appointment account
                            </p>

                            <p className="mt-2 text-sm leading-6 text-stone-500">
                                Your bookings, selected services and appointment history are connected to this customer profile.
                            </p>

                            <button
                                type="button"
                                className="mt-5 w-full rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-stone-200"
                            >
                                View appointments
                            </button>
                        </div>
                    </aside>

                    <div className="space-y-6">
                        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-stone-500">
                                        Personal information
                                    </p>

                                    <h2 className="mt-1 text-2xl font-semibold">
                                        Account details
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-stone-500">
                                        Basic information associated with your Nail Studio account.
                                    </p>
                                </div>

                                <span className="w-fit rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
                                    Customer
                                </span>
                            </div>

                            <div className="mt-8 divide-y divide-stone-200">
                                <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:items-center">
                                    <p className="text-sm text-stone-500">
                                        Full name
                                    </p>

                                    <p className="font-medium">
                                        {profile.fullName}
                                    </p>
                                </div>

                                <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:items-center">
                                    <p className="text-sm text-stone-500">
                                        Phone number
                                    </p>

                                    <p className="font-medium">
                                        {profile.phone}
                                    </p>
                                </div>

                                <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:items-center">
                                    <p className="text-sm text-stone-500">
                                        Email address
                                    </p>

                                    <p className="font-medium">
                                        {profile.email ?? "Not provided"}
                                    </p>
                                </div>

                                <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:items-center">
                                    <p className="text-sm text-stone-500">
                                        Account type
                                    </p>

                                    <p className="font-medium capitalize">
                                        {profile.role}
                                    </p>
                                </div>

                                <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:items-center">
                                    <p className="text-sm text-stone-500">
                                        Account status
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${
                                                profile.isActive
                                                    ? "bg-emerald-500"
                                                    : "bg-red-500"
                                            }`}
                                        />

                                        <span className="font-medium">
                                            {profile.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <div>
                                <p className="text-sm font-medium text-stone-500">
                                    Account actions
                                </p>

                                <h2 className="mt-1 text-xl font-semibold">
                                    Session
                                </h2>
                            </div>

                            <div className="mt-6 flex flex-col gap-4 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-medium">
                                        Sign out of Nail Studio
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-stone-500">
                                        You can sign back in with your phone number and password.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="shrink-0 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-stone-100"
                                >
                                    Sign out
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default ProfilePage;