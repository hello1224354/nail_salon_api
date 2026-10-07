import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
    title: "Trang quản trị",
    description: "Quản lý lịch hẹn, dịch vụ và thông tin vận hành của Serpente Nail Room.",
    robots: { index: false, follow: false },
};

export default function AdminPage() {
    return <AdminDashboard />;
}
