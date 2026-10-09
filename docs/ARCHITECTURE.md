# ARCHITECTURE — Kiến trúc ứng dụng

## Tổng thể

```mermaid
flowchart LR
    User[Browser/mobile] --> Next[Next.js frontend]
    Next -->|same-origin /api| Express[Express API]
    Express --> Services[Domain services + validation]
    Services --> DB[(MySQL 8)]
    Services --> Gmail[Gmail API / OAuth2]
    GitHub[GitHub Actions] -.-> Next
    GitHub -.-> Express
```

Frontend triển khai trên **Vercel**, backend trên **Railway**. Trình duyệt gọi endpoint cùng origin `/api/...`; Next.js rewrite request sang origin cấu hình bởi `NEXT_PUBLIC_API_BASE_URL`. Express cung cấp `GET /health` cùng các namespace `/api/{users,appointments,services,staffs,branches,offers,site-content}`.

## Phân tầng & đường dẫn source

| Lớp | Source | Trách nhiệm |
|---|---|---|
| UI/routes | `frontend/src/app`, `frontend/src/components` | Next App Router, forms, interactive state |
| Client API/session | `frontend/src/lib/api.ts`, `frontend/src/lib/auth.ts` | typed responses, JWT in-memory, refresh |
| UI security | `frontend/src/proxy.ts`, `frontend/next.config.ts` | CSP nonce, headers, same-origin rewrite |
| HTTP entry | `src/app.ts`, `src/server.ts` | security headers, CORS, JSON body, DB init, migrations guard |
| Middleware | `src/common/middleware` | authentication, RBAC, origin, limits, audit |
| Domain boundary | `src/modules/{domain}` | `.routes`, `.controller`, `.dto`, `.service`, `.entity` |
| Persistence | `src/config/database.ts`, `src/migrations` | MySQL datasource, entities, migrations/seed |
| Jobs | `src/jobs/retention-cleanup.ts` | xóa records security hết hạn theo policy |

Modules: `users` (auth, OTP, Gmail), `appointments` (availability/booking/trạng thái), `branches`, `services`, `staffs`, `offers`, `site-content`, `audit`.

## Luồng tạo booking

```mermaid
sequenceDiagram
    participant C as Customer
    participant N as Next BookingForm
    participant A as Express API
    participant D as MySQL
    participant M as Gmail
    C->>N: Chọn chi nhánh/dịch vụ/số khách/ngày
    N->>A: GET /api/appointments/availability
    A->>D: Đọc active appointments + staff
    A-->>N: Slots đủ nhân viên trống
    C->>N: Chọn giờ rồi xác nhận
    N->>A: POST /api/appointments
    A->>D: Transaction: lock owner, reserve staff slots
    A->>D: Save appointments + service snapshots
    D-->>A: COMMIT
    A-->>N: 201 appointment
    A-->>M: Gửi email ADMIN bất đồng bộ, best-effort
    N-->>C: Booking code + pending status
```

API luôn **kiểm tra lại availability khi ghi** vì danh sách khung giờ có thể cũ ngay sau khi đọc. Không có buffer trước/sau lịch. Một booking nhóm tạo một appointment trên mỗi nhân viên tự gán.

## Luồng đăng nhập

```mermaid
flowchart TD
    Login[POST /api/users/login] --> P{Email/password hợp lệ?}
    P -->|Không| Fail[401/429]
    P -->|Có| Role{CUSTOMER/ADMIN và trình duyệt trusted?}
    Role -->|Chưa trusted| OTP[202 challenge + email OTP]
    OTP --> Verify[POST /login/mfa/verify]
    Verify --> Session[JWT + refresh session + per-account trust cookie]
    Role -->|Trusted| Direct[JWT + refresh session]
    Session --> Browser[Authenticated app]
    Direct --> Browser
    Browser --> Refresh[POST /session/refresh rotation]
```

`staff` không dùng nhánh OTP cho admin/customer trong `loginUser`. Trusted browser cookie được phân chia theo tài khoản; logout chỉ thu hồi refresh session, không có chức năng xóa toàn bộ trust trên cùng máy.

## Database và thời gian

- TypeORM entities quản lý users/staffs/branches/services/offers/site content/booking/auth/audit.
- Booking slots có khóa ghép `(staff_id, slot_start)`; DB đảm bảo không thể giữ cùng slot cho hai transaction.
- Lịch giữ snapshot (customer/staff/branch và appointment services) để bảo toàn thông tin giao dịch.
- `start_time`/`end_time` được lưu và truyền theo UTC, quy tắc nghiệp vụ và hiển thị dùng `Asia/Ho_Chi_Minh`.
- Thống kê `/api/appointments/admin/today-summary` tính theo ngày Việt Nam riêng, không phụ thuộc pagination/filter admin.

## Phạm vi hệ thống hiện tại

Không thấy trong source: thanh toán online, quản lý ca làm việc nhân viên theo lịch riêng, hàng đợi email retry bền vững, realtime websocket, hoặc endpoint khách hàng tự hủy lịch. Chi tiết xem [BOOKING](BOOKING.md), [AUTH](AUTH-SECURITY.md), [DATABASE](DATABASE.md).
