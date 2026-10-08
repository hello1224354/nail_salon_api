# Tài liệu kỹ thuật Serpente Nail Room

Đã đối chiếu với source commit `ad110058` (09/10/2026, ICT). Nội dung mô tả **những gì code đang làm**, không tự đưa các kế hoạch chưa triển khai vào đặc tả.

| Tài liệu | Nội dung |
|---|---|
| [PORTFOLIO.md](PORTFOLIO.md) | Recruiter-facing engineering case study and technical trade-offs |
| [SCREENSHOTS.md](SCREENSHOTS.md) | Verified public demo links and privacy-safe screenshot/video plan |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Kiến trúc, sơ đồ luồng, ranh giới trách nhiệm |
| [SETUP.md](SETUP.md) | Chạy local, môi trường, Gmail, migration |
| [API.md](API.md) | Danh sách endpoint, phân quyền, request/response, lỗi |
| [DATABASE.md](DATABASE.md) | Entities, quan hệ, index, migration, dữ liệu snapshot |
| [BOOKING.md](BOOKING.md) | Availability, slot 15 phút, nhóm, trạng thái, notification |
| [AUTH-SECURITY.md](AUTH-SECURITY.md) | OTP, JWT/refresh, trusted browser, audit, bảo mật |
| [FRONTEND.md](FRONTEND.md) | Pages, components, admin/booking UX và proxy |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Railway + Vercel, VPS alternative, kiểm tra/rollback |
| [TESTING-OPERATIONS.md](TESTING-OPERATIONS.md) | CI, E2E test cases, troubleshooting, vận hành |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Quy trình thay đổi source/docs/PR |

## Gợi ý đọc

- **Developer mới:** SETUP → ARCHITECTURE → API.
- **Backend booking:** BOOKING → DATABASE → API.
- **Frontend:** FRONTEND → API → AUTH-SECURITY.
- **Maintainer/DevOps:** DEPLOYMENT → TESTING-OPERATIONS → CONTRIBUTING.

## Thuật ngữ

- `appointment`: một lịch gắn với **một nhân viên**.
- `booking_group_id`: UUID của cả lần đặt; đặt nhóm tạo nhiều `appointment` cùng `booking_group_id`.
- **Mã lịch hẹn:** 8 ký tự đầu (uppercase) của `booking_group_id`, hoặc `appointment.id` khi không có group.
- **Slot:** mốc 15 phút được giữ cho một staff; khóa `(staff_id, slot_start)`.
- **Business timezone:** `Asia/Ho_Chi_Minh`, UTC+07:00.
- **Snapshot:** lưu tên/giá/duration, khách, nhân viên, chi nhánh trên lịch để dữ liệu lịch sử không đổi khi danh mục đổi.
- **Active booking statuses:** `pending`, `confirmed`, `in_progress`.

## Quy ước cập nhật

Nếu tài liệu và code mâu thuẫn, ưu tiên kiểm tra code/migration, sau đó **sửa tài liệu cùng PR**. Không đưa database dumps, secrets, OTP hay thông tin cá nhân thật vào documentation.
