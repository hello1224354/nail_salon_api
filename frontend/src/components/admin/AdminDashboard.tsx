"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
    apiRequest,
    getApiErrorMessage,
    type AdminStaff,
    type Appointment,
    type AppointmentList,
    type Branch,
    type BranchList,
    type Offer,
    type OfferList,
    type Service,
    type ServiceList,
} from "@/lib/api";
import { getAuthUser, logoutSession, restoreSession, type AuthUser } from "@/lib/auth";
import { formatAppointmentStatus, formatVnd, localizeBranchName } from "@/lib/studio-data";

type TabKey = "overview" | "appointments" | "services" | "staff" | "branches" | "offers";

type LoadState = {
    branches: Branch[];
    services: Service[];
    staff: AdminStaff[];
    offers: Offer[];
    appointments: Appointment[];
    appointmentTotal: number;
};

const emptyState: LoadState = {
    branches: [],
    services: [],
    staff: [],
    offers: [],
    appointments: [],
    appointmentTotal: 0,
};

const tabItems: Array<{ key: TabKey; label: string; short: string }> = [
    { key: "overview", label: "Tổng quan", short: "Tổng quan" },
    { key: "appointments", label: "Lịch hẹn", short: "Lịch" },
    { key: "services", label: "Dịch vụ", short: "Dịch vụ" },
    { key: "staff", label: "Nhân viên", short: "Nhân viên" },
    { key: "branches", label: "Chi nhánh", short: "Chi nhánh" },
    { key: "offers", label: "Ưu đãi", short: "Ưu đãi" },
];

const statusOrder = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).format(new Date(value));
}

function formatDate(value: string) {
    const [year, month, day] = value.split("-");
    return day && month && year ? `${day}/${month}/${year}` : value;
}

function getOfferStatus(offer: Offer) {
    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

    if (today < offer.start_date) return "Sắp diễn ra";
    if (today > offer.end_date) return "Đã hết hạn";
    return "Đang áp dụng";
}

function badgeClass(status: string) {
    switch (status) {
        case "pending":
        case "Sắp diễn ra":
            return "border-[#e1c98f] bg-[#fbf5e7] text-[#7a622d]";
        case "confirmed":
        case "Đang áp dụng":
            return "border-[#a7c8b2] bg-[#edf7f0] text-[#356245]";
        case "in_progress":
            return "border-[#9abed0] bg-[#eaf4f9] text-[#356274]";
        case "completed":
            return "border-[#bfc5cb] bg-[#f1f3f4] text-[#4e5962]";
        case "cancelled":
        case "Đã hết hạn":
            return "border-[#d8aaa0] bg-[#faeeeb] text-[#854d42]";
        default:
            return "border-line bg-cream text-muted";
    }
}

function Field({
    label,
    children,
    span = false,
}: {
    label: string;
    children: ReactNode;
    span?: boolean;
}) {
    return (
        <label className={span ? "block md:col-span-2" : "block"}>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {label}
            </span>
            <div className="mt-2">{children}</div>
        </label>
    );
}

const inputClass =
    "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-accent";
const textareaClass =
    "min-h-28 w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm leading-5 text-ink outline-none transition focus:border-accent";
const selectClass = inputClass;

function Modal({
    title,
    description,
    onClose,
    children,
}: {
    title: string;
    description?: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#211c19]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
            <button className="absolute inset-0 cursor-default" aria-label="Đóng" onClick={onClose} />
            <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] border border-line bg-cream p-5 shadow-[0_30px_100px_rgba(48,40,35,0.22)] sm:max-w-2xl sm:rounded-[24px] sm:p-7">
                <div className="flex items-start justify-between gap-5">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Quản trị</p>
                        <h2 className="mt-2 font-serif text-3xl tracking-[-0.025em]">{title}</h2>
                        {description ? <p className="mt-2 text-xs leading-5 text-muted">{description}</p> : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-lg text-muted transition hover:text-ink"
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>
                <div className="mt-6">{children}</div>
            </div>
        </div>
    );
}

export function AdminDashboard() {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [admin, setAdmin] = useState<AuthUser | null>(null);
    const [tab, setTab] = useState<TabKey>("overview");
    const [data, setData] = useState<LoadState>(emptyState);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const [modal, setModal] = useState<null | "branch" | "service" | "staff" | "offer">(null);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [appointmentStatus, setAppointmentStatus] = useState("");
    const [appointmentBranch, setAppointmentBranch] = useState("");
    const [appointmentPage, setAppointmentPage] = useState(1);
    const [appointmentPages, setAppointmentPages] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function bootstrapAdmin() {
            const restored = await restoreSession();
            const user = getAuthUser();

            if (!restored || !user || user.role.toLowerCase() !== "admin") {
                if (!cancelled) router.replace("/admin/login");
                return;
            }

            if (!cancelled) {
                setAdmin(user);
                setReady(true);
            }
        }

        void bootstrapAdmin();

        return () => {
            cancelled = true;
        };
    }, [router]);

    const loadStaticData = useCallback(async () => {
        const [branchesResult, servicesResult, staffResult, offersResult] = await Promise.all([
            apiRequest<BranchList>("/api/branches/admin?page=1&limit=100"),
            apiRequest<ServiceList>("/api/services/admin?page=1&limit=100"),
            apiRequest<AdminStaff[]>("/api/staffs/admin"),
            apiRequest<OfferList>("/api/offers/admin?page=1&limit=100"),
        ]);

        setData((current) => ({
            ...current,
            branches: branchesResult.branches,
            services: servicesResult.services,
            staff: staffResult,
            offers: offersResult.offers,
        }));
    }, []);

    const loadAppointments = useCallback(
        async (page = appointmentPage) => {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
            });

            if (appointmentStatus) params.set("status", appointmentStatus);
            if (appointmentBranch) params.set("branch_id", appointmentBranch);

            const result = await apiRequest<AppointmentList>(
                `/api/appointments?${params.toString()}`
            );

            setData((current) => ({
                ...current,
                appointments: result.appointments,
                appointmentTotal: result.total,
            }));
            setAppointmentPages(Math.max(result.total_pages, 1));
        },
        [appointmentBranch, appointmentPage, appointmentStatus]
    );

    const loadAll = useCallback(
        async (quiet = false) => {
            if (quiet) setRefreshing(true);
            else setLoading(true);
            setError("");

            try {
                await Promise.all([loadStaticData(), loadAppointments(appointmentPage)]);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, "Không thể tải dữ liệu quản trị."));
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [appointmentPage, loadAppointments, loadStaticData]
    );

    useEffect(() => {
        if (!ready) return;

        const timer = window.setTimeout(() => {
            void loadAll();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadAll, ready]);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(""), 3200);
        return () => window.clearTimeout(timer);
    }, [toast]);

    async function refresh(message?: string) {
        await loadAll(true);
        if (message) setToast(message);
    }

    async function logout() {
        await logoutSession();
        router.replace("/admin/login");
        router.refresh();
    }

    const branchCount = data.branches.length;
    const serviceCount = data.services.length;
    const staffCount = data.staff.length;

    const todayStats = useMemo(() => {
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const today = formatter.format(new Date());
        const todays = data.appointments.filter((appointment) => formatter.format(new Date(appointment.start_time)) === today);
        return {
            total: todays.length,
            pending: todays.filter((appointment) => appointment.status === "pending").length,
            confirmed: todays.filter((appointment) => appointment.status === "confirmed").length,
            completed: todays.filter((appointment) => appointment.status === "completed").length,
        };
    }, [data.appointments]);

    async function updateAppointmentStatus(appointment: Appointment, status: string) {
        setSubmitting(true);
        try {
            await apiRequest<Appointment>(
                `/api/appointments/${appointment.id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({ status }),
                }
            );
            await refresh("Đã cập nhật trạng thái lịch hẹn.");
        } catch (statusError) {
            setToast(getApiErrorMessage(statusError, "Không thể cập nhật lịch hẹn."));
        } finally {
            setSubmitting(false);
        }
    }

    async function deleteAppointment(appointment: Appointment) {
        if (!window.confirm(`Xóa vĩnh viễn lịch hẹn #${appointment.id.slice(0, 8).toUpperCase()}? Dữ liệu này sẽ không thể khôi phục.`)) return;

        setSubmitting(true);
        try {
            await apiRequest<Appointment>(`/api/appointments/${appointment.id}`, { method: "DELETE" });
            await refresh("Đã xóa lịch hẹn.");
        } catch (appointmentError) {
            setToast(getApiErrorMessage(appointmentError, "Không thể xóa lịch hẹn."));
        } finally {
            setSubmitting(false);
        }
    }

    async function saveBranch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const payload = {
            name: String(form.get("name") || "").trim(),
            address: String(form.get("address") || "").trim(),
        };

        setSubmitting(true);
        try {
            await apiRequest<Branch>(
                editingBranch ? `/api/branches/${editingBranch.id}` : "/api/branches",
                {
                    method: editingBranch ? "PUT" : "POST",
                    body: JSON.stringify(payload),
                }
            );
            setModal(null);
            setEditingBranch(null);
            await refresh(editingBranch ? "Đã cập nhật chi nhánh." : "Đã thêm chi nhánh.");
        } catch (saveError) {
            setToast(getApiErrorMessage(saveError, "Không thể lưu chi nhánh."));
        } finally {
            setSubmitting(false);
        }
    }

    async function deleteBranch(branch: Branch) {
        if (!window.confirm(`Xóa vĩnh viễn chi nhánh “${branch.name}”? Dịch vụ và nhân viên hiện tại thuộc chi nhánh cũng sẽ bị xóa; lịch hẹn cũ vẫn giữ snapshot.`)) return;

        setSubmitting(true);
        try {
            await apiRequest<Branch>(`/api/branches/${branch.id}`, { method: "DELETE" });
            await refresh("Đã xóa chi nhánh.");
        } catch (branchError) {
            setToast(getApiErrorMessage(branchError, "Không thể xóa chi nhánh."));
        } finally {
            setSubmitting(false);
        }
    }

    async function saveService(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const base = {
            name: String(form.get("name") || "").trim(),
            price: Number(form.get("price")),
            duration_minutes: Number(form.get("duration_minutes")),
        };
        const payload = editingService
            ? base
            : { ...base, branch_id: Number(form.get("branch_id")) };

        setSubmitting(true);
        try {
            await apiRequest<Service>(
                editingService ? `/api/services/${editingService.id}` : "/api/services",
                {
                    method: editingService ? "PUT" : "POST",
                    body: JSON.stringify(payload),
                }
            );
            setModal(null);
            setEditingService(null);
            await refresh(editingService ? "Đã cập nhật dịch vụ." : "Đã thêm dịch vụ.");
        } catch (saveError) {
            setToast(getApiErrorMessage(saveError, "Không thể lưu dịch vụ."));
        } finally {
            setSubmitting(false);
        }
    }

    async function deleteService(service: Service) {
        if (!window.confirm(`Xóa vĩnh viễn dịch vụ “${service.name}”? Lịch hẹn cũ vẫn giữ snapshot dịch vụ.`)) return;

        setSubmitting(true);
        try {
            await apiRequest<Service>(`/api/services/${service.id}`, { method: "DELETE" });
            await refresh("Đã xóa dịch vụ.");
        } catch (serviceError) {
            setToast(getApiErrorMessage(serviceError, "Không thể xóa dịch vụ."));
        } finally {
            setSubmitting(false);
        }
    }

    async function saveStaff(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const payload = {
            full_name: String(form.get("full_name") || "").trim(),
            phone: String(form.get("phone") || "").trim(),
            email: String(form.get("email") || "").trim() || null,
            password: String(form.get("password") || ""),
            branch_id: Number(form.get("branch_id")),
        };

        setSubmitting(true);
        try {
            await apiRequest<AdminStaff>(
                "/api/staffs",
                { method: "POST", body: JSON.stringify(payload) }
            );
            setModal(null);
            await refresh("Đã thêm nhân viên.");
        } catch (saveError) {
            setToast(getApiErrorMessage(saveError, "Không thể thêm nhân viên."));
        } finally {
            setSubmitting(false);
        }
    }

    async function updateStaff(staff: AdminStaff, payload: { branch_id: number }) {
        setSubmitting(true);
        try {
            await apiRequest<AdminStaff>(
                `/api/staffs/${staff.id}`,
                { method: "PUT", body: JSON.stringify(payload) }
            );
            await refresh("Đã cập nhật nhân viên.");
        } catch (staffError) {
            setToast(getApiErrorMessage(staffError, "Không thể cập nhật nhân viên."));
        } finally {
            setSubmitting(false);
        }
    }

    async function deleteStaff(staff: AdminStaff) {
        if (!window.confirm(`Xóa vĩnh viễn nhân viên “${staff.full_name}”? Tài khoản nhân viên cũng sẽ bị xóa; lịch hẹn cũ vẫn giữ snapshot.`)) return;

        setSubmitting(true);
        try {
            await apiRequest<AdminStaff>(`/api/staffs/${staff.id}`, { method: "DELETE" });
            await refresh("Đã xóa nhân viên.");
        } catch (staffError) {
            setToast(getApiErrorMessage(staffError, "Không thể xóa nhân viên."));
        } finally {
            setSubmitting(false);
        }
    }

    async function saveOffer(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const payload = {
            name: String(form.get("name") || "").trim(),
            details: String(form.get("details") || "").trim(),
            start_date: String(form.get("start_date") || ""),
            end_date: String(form.get("end_date") || ""),
            image: String(form.get("image") || "").trim(),
            sort_order: Number(form.get("sort_order") || 0),
        };

        setSubmitting(true);
        try {
            await apiRequest<Offer>(
                editingOffer ? `/api/offers/${editingOffer.id}` : "/api/offers",
                {
                    method: editingOffer ? "PUT" : "POST",
                    body: JSON.stringify(payload),
                }
            );
            setModal(null);
            setEditingOffer(null);
            await refresh(editingOffer ? "Đã cập nhật ưu đãi." : "Đã thêm ưu đãi.");
        } catch (saveError) {
            setToast(getApiErrorMessage(saveError, "Không thể lưu ưu đãi."));
        } finally {
            setSubmitting(false);
        }
    }

    async function deleteOffer(offer: Offer) {
        if (!window.confirm(`Xóa vĩnh viễn ưu đãi “${offer.name}”?`)) return;
        setSubmitting(true);
        try {
            await apiRequest<Offer>(`/api/offers/${offer.id}`, { method: "DELETE" });
            await refresh("Đã xóa ưu đãi.");
        } catch (offerError) {
            setToast(getApiErrorMessage(offerError, "Không thể xóa ưu đãi."));
        } finally {
            setSubmitting(false);
        }
    }

    if (!ready) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f4f0ea]">
                <div className="text-sm text-muted">Đang kiểm tra quyền quản trị…</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f0ea] text-ink">
            <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
                <aside className="border-b border-line bg-[#2d2926] text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-white/10">
                    <div className="flex h-[76px] items-center justify-between px-5 lg:px-6">
                        <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-full border border-[#c9aa96]/60 font-serif text-[11px]">SR</span>
                            <div>
                                <p className="font-serif text-lg leading-none">Serpente Nail Room</p>
                                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/40">Admin Console</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 lg:hidden">
                            <Link href="/admin/security" className="rounded-full border border-white/10 px-3 py-2 text-[10px] text-white/70">
                                Bảo mật
                            </Link>
                            <button onClick={logout} className="rounded-full border border-white/10 px-3 py-2 text-[10px] text-white/55">
                                Đăng xuất
                            </button>
                        </div>
                    </div>

                    <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 py-3 lg:block lg:space-y-1 lg:border-t-0 lg:px-4 lg:py-6">
                        {tabItems.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setTab(item.key)}
                                className={`shrink-0 rounded-xl px-4 py-2.5 text-left text-xs font-medium transition lg:block lg:w-full lg:px-4 lg:py-3 ${tab === item.key ? "bg-[#c6a38e] text-[#2d2926]" : "text-white/60 hover:bg-white/[0.06] hover:text-white"}`}
                            >
                                <span className="lg:hidden">{item.short}</span>
                                <span className="hidden lg:inline">{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="absolute bottom-0 left-0 hidden w-[248px] border-t border-white/10 p-5 lg:block">
                        <p className="truncate text-xs font-semibold">{admin?.full_name}</p>
                        <p className="mt-1 truncate text-[10px] text-white/40">{admin?.phone}</p>
                        <div className="mt-4 flex flex-col gap-2">
                            <Link href="/admin/security" className="text-[11px] font-semibold text-[#d6b6a3] hover:text-white">
                                Đổi mật khẩu →
                            </Link>
                            <button onClick={logout} className="w-fit text-[11px] font-semibold text-white/55 hover:text-white">
                                Đăng xuất →
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="min-w-0">
                    <header className="sticky top-0 z-30 border-b border-line bg-[#f4f0ea]/95 backdrop-blur-md">
                        <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-accent">
                                    {tabItems.find((item) => item.key === tab)?.label}
                                </p>
                                <h1 className="mt-1 font-serif text-2xl tracking-[-0.025em]">
                                    Xin chào, {admin?.full_name.split(" ").slice(-1)[0]}
                                </h1>
                            </div>
                            <button
                                type="button"
                                disabled={refreshing}
                                onClick={() => void refresh()}
                                className="rounded-full border border-line bg-white px-4 py-2.5 text-[11px] font-semibold transition hover:border-accent/50 disabled:opacity-50"
                            >
                                {refreshing ? "Đang tải…" : "Làm mới"}
                            </button>
                        </div>
                    </header>

                    <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
                        {error ? (
                            <div className="mb-5 rounded-2xl border border-[#d8aaa0] bg-[#faeeeb] px-5 py-4 text-xs text-[#854d42]">
                                {error}
                            </div>
                        ) : null}

                        {loading ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <div key={index} className="h-32 animate-pulse rounded-2xl border border-line bg-white/65" />
                                ))}
                            </div>
                        ) : (
                            <>
                                {tab === "overview" ? (
                                    <Overview
                                        data={data}
                                        todayStats={todayStats}
                                        branchCount={branchCount}
                                        serviceCount={serviceCount}
                                        staffCount={staffCount}
                                        setTab={setTab}
                                    />
                                ) : null}

                                {tab === "appointments" ? (
                                    <AppointmentsPanel
                                        appointments={data.appointments}
                                        branches={data.branches}
                                        branchFilter={appointmentBranch}
                                        statusFilter={appointmentStatus}
                                        setBranchFilter={(value) => {
                                            setAppointmentBranch(value);
                                            setAppointmentPage(1);
                                        }}
                                        setStatusFilter={(value) => {
                                            setAppointmentStatus(value);
                                            setAppointmentPage(1);
                                        }}
                                        page={appointmentPage}
                                        pages={appointmentPages}
                                        setPage={setAppointmentPage}
                                        updateStatus={updateAppointmentStatus}
                                        onDelete={deleteAppointment}
                                        submitting={submitting}
                                    />
                                ) : null}

                                {tab === "services" ? (
                                    <ServicesPanel
                                        services={data.services}
                                        branches={data.branches}
                                        onAdd={() => {
                                            setEditingService(null);
                                            setModal("service");
                                        }}
                                        onEdit={(service) => {
                                            setEditingService(service);
                                            setModal("service");
                                        }}
                                        onDelete={deleteService}
                                        submitting={submitting}
                                    />
                                ) : null}

                                {tab === "staff" ? (
                                    <StaffPanel
                                        staff={data.staff}
                                        branches={data.branches}
                                        onAdd={() => setModal("staff")}
                                        onUpdate={updateStaff}
                                        onDelete={deleteStaff}
                                        submitting={submitting}
                                    />
                                ) : null}

                                {tab === "branches" ? (
                                    <BranchesPanel
                                        branches={data.branches}
                                        onAdd={() => {
                                            setEditingBranch(null);
                                            setModal("branch");
                                        }}
                                        onEdit={(branch) => {
                                            setEditingBranch(branch);
                                            setModal("branch");
                                        }}
                                        onDelete={deleteBranch}
                                        submitting={submitting}
                                    />
                                ) : null}

                                {tab === "offers" ? (
                                    <OffersPanel
                                        offers={data.offers}
                                        onAdd={() => {
                                            setEditingOffer(null);
                                            setModal("offer");
                                        }}
                                        onEdit={(offer) => {
                                            setEditingOffer(offer);
                                            setModal("offer");
                                        }}
                                        onDelete={deleteOffer}
                                        submitting={submitting}
                                    />
                                ) : null}
                            </>
                        )}
                    </div>
                </main>
            </div>

            {modal === "branch" ? (
                <Modal
                    title={editingBranch ? "Sửa chi nhánh" : "Thêm chi nhánh"}
                    onClose={() => {
                        setModal(null);
                        setEditingBranch(null);
                    }}
                >
                    <form onSubmit={saveBranch} className="grid gap-5 md:grid-cols-2">
                        <Field label="Tên chi nhánh">
                            <input name="name" defaultValue={editingBranch?.name || ""} className={inputClass} required maxLength={255} />
                        </Field>
                        <Field label="Địa chỉ" span>
                            <input name="address" defaultValue={editingBranch?.address || ""} className={inputClass} required maxLength={255} />
                        </Field>
                        <div className="flex justify-end gap-3 md:col-span-2">
                            <button type="button" onClick={() => setModal(null)} className="rounded-full border border-line px-5 py-2.5 text-xs font-semibold">
                                Hủy
                            </button>
                            <button disabled={submitting} className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
                                {submitting ? "Đang lưu…" : "Lưu chi nhánh"}
                            </button>
                        </div>
                    </form>
                </Modal>
            ) : null}

            {modal === "service" ? (
                <Modal
                    title={editingService ? "Sửa dịch vụ" : "Thêm dịch vụ"}
                    onClose={() => {
                        setModal(null);
                        setEditingService(null);
                    }}
                >
                    <form onSubmit={saveService} className="grid gap-5 md:grid-cols-2">
                        {!editingService ? (
                            <Field label="Chi nhánh">
                                <select name="branch_id" className={selectClass} required defaultValue="">
                                    <option value="" disabled>Chọn chi nhánh</option>
                                    {data.branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>{localizeBranchName(branch.name)}</option>
                                    ))}
                                </select>
                            </Field>
                        ) : (
                            <Field label="Chi nhánh">
                                <div className="flex h-11 items-center rounded-xl border border-line bg-[#eee9e3] px-3.5 text-sm text-muted">
                                    {localizeBranchName(data.branches.find((branch) => branch.id === editingService.branch_id)?.name || `#${editingService.branch_id}`)}
                                </div>
                            </Field>
                        )}
                        <Field label="Tên dịch vụ">
                            <input name="name" defaultValue={editingService?.name || ""} className={inputClass} required maxLength={255} />
                        </Field>
                        <Field label="Giá (VND)">
                            <input name="price" type="number" min="0" step="1" defaultValue={editingService?.price ?? ""} className={inputClass} required />
                        </Field>
                        <Field label="Thời lượng (phút)">
                            <input name="duration_minutes" type="number" min="1" step="1" defaultValue={editingService?.duration_minutes ?? ""} className={inputClass} required />
                        </Field>
                        <div className="flex justify-end gap-3 md:col-span-2">
                            <button type="button" onClick={() => setModal(null)} className="rounded-full border border-line px-5 py-2.5 text-xs font-semibold">Hủy</button>
                            <button disabled={submitting} className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
                                {submitting ? "Đang lưu…" : "Lưu dịch vụ"}
                            </button>
                        </div>
                    </form>
                </Modal>
            ) : null}

            {modal === "staff" ? (
                <Modal title="Thêm nhân viên" description="Tài khoản nhân viên được tạo đồng thời với hồ sơ nhân sự." onClose={() => setModal(null)}>
                    <form onSubmit={saveStaff} className="grid gap-5 md:grid-cols-2">
                        <Field label="Họ tên">
                            <input name="full_name" className={inputClass} required />
                        </Field>
                        <Field label="Chi nhánh">
                            <select name="branch_id" className={selectClass} required defaultValue="">
                                <option value="" disabled>Chọn chi nhánh</option>
                                {data.branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>{localizeBranchName(branch.name)}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Số điện thoại">
                            <input name="phone" type="tel" className={inputClass} required />
                        </Field>
                        <Field label="Email">
                            <input name="email" type="email" className={inputClass} />
                        </Field>
                        <Field label="Mật khẩu khởi tạo" span>
                            <input name="password" type="password" minLength={8} className={inputClass} required />
                        </Field>
                        <div className="flex justify-end gap-3 md:col-span-2">
                            <button type="button" onClick={() => setModal(null)} className="rounded-full border border-line px-5 py-2.5 text-xs font-semibold">Hủy</button>
                            <button disabled={submitting} className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
                                {submitting ? "Đang tạo…" : "Tạo nhân viên"}
                            </button>
                        </div>
                    </form>
                </Modal>
            ) : null}

            {modal === "offer" ? (
                <Modal
                    title={editingOffer ? "Sửa ưu đãi" : "Thêm ưu đãi"}
                    description="Ưu đãi tự xuất hiện trên website khi ngày hiện tại nằm trong khoảng áp dụng."
                    onClose={() => {
                        setModal(null);
                        setEditingOffer(null);
                    }}
                >
                    <form onSubmit={saveOffer} className="grid gap-5 md:grid-cols-2">
                        <Field label="Tên ưu đãi" span>
                            <input name="name" defaultValue={editingOffer?.name || ""} className={inputClass} required maxLength={255} />
                        </Field>
                        <Field label="Từ ngày">
                            <input name="start_date" type="date" defaultValue={editingOffer?.start_date || ""} className={inputClass} required />
                        </Field>
                        <Field label="Đến ngày">
                            <input name="end_date" type="date" defaultValue={editingOffer?.end_date || ""} className={inputClass} required />
                        </Field>
                        <Field label="Ảnh">
                            <input name="image" defaultValue={editingOffer?.image || "/nails/nail-01.png"} className={inputClass} required />
                        </Field>
                        <Field label="Thứ tự">
                            <input name="sort_order" type="number" min="0" step="1" defaultValue={editingOffer?.sort_order ?? 0} className={inputClass} required />
                        </Field>
                        <Field label="Mô tả" span>
                            <textarea name="details" defaultValue={editingOffer?.details || ""} className={textareaClass} required maxLength={2000} />
                        </Field>
                        <div className="flex justify-end gap-3 md:col-span-2">
                            <button type="button" onClick={() => setModal(null)} className="rounded-full border border-line px-5 py-2.5 text-xs font-semibold">Hủy</button>
                            <button disabled={submitting} className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
                                {submitting ? "Đang lưu…" : "Lưu ưu đãi"}
                            </button>
                        </div>
                    </form>
                </Modal>
            ) : null}

            {toast ? (
                <div className="fixed bottom-5 right-5 z-[120] max-w-sm rounded-2xl border border-line bg-[#2d2926] px-5 py-4 text-xs leading-5 text-white shadow-2xl">
                    {toast}
                </div>
            ) : null}
        </div>
    );
}

function Overview({
    data,
    todayStats,
    branchCount,
    serviceCount,
    staffCount,
    setTab,
}: {
    data: LoadState;
    todayStats: { total: number; pending: number; confirmed: number; completed: number };
    branchCount: number;
    serviceCount: number;
    staffCount: number;
    setTab: (tab: TabKey) => void;
}) {
    const cards = [
        { label: "Lịch đang tải", value: data.appointmentTotal, note: "Tổng lịch theo dữ liệu hiện có" },
        { label: "Chờ xác nhận hôm nay", value: todayStats.pending, note: `${todayStats.total} lịch trong ngày` },
        { label: "Nhân viên", value: staffCount, note: "Hồ sơ nhân viên hiện tại" },
        { label: "Dịch vụ", value: serviceCount, note: `${branchCount} chi nhánh hiện tại` },
    ];

    const upcoming = data.appointments
        .filter((appointment) => !["completed", "cancelled"].includes(appointment.status))
        .slice(0, 6);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <article key={card.label} className="rounded-[20px] border border-line bg-white p-5 shadow-[0_8px_30px_rgba(48,40,35,0.035)]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{card.label}</p>
                        <p className="mt-4 font-serif text-4xl tracking-[-0.035em]">{card.value}</p>
                        <p className="mt-2 text-[11px] text-muted">{card.note}</p>
                    </article>
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
                <section className="overflow-hidden rounded-[22px] border border-line bg-white">
                    <div className="flex items-center justify-between border-b border-line px-5 py-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Vận hành</p>
                            <h2 className="mt-1 font-serif text-2xl">Lịch sắp tới</h2>
                        </div>
                        <button onClick={() => setTab("appointments")} className="text-[11px] font-semibold text-accent">Xem tất cả →</button>
                    </div>
                    <div className="divide-y divide-line">
                        {upcoming.length ? upcoming.map((appointment) => (
                            <div key={appointment.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[150px_1fr_auto] sm:items-center">
                                <div>
                                    <p className="text-xs font-semibold">{formatDateTime(appointment.start_time)}</p>
                                    <p className="mt-1 text-[10px] text-muted">{appointment.branch?.name ? localizeBranchName(appointment.branch.name) : `CN #${appointment.branch_id}`}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{appointment.customer?.full_name || "Khách hàng"}</p>
                                    <p className="mt-1 text-[10px] text-muted">{appointment.appointment_services?.map((service) => service.service_name).join(", ") || "—"}</p>
                                </div>
                                <span className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-semibold ${badgeClass(appointment.status)}`}>
                                    {formatAppointmentStatus(appointment.status)}
                                </span>
                            </div>
                        )) : (
                            <p className="px-5 py-10 text-center text-xs text-muted">Chưa có lịch sắp tới.</p>
                        )}
                    </div>
                </section>

                <section className="rounded-[22px] border border-line bg-[#2d2926] p-5 text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d0ad97]">Hôm nay</p>
                    <h2 className="mt-2 font-serif text-3xl">Nhịp vận hành</h2>
                    <div className="mt-7 space-y-3">
                        {[
                            ["Tổng lịch", todayStats.total],
                            ["Chờ xác nhận", todayStats.pending],
                            ["Đã xác nhận", todayStats.confirmed],
                            ["Hoàn thành", todayStats.completed],
                        ].map(([label, value]) => (
                            <div key={String(label)} className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                                <span className="text-white/55">{label}</span>
                                <span className="font-serif text-xl">{value}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function AppointmentsPanel({
    appointments,
    branches,
    branchFilter,
    statusFilter,
    setBranchFilter,
    setStatusFilter,
    page,
    pages,
    setPage,
    updateStatus,
    onDelete,
    submitting,
}: {
    appointments: Appointment[];
    branches: Branch[];
    branchFilter: string;
    statusFilter: string;
    setBranchFilter: (value: string) => void;
    setStatusFilter: (value: string) => void;
    page: number;
    pages: number;
    setPage: (page: number) => void;
    updateStatus: (appointment: Appointment, status: string) => Promise<void>;
    onDelete: (appointment: Appointment) => Promise<void>;
    submitting: boolean;
}) {
    return (
        <section className="overflow-hidden rounded-[22px] border border-line bg-white">
            <div className="flex flex-col gap-4 border-b border-line p-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Quản lý lịch hẹn</p>
                    <h2 className="mt-1 font-serif text-3xl">Lịch salon</h2>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} className="h-10 rounded-xl border border-line bg-cream px-3 text-xs outline-none">
                        <option value="">Tất cả chi nhánh</option>
                        {branches.map((branch) => <option key={branch.id} value={branch.id}>{localizeBranchName(branch.name)}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border border-line bg-cream px-3 text-xs outline-none">
                        <option value="">Tất cả trạng thái</option>
                        {statusOrder.map((status) => <option key={status} value={status}>{formatAppointmentStatus(status)}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-[950px] w-full text-left">
                    <thead className="bg-[#f8f5f1] text-[9px] uppercase tracking-[0.14em] text-muted">
                        <tr>
                            <th className="px-5 py-3 font-semibold">Thời gian</th>
                            <th className="px-5 py-3 font-semibold">Khách hàng</th>
                            <th className="px-5 py-3 font-semibold">Dịch vụ</th>
                            <th className="px-5 py-3 font-semibold">Nhân viên</th>
                            <th className="px-5 py-3 font-semibold">Chi nhánh</th>
                            <th className="px-5 py-3 font-semibold">Trạng thái</th>
                            <th className="px-5 py-3 font-semibold">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-xs">
                        {appointments.map((appointment) => {
                            const allowed =
                                appointment.status === "pending"
                                    ? ["confirmed", "cancelled"]
                                    : appointment.status === "confirmed"
                                      ? ["in_progress", "cancelled"]
                                      : appointment.status === "in_progress"
                                        ? ["completed", "cancelled"]
                                        : [];

                            return (
                                <tr key={appointment.id} className="align-top">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <p className="font-semibold">{formatDateTime(appointment.start_time)}</p>
                                        <p className="mt-1 text-[10px] text-muted">đến {formatDateTime(appointment.end_time).split(" ").slice(-1)[0]}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-medium">{appointment.customer?.full_name || "—"}</p>
                                        <p className="mt-1 text-[10px] text-muted">{appointment.customer?.phone || appointment.user_id.slice(0, 8)}</p>
                                    </td>
                                    <td className="max-w-[240px] px-5 py-4">
                                        <p className="leading-5">{appointment.appointment_services?.map((service) => service.service_name).join(", ") || "—"}</p>
                                        <p className="mt-1 text-[10px] text-muted">
                                            {formatVnd(appointment.appointment_services?.reduce((sum, service) => sum + service.price, 0) || 0)} VND
                                        </p>
                                    </td>
                                    <td className="px-5 py-4">{appointment.staff?.full_name || appointment.staff_id.slice(0, 8)}</td>
                                    <td className="px-5 py-4">{appointment.branch?.name ? localizeBranchName(appointment.branch.name) : `#${appointment.branch_id}`}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold ${badgeClass(appointment.status)}`}>
                                            {formatAppointmentStatus(appointment.status)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            {allowed.length ? (
                                                <select
                                                    defaultValue=""
                                                    disabled={submitting}
                                                    onChange={(event) => {
                                                        const value = event.target.value;
                                                        if (value) void updateStatus(appointment, value);
                                                        event.target.value = "";
                                                    }}
                                                    className="h-8 rounded-lg border border-line bg-white px-2 text-[10px] outline-none"
                                                >
                                                    <option value="">Cập nhật…</option>
                                                    {allowed.map((status) => <option key={status} value={status}>{formatAppointmentStatus(status)}</option>)}
                                                </select>
                                            ) : (
                                                <span className="text-[10px] text-muted">Đã khóa</span>
                                            )}
                                            <button
                                                disabled={submitting}
                                                onClick={() => void onDelete(appointment)}
                                                className="font-semibold text-[#8a5147]"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {!appointments.length ? <p className="px-5 py-12 text-center text-xs text-muted">Không có lịch phù hợp bộ lọc.</p> : null}

            <div className="flex items-center justify-between border-t border-line px-5 py-4">
                <p className="text-[10px] text-muted">Trang {page}/{pages}</p>
                <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-line px-3 py-2 text-[10px] font-semibold disabled:opacity-35">← Trước</button>
                    <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-full border border-line px-3 py-2 text-[10px] font-semibold disabled:opacity-35">Sau →</button>
                </div>
            </div>
        </section>
    );
}

function ServicesPanel({
    services,
    branches,
    onAdd,
    onEdit,
    onDelete,
    submitting,
}: {
    services: Service[];
    branches: Branch[];
    onAdd: () => void;
    onEdit: (service: Service) => void;
    onDelete: (service: Service) => Promise<void>;
    submitting: boolean;
}) {
    return (
        <section className="overflow-hidden rounded-[22px] border border-line bg-white">
            <PanelHeading eyebrow="Danh mục" title="Dịch vụ" action="Thêm dịch vụ" onAction={onAdd} />
            <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full text-left text-xs">
                    <thead className="bg-[#f8f5f1] text-[9px] uppercase tracking-[0.14em] text-muted">
                        <tr>
                            <th className="px-5 py-3">Tên</th>
                            <th className="px-5 py-3">Chi nhánh</th>
                            <th className="px-5 py-3">Giá</th>
                            <th className="px-5 py-3">Thời lượng</th>
                            <th className="px-5 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {services.map((service) => (
                            <tr key={service.id}>
                                <td className="px-5 py-4 font-medium">{service.name}</td>
                                <td className="px-5 py-4">{localizeBranchName(branches.find((branch) => branch.id === service.branch_id)?.name || `#${service.branch_id}`)}</td>
                                <td className="px-5 py-4">{formatVnd(service.price)} VND</td>
                                <td className="px-5 py-4">{service.duration_minutes} phút</td>
                                <td className="px-5 py-4">
                                    <div className="flex gap-3">
                                        <button onClick={() => onEdit(service)} className="font-semibold text-accent">Sửa</button>
                                        <button disabled={submitting} onClick={() => void onDelete(service)} className="font-semibold text-[#8a5147]">Xóa</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function StaffPanel({
    staff,
    branches,
    onAdd,
    onUpdate,
    onDelete,
    submitting,
}: {
    staff: AdminStaff[];
    branches: Branch[];
    onAdd: () => void;
    onUpdate: (staff: AdminStaff, payload: { branch_id: number }) => Promise<void>;
    onDelete: (staff: AdminStaff) => Promise<void>;
    submitting: boolean;
}) {
    return (
        <section className="overflow-hidden rounded-[22px] border border-line bg-white">
            <PanelHeading eyebrow="Nhân sự" title="Nhân viên" action="Thêm nhân viên" onAction={onAdd} />
            <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full text-left text-xs">
                    <thead className="bg-[#f8f5f1] text-[9px] uppercase tracking-[0.14em] text-muted">
                        <tr>
                            <th className="px-5 py-3">Nhân viên</th>
                            <th className="px-5 py-3">Liên hệ</th>
                            <th className="px-5 py-3">Chi nhánh</th>
                            <th className="px-5 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {staff.map((person) => (
                            <tr key={person.id}>
                                <td className="px-5 py-4 font-medium">{person.full_name}</td>
                                <td className="px-5 py-4">
                                    <p>{person.phone}</p>
                                    <p className="mt-1 text-[10px] text-muted">{person.email || "Chưa có email"}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <select
                                        value={person.branch_id}
                                        disabled={submitting}
                                        onChange={(event) => void onUpdate(person, { branch_id: Number(event.target.value) })}
                                        className="h-9 rounded-lg border border-line bg-white px-2 text-[11px]"
                                    >
                                        {branches.map((branch) => <option key={branch.id} value={branch.id}>{localizeBranchName(branch.name)}</option>)}
                                    </select>
                                </td>
                                <td className="px-5 py-4">
                                    <button
                                        disabled={submitting}
                                        onClick={() => void onDelete(person)}
                                        className="font-semibold text-[#8a5147]"
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function BranchesPanel({
    branches,
    onAdd,
    onEdit,
    onDelete,
    submitting,
}: {
    branches: Branch[];
    onAdd: () => void;
    onEdit: (branch: Branch) => void;
    onDelete: (branch: Branch) => Promise<void>;
    submitting: boolean;
}) {
    return (
        <section className="overflow-hidden rounded-[22px] border border-line bg-white">
            <PanelHeading eyebrow="Hệ thống" title="Chi nhánh" action="Thêm chi nhánh" onAction={onAdd} />
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {branches.map((branch) => (
                    <article key={branch.id} className="rounded-2xl border border-line bg-[#faf8f5] p-5">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-accent">Chi nhánh #{branch.id}</p>
                            <h3 className="mt-2 font-serif text-2xl">{localizeBranchName(branch.name)}</h3>
                        </div>
                        <p className="mt-4 min-h-10 text-xs leading-5 text-muted">{branch.address}</p>
                        <div className="mt-5 flex gap-4 border-t border-line pt-4 text-[11px]">
                            <button onClick={() => onEdit(branch)} className="font-semibold text-accent">Chỉnh sửa</button>
                            <button disabled={submitting} onClick={() => void onDelete(branch)} className="font-semibold text-[#8a5147]">Xóa</button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function OffersPanel({
    offers,
    onAdd,
    onEdit,
    onDelete,
    submitting,
}: {
    offers: Offer[];
    onAdd: () => void;
    onEdit: (offer: Offer) => void;
    onDelete: (offer: Offer) => Promise<void>;
    submitting: boolean;
}) {
    return (
        <section className="overflow-hidden rounded-[22px] border border-line bg-white">
            <PanelHeading eyebrow="Website" title="Ưu đãi" action="Thêm ưu đãi" onAction={onAdd} />
            <div className="grid gap-4 p-5 lg:grid-cols-2 2xl:grid-cols-3">
                {offers.map((offer) => {
                    const status = getOfferStatus(offer);
                    return (
                        <article key={offer.id} className="rounded-2xl border border-line bg-[#faf8f5] p-5">
                            <div className="flex items-start justify-between gap-4">
                                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${badgeClass(status)}`}>{status}</span>
                                <span className="text-[10px] text-muted">#{offer.sort_order}</span>
                            </div>
                            <h3 className="mt-4 font-serif text-2xl leading-tight">{offer.name}</h3>
                            <p className="mt-3 line-clamp-3 text-xs leading-5 text-muted">{offer.details}</p>
                            <p className="mt-4 text-[10px] font-semibold text-ink">{formatDate(offer.start_date)} — {formatDate(offer.end_date)}</p>
                            <p className="mt-1 truncate text-[10px] text-muted">{offer.image}</p>
                            <div className="mt-5 flex gap-4 border-t border-line pt-4 text-[11px]">
                                <button onClick={() => onEdit(offer)} className="font-semibold text-accent">Chỉnh sửa</button>
                                <button disabled={submitting} onClick={() => void onDelete(offer)} className="font-semibold text-[#8a5147]">Xóa</button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

function PanelHeading({
    eyebrow,
    title,
    action,
    onAction,
}: {
    eyebrow: string;
    title: string;
    action: string;
    onAction: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-line p-5">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
                <h2 className="mt-1 font-serif text-3xl">{title}</h2>
            </div>
            <button onClick={onAction} className="rounded-full bg-ink px-4 py-2.5 text-[11px] font-semibold text-white transition hover:-translate-y-0.5">
                + {action}
            </button>
        </div>
    );
}

