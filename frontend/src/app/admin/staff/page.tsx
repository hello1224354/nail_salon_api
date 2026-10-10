"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest, getApiErrorMessage, type AdminStaff } from "@/lib/api";
import { getAuthUser, restoreSession } from "@/lib/auth";

export default function StaffManagementPage() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [staff, setStaff] = useState<AdminStaff[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingDelete, setPendingDelete] = useState<AdminStaff | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    async function refreshStaff() {
        const people = await apiRequest<AdminStaff[]>("/api/staffs/admin");
        setStaff(people);
    }

    useEffect(() => {
        let active = true;
        void (async () => {
            const restored = await restoreSession();
            const user = getAuthUser();
            if (!restored || !user || user.role.toLowerCase() !== "admin") {
                router.replace("/admin/login");
                return;
            }
            if (!active) return;
            setAuthorized(true);
            try {
                await refreshStaff();
            } catch (cause) {
                if (active) setError(getApiErrorMessage(cause, "Không tải được nhân viên."));
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [router]);

    async function confirmDelete() {
        if (!pendingDelete || deleting) return;
        setDeleting(true);
        setError("");
        setNotice("");
        const person = pendingDelete;
        try {
            await apiRequest<AdminStaff>(`/api/staffs/${person.id}`, { method: "DELETE" });
            await refreshStaff();
            setPendingDelete(null);
            setNotice(`Đã xóa nhân viên “${person.full_name}”.`);
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Chưa xóa được nhân viên."));
        } finally {
            setDeleting(false);
        }
    }

    if (!authorized) {
        return <div className="min-h-screen bg-[#f4f0ea] p-10 text-sm">Đang kiểm tra quyền quản trị…</div>;
    }

    return (
        <main className="min-h-screen bg-[#f4f0ea] px-4 py-10 text-[#302823] sm:px-8">
            <div className="mx-auto max-w-5xl">
                <Link href="/admin" className="text-sm font-semibold underline">← Quay lại quản trị</Link>
                <h1 className="mt-6 font-serif text-4xl">Quản lý nhân viên</h1>
                <p className="mt-3 text-sm text-[#736d67]">Xóa nhân viên chỉ sau khi xác nhận trong trang. Các lịch hẹn cũ vẫn lưu thông tin.</p>
                {notice ? <p role="status" className="mt-5 rounded-xl bg-white p-4 text-sm">{notice}</p> : null}
                {error ? <p role="alert" className="mt-5 rounded-xl border border-red-300 bg-white p-4 text-sm text-red-700">{error}</p> : null}
                <div className="mt-7 overflow-x-auto rounded-2xl bg-white shadow-sm">
                    {loading ? <p className="p-6 text-sm">Đang tải nhân viên…</p> : (
                        <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="bg-[#f8f5f1] text-xs">
                                <tr>
                                    <th className="px-5 py-4">Nhân viên</th>
                                    <th className="px-5 py-4">Email</th>
                                    <th className="px-5 py-4">Giờ làm</th>
                                    <th className="px-5 py-4">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {staff.map((person) => (
                                    <tr key={person.id}>
                                        <td className="px-5 py-4 font-semibold">{person.full_name}</td>
                                        <td className="px-5 py-4">{person.email || "—"}</td>
                                        <td className="px-5 py-4">{person.work_start_time}–{person.work_end_time}</td>
                                        <td className="px-5 py-4">
                                            <button type="button" className="font-semibold text-red-800 underline" onClick={() => { setError(""); setNotice(""); setPendingDelete(person); }}>Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {pendingDelete ? (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4" role="presentation">
                    <div role="dialog" aria-modal="true" aria-labelledby="staff-delete-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 id="staff-delete-title" className="font-serif text-2xl">Xác nhận xóa nhân viên</h2>
                        <p className="mt-4 text-sm leading-6">
                            Xóa vĩnh viễn <strong>{pendingDelete.full_name}</strong> ({pendingDelete.email})?
                            Tài khoản nhân viên sẽ bị xóa và không thể khôi phục.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" disabled={deleting} onClick={() => setPendingDelete(null)} className="rounded-full border px-5 py-2 text-sm disabled:opacity-50">Hủy</button>
                            <button type="button" disabled={deleting} onClick={() => void confirmDelete()} className="rounded-full bg-red-800 px-5 py-2 text-sm text-white disabled:opacity-50">{deleting ? "Đang xóa…" : "Xóa nhân viên"}</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}
