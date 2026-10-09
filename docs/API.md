# API — HTTP contract, RBAC và ví dụ

API được khai báo trong `src/app.ts` và các module `.routes.ts`, `.dto.ts`, `.controller.ts` tại `src/modules/`. Các endpoint nghiệp vụ dùng tiền tố `/api`. Phản hồi lỗi JSON có dạng `{ "error": { "code": "...", "message": "..." } }`.

## Image upload and image management

The admin media library uses a private Cloudflare R2 bucket. `POST /api/media` accepts raw JPEG/PNG/WebP bytes (up to 5 MiB) with the appropriate `Content-Type` header and requires ADMIN JWT. `GET /api/media` lists image metadata, `DELETE /api/media/:id` removes an unreferenced image, and public `GET /api/media/:id/file` serves the image via a signed R2 request. Admin-only `GET/POST/PUT/DELETE /api/site-content/admin/trends` manages Hot Trend images by using media URLs returned from the library. See [MEDIA-STORAGE](MEDIA-STORAGE.md).

## Transport

- Request protected: `Authorization: Bearer <access_token>`; login/session sử dụng cookies.
- Khi có JSON body: `Content-Type: application/json`.
- Thành công điển hình: `{ "success": { "message": "...", "data": ... } }`.
- Các endpoint danh sách phân trang trả bên trong `success.data` có mảng + `total`, `page`, `limit`, `total_pages`.
- Lỗi validation là 400, không đăng nhập 401, không đủ quyền 403, không tìm thấy 404, conflict/quy tắc trạng thái 409, rate limit 429, email unavailable 503.
- Browser frontend dùng `/api` same-origin rewrite của Next; không cần nhúng trực tiếp domain backend vào client requests.
- `GET /health` (public) → `{ "status": "ok" }` nằm **ngoài** `/api`.

## RBAC

`Public` = chưa cần Bearer. `Auth` = ADMIN, STAFF hoặc CUSTOMER đã authenticate. `Admin` = role admin. `Staff` = role staff. `Customer/Admin` chỉ các role đó.

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| POST | `/api/users/register/code` | Public | Gửi OTP xác thực email |
| POST | `/api/users/register` | Public | Đăng ký sau OTP |
| POST | `/api/users/login` | Public | Thành công 200, hoặc 202 nếu cần OTP |
| POST | `/api/users/login/mfa/verify` | Public | Xác minh OTP đăng nhập |
| POST | `/api/users/session/refresh` | Public + trusted Origin | Cookie refresh → access JWT mới |
| POST | `/api/users/session/logout` | Public + trusted Origin | Thu hồi refresh hiện tại |
| POST | `/api/users/password/forgot` | Public | Yêu cầu mã reset |
| POST | `/api/users/password/reset` | Public | Reset bằng mã |
| POST | `/api/users/password/change/code` | Auth | Gửi OTP đổi mật khẩu |
| POST | `/api/users/password/change` | Auth | Đổi mật khẩu, thu hồi phiên |
| GET | `/api/users/me` | Auth | User hiện tại |
| DELETE | `/api/users/me` | Auth | Xóa tài khoản hiện tại |
| GET | `/api/users/admin-test` | Admin | Kiểm thử quyền admin |
| GET | `/api/branches` | Public | Danh sách phân trang |
| GET | `/api/branches/admin` | Admin | Danh sách cho dashboard |
| GET | `/api/branches/:id` | Public | Chi tiết cơ sở |
| POST / PUT / DELETE | `/api/branches` / `/api/branches/:id` | Admin | Quản lý chi nhánh |
| GET | `/api/services` | Public | Danh mục, `branch_id` optional |
| GET | `/api/services/admin` | Admin | Danh mục đầy đủ |
| GET | `/api/services/:id` | Public | Chi tiết dịch vụ |
| POST / PUT / DELETE | `/api/services` / `/api/services/:id` | Admin | CRUD dịch vụ |
| GET | `/api/staffs` và `/api/staffs/admin` | Admin | Danh sách nhân viên |
| GET | `/api/staffs/me` | Staff | Hồ sơ nhân viên hiện tại |
| GET | `/api/staffs/:id` | Admin | Chi tiết nhân viên |
| POST / PUT / DELETE | `/api/staffs` / `/api/staffs/:id` | Admin | CRUD nhân viên |
| GET | `/api/appointments` | Auth | Phân trang, scope/role filters |
| GET | `/api/appointments/availability` | Customer/Admin | Slot trống theo ngày/dịch vụ/số người |
| GET | `/api/appointments/admin/today-summary` | Admin | Thống kê ngày Việt Nam |
| POST | `/api/appointments` | Customer/Admin | Đặt lịch cho chính account |
| GET | `/api/appointments/:id` | Auth | Customer chỉ mình, staff chỉ lịch được giao |
| PUT | `/api/appointments/:id` | Staff/Admin | Cập nhật chi tiết/trạng thái theo policy |
| DELETE | `/api/appointments/:id` | Admin | Xóa lịch, giải phóng slot |
| GET | `/api/offers` | Public | Ưu đãi đang hiện hành |
| GET | `/api/offers/admin` | Admin | Tất cả ưu đãi phân trang |
| GET | `/api/offers/:id` | Admin | Chi tiết |
| POST / PUT / DELETE | `/api/offers` / `/api/offers/:id` | Admin | CRUD ưu đãi |
| GET | `/api/site-content?branch_id=1` | Public | Nội dung salon, reviews theo chi nhánh, trend |

**Lưu ý:** `GET /api/appointments` là endpoint chung nhưng được **giới hạn dữ liệu trong service**: CUSTOMER chỉ lịch của mình; STAFF chỉ lịch được giao; ADMIN có thể xem tất cả hoặc thêm `scope=mine`.

## Query danh sách appointments

| Query | Ý nghĩa |
|---|---|
| `page` | Trang >= 1, tối đa 1000, default 1 |
| `limit` | Kích thước trang 1–100, default 5; admin UI dùng 20 |
| `scope=mine` | ADMIN chỉ lấy lịch của chính mình; CUSTOMER vốn đã bị giới hạn |
| `branch_id` | Số nguyên chi nhánh |
| `staff_id` | UUID nhân viên |
| `status` | `pending`, `confirmed`, `in_progress`, `completed`, `cancelled` |
| `from` | UTC/offset ISO datetime, lấy `start_time >= from` |
| `to` | UTC/offset ISO datetime, lấy `start_time < to` (**exclusive**) |
| `booking_code` | ADMIN-only, 1–8 ký tự hexadecimal, case-insensitive, tiền tố `booking_group_id`; fallback `id` với lịch cũ không có group |

Admin UI `Từ ngày`–`Đến ngày` chuyển ngày theo múi giờ Việt Nam sang khoảng UTC, đặt `to` bằng **00:00 ngày tiếp theo** để bao trọn ngày kết thúc. `booking_code` tìm ở DB trước pagination. Có thể kết hợp branch/status/date/code.

Ví dụ (minh họa, thay Bearer token):

```http
GET /api/appointments?booking_code=9DCB7830&from=2026-10-08T17%3A00%3A00.000Z&to=2026-10-10T17%3A00%3A00.000Z&page=1&limit=20
Authorization: Bearer <access_token>
```

## Availability

```http
GET /api/appointments/availability?service_ids=<uuid1>,<uuid2>&date=2026-10-09T00%3A00%3A00%2B07%3A00&party_size=2
Authorization: Bearer <access_token>
```

`date` phải đại diện 00:00 theo `Asia/Ho_Chi_Minh`; service IDs phải cùng branch và bookable. Dữ liệu trả về (các slot là ISO timestamp):

```json
{
  "success": {
    "data": {
      "branch_id": 1,
      "duration_minutes": 60,
      "party_size": 2,
      "max_party_size": 3,
      "slots": ["2026-10-09T03:00:00.000Z"]
    }
  }
}
```

Con số và slot ở ví dụ là **minh họa**, không phải cam kết availability thực tế.

## Tạo booking

```http
POST /api/appointments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "service_ids": ["<service_uuid>"],
  "start_time": "2026-10-12T03:00:00.000Z",
  "party_size": 1,
  "customer_phone": "0912345678"
}
```

**Không cho truyền** `staff_id`, `user_id` hoặc `customer_email` trong public booking; backend tự gán staff và snapshot customer. Status mới `pending`, response HTTP 201 chứa **appointment đầu tiên** và `booking_group_id`. Mã khách nhìn thấy là 8 ký tự đầu của group ID, uppercase. Booking nhóm tạo `party_size` appointments chung ID nhóm.

## Đổi trạng thái (admin/staff)

```http
PUT /api/appointments/<appointment_uuid>
Authorization: Bearer <access_token>
Content-Type: application/json

{ "status": "in_progress" }
```

Chỉ được đi theo chuỗi `pending → confirmed → in_progress → completed` hoặc `cancelled` từ trạng thái chưa kết thúc; `confirmed → in_progress` phải đến thời gian bắt đầu. DTO cấm gửi `status` chung với thay đổi detail. STAFF chỉ có quyền chuyển `in_progress`/`completed` trên lịch được giao; ADMIN có thể đổi theo policy. Cần xem [BOOKING](BOOKING.md) cho guard cụ thể.

## Ví dụ đăng nhập OTP

1. `POST /api/users/login` body `{"email":"<email>","password":"<password>","remember_me":true}`.
2. Nếu cần OTP, server trả **202** kèm `challenge_id`, `masked_email`, `expires_at`.
3. `POST /api/users/login/mfa/verify` body `{"challenge_id":"<uuid>","code":"<6 digits>"}`.
4. Kết quả thành công trả `access_token`, `user`, và Set-Cookie refresh/trusted proof phù hợp.
5. Browser gọi `POST /api/users/session/refresh` khi cần, kèm cookie và trusted Origin.

Chi tiết chính xác về auth và cookie xem [AUTH-SECURITY](AUTH-SECURITY.md).

## Những mã lỗi hay gặp

| Code | Ý nghĩa |
|---|---|
| `SLOT_UNAVAILABLE` | Không đủ staff/slot rảnh khi ghi |
| `APPOINTMENT_CONFLICT` | Trùng lịch staff |
| `CUSTOMER_APPOINTMENT_CONFLICT` | Lịch của khách bị trùng (theo policy hiện hành khi phát sinh) |
| `TOO_MANY_PENDING_APPOINTMENTS` | Tối đa 3 nhóm booking `pending` |
| `INVALID_APPOINTMENT_TIME` | Không nằm trên mốc 15 phút |
| `OUTSIDE_BUSINESS_HOURS` | Ngoài khung 09:00–20:30 theo rule code |
| `INVALID_STATUS_TRANSITION` | Chuyển trạng thái không hợp lệ |
| `APPOINTMENT_NOT_STARTED_YET` | Chưa tới giờ bắt đầu để chuyển `in_progress`/`completed` |
| `INVALID_MFA_CODE` | Mã OTP login sai/hết hạn |
| `REFRESH_TOKEN_REUSE` | Dùng lại refresh token đã rotate |
| `UNTRUSTED_ORIGIN` | Origin không khớp cấu hình |
| `VALIDATION_ERROR` | Tham số/body không hợp lệ |

Mã `error.code` phân biệt các nguyên nhân có cùng HTTP status, ví dụ 409 có thể đại diện cho trùng slot hoặc chuyển trạng thái lịch quá sớm. UI có thể ánh xạ mã lỗi thành thông báo theo ngữ cảnh.
