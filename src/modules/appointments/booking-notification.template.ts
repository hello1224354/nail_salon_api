export interface NewBookingEmailData {
    bookingGroupId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    branchName: string;
    branchAddress: string;
    startTime: Date;
    endTime: Date;
    partySize: number;
    staffNames: string[];
    services: Array<{ name: string; price: number; durationMinutes: number }>;
}

function formatVietnamDateTime(value: Date): string {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(value);

    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)?.value ?? "";

    return part("day") + "/" + part("month") + "/" + part("year") +
        " " + part("hour") + ":" + part("minute");
}

function formatVnd(value: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
}

export function buildNewBookingEmail(booking: NewBookingEmailData) {
    const perGuestTotal = booking.services.reduce((total, service) => total + service.price, 0);
    const serviceLines = booking.services.map(
        (service, index) => "  " + (index + 1) + ". " + service.name +
            " - " + formatVnd(service.price) +
            " (" + service.durationMinutes + " phút)"
    );

    const subject = "[Serpente] Đặt lịch mới - " + booking.bookingGroupId.slice(0, 8);

    const body = [
        "Có một yêu cầu đặt lịch mới đang chờ xác nhận.",
        "",
        "Mã lượt đặt: " + booking.bookingGroupId,
        "Trạng thái: Chờ xác nhận (PENDING)",
        "",
        "THÔNG TIN KHÁCH HÀNG",
        "Họ tên: " + booking.customerName,
        "Số điện thoại: " + booking.customerPhone,
        "Email: " + (booking.customerEmail ?? "Không có"),
        "Số khách: " + booking.partySize,
        "",
        "CHI TIẾT ĐẶT LỊCH",
        "Chi nhánh: " + booking.branchName,
        "Địa chỉ: " + booking.branchAddress,
        "Bắt đầu: " + formatVietnamDateTime(booking.startTime) + " (giờ Việt Nam)",
        "Kết thúc: " + formatVietnamDateTime(booking.endTime) + " (giờ Việt Nam)",
        "Dịch vụ (cho mỗi khách):",
        ...serviceLines,
        "Đơn giá dịch vụ/khách: " + formatVnd(perGuestTotal),
        "Tạm tính cả nhóm: " + formatVnd(perGuestTotal * booking.partySize),
        "Nhân viên được tự động phân công: " + booking.staffNames.join(", "),
        "",
        "Vui lòng vào trang quản trị để xem và xử lý yêu cầu.",
        "Đây là thông báo đặt lịch mới, không phải xác nhận lịch hẹn.",
    ].join("\n");

    return { subject, body };
}
