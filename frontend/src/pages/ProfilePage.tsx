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
                        Profile
                    </h1>

                    <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                        View your customer account information.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
                    <aside>
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
                    </aside>

                    <div className="space-y-6">
                        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <p className="text-sm font-medium text-stone-500">
                                Personal information
                            </p>

                            <h2 className="mt-1 text-2xl font-semibold">
                                Account details
                            </h2>

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
                                        Status
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${
                                                profile.isActive
                                                    ? "bg-emerald-500"
                                                    : "bg-red-500"
                                            }`}
                                        />

                                        <p className="font-medium">
                                            {profile.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                            <p className="text-sm font-medium text-stone-500">
                                Session
                            </p>

                            <div className="mt-5 flex flex-col gap-5 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-medium">
                                        Sign out
                                    </p>

                                    <p className="mt-1 text-sm text-stone-500">
                                        End your current session.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="w-fit rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-stone-100"
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