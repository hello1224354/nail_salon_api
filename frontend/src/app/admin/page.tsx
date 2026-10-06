import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
    title: "Admin Dashboard",
    description: "Trang quản trị NS Nail Studio.",
    robots: { index: false, follow: false },
};

export default function AdminPage() {
    return <AdminDashboard />;
}
