# Tài liệu kỹ thuật Serpente Nail Room

Tài liệu về kiến trúc, API, dữ liệu, bảo mật, vận hành và các quyết định thiết kế của hệ thống đặt lịch Serpente Nail Room.

| Tài liệu | Nội dung |
|---|---|
| [PORTFOLIO.md](PORTFOLIO.md) | Phân tích thiết kế kỹ thuật, concurrency và trade-offs |
| [DEMO.md](DEMO.md) | Tổng quan sản phẩm, các trang demo và luồng người dùng |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Kiến trúc, sơ đồ luồng, ranh giới trách nhiệm |
| [SETUP.md](SETUP.md) | Chạy local, môi trường, Gmail, migration |
| [MEDIA-STORAGE.md](MEDIA-STORAGE.md) | MySQL image BLOB storage, admin image upload/management and rollout |
| [API.md](API.md) | Danh sách endpoint, phân quyền, request/response, lỗi |
| [DATABASE.md](DATABASE.md) | Entities, quan hệ, index, migration, dữ liệu snapshot |
| [BOOKING.md](BOOKING.md) | Availability, slot 15 phút, nhóm, trạng thái, notification |
| [AUTH-SECURITY.md](AUTH-SECURITY.md) | OTP, JWT/refresh, trusted browser, audit, bảo mật |
| [FRONTEND.md](FRONTEND.md) | Pages, components, admin/booking UX và proxy |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Railway + Vercel, VPS alternative, kiểm tra/rollback |
| [TESTING-OPERATIONS.md](TESTING-OPERATIONS.md) | CI, E2E test cases, troubleshooting, vận hành |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Quy trình thay đổi source/docs/PR |

## Điều hướng theo vai trò

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

## Versioning

Tài liệu được duy trì cùng source code. Hợp đồng API, migration và logic nghiệp vụ trong repository là căn cứ khi triển khai hoặc thay đổi hệ thống. Các thay đổi chức năng cần cập nhật tài liệu liên quan trong cùng pull request.
