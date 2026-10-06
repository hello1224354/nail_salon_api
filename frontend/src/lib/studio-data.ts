import type { Service } from "@/lib/api";

export type ServiceCategory = "Tay" | "Chân" | "Nghệ thuật & chăm sóc";

export type StudioService = Service & {
    category: ServiceCategory;
    description: string;
    image: string;
};

export const studio = {
    name: "Serpente Nail Room",
    branch: "Quận 8",
    address: "Lô 02.12 - Tầng 2 Pega Square, Chung cư Pegasuite, 1002 Tạ Quang Bửu, P. Bình Đông, TP.HCM",
    hours: "Hằng ngày 09:00–20:30",
    phoneDisplay: "081 879 8098",
    phoneHref: "tel:+84818798098",
    instagramUrl: "https://www.instagram.com/serpente.nailroom/",
    mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=1002+Ta+Quang+Buu%2C+Ho+Chi+Minh+City",
} as const;

type ServicePresentation = Pick<StudioService, "category" | "description" | "image"> & {
    displayName: string;
};

const servicePresentation: Record<string, ServicePresentation> = {
    "classic manicure": {
        displayName: "Sơn móng tay cơ bản",
        category: "Tay",
        description: "Tạo dáng móng, chăm sóc da viền và sơn màu thường.",
        image: "/nails/nail-01.png",
    },
    "gel manicure": {
        displayName: "Sơn gel tay",
        category: "Tay",
        description: "Hoàn thiện bộ móng tay sạch đẹp với lớp gel bền màu.",
        image: "/nails/nail-02.png",
    },
    "classic pedicure": {
        displayName: "Sơn móng chân cơ bản",
        category: "Chân",
        description: "Chăm sóc móng chân và hoàn thiện bằng sơn màu thường.",
        image: "/nails/nail-03.png",
    },
    "gel pedicure": {
        displayName: "Sơn gel chân",
        category: "Chân",
        description: "Chăm sóc móng chân trọn gói với lớp gel bền màu.",
        image: "/nails/nail-03.png",
    },
    "nail art": {
        displayName: "Vẽ móng nghệ thuật",
        category: "Nghệ thuật & chăm sóc",
        description: "Trang trí tinh tế và thiết kế chi tiết theo phong cách riêng.",
        image: "/nails/nail-04.png",
    },
    "gel removal": {
        displayName: "Tháo gel",
        category: "Nghệ thuật & chăm sóc",
        description: "Tháo gel nhẹ nhàng kết hợp chăm sóc móng.",
        image: "/nails/nail-care.png",
    },
    "nail repair": {
        displayName: "Phục hồi móng",
        category: "Nghệ thuật & chăm sóc",
        description: "Chăm sóc và xử lý móng bị sứt hoặc gãy.",
        image: "/nails/nail-care.png",
    },
    "french finish": {
        displayName: "Sơn kiểu Pháp",
        category: "Nghệ thuật & chăm sóc",
        description: "Hoàn thiện đầu móng kiểu Pháp gọn gàng và chính xác.",
        image: "/nails/nail-04.png",
    },
    "cuticle care": {
        displayName: "Chăm sóc da viền móng",
        category: "Nghệ thuật & chăm sóc",
        description: "Làm sạch và chăm sóc kỹ vùng da quanh móng.",
        image: "/nails/nail-care.png",
    },
};

export function decorateService(service: Service): StudioService {
    const presentation = servicePresentation[service.name.trim().toLowerCase()] ?? {
        displayName: service.name,
        category: "Nghệ thuật & chăm sóc" as const,
        description: "Dịch vụ chăm sóc móng chuyên nghiệp tại Serpente Nail Room.",
        image: "/nails/nail-care.png",
    };

    return {
        ...service,
        name: presentation.displayName,
        category: presentation.category,
        description: presentation.description,
        image: presentation.image,
    };
}

export function formatVnd(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value);
}

export function localizeBranchName(name: string) {
    return name
        .replace(/^District\s+(\d+)$/i, "Quận $1")
        .replace(/^District\s+/i, "Quận ");
}

export function localizeAddress(address: string) {
    return address
        .replace(/Le Loi/gi, "Lê Lợi")
        .replace(/District\s+(\d+)/gi, "Quận $1")
        .replace(/Ho Chi Minh City/gi, "TP. Hồ Chí Minh");
}

export function formatAppointmentStatus(status: string) {
    const labels: Record<string, string> = {
        pending: "Đang chờ xác nhận",
        confirmed: "Đã xác nhận",
        in_progress: "Đang thực hiện",
        completed: "Đã hoàn thành",
        cancelled: "Đã hủy",
    };

    return labels[status.toLowerCase()] ?? status;
}
