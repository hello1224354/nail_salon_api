# FRONTEND — Pages, components và data flow

Frontend: `frontend/`, Next.js 16 App Router, React 19, TypeScript, Tailwind 4. Đây là **một ứng dụng** với trang công khai, tài khoản cá nhân và admin, không phải SPA/admin repo tách riêng.

## Danh sách URL

| Route | Thành phần/nhiệm vụ |
|---|---|
| `/` | Trang chủ; giới thiệu, sản phẩm ảnh, offers, reviews/trends |
| `/services` | Danh mục/bảng giá theo chi nhánh |
| `/book` | BookingForm: chọn dịch vụ, người, ngày, slot, điện thoại và xác nhận |
| `/appointments` | MyAppointments: lịch của tôi, filter status |
| `/login` | Customer LoginForm và OTP email khi cần |
| `/register` | RegisterForm và email verification |
| `/forgot-password` | Reset mật khẩu bằng OTP |
| `/account/security` | Đổi mật khẩu/OTP cho tài khoản |
| `/admin/login` | Login dành admin, OTP nếu cần |
| `/admin` | AdminDashboard — overview và quản trị records |
| `/admin/security` | Bảo mật tài khoản admin |

`app/error.tsx`, `loading.tsx`, `not-found.tsx`, `manifest.ts` quản lý fallback và metadata/PWA manifest.

## Layout và design system

- `app/layout.tsx`: metadata SEO, Header, Footer, BranchProvider, RouteMotion.
- `app/globals.css`: design tokens và hiệu ứng chung; `app/book/book.css` cho booking.
- Ảnh trong `public/nails`, logo trong `public/brand`; Next Image cho assets ở những nơi hỗ trợ.
- `BranchProvider`: branch context chung cho các trang public.
- CSP nonce từ `frontend/src/proxy.ts`; không chèn third-party scripts tùy tiện ngoài policy.
- Responsive styling bằng Tailwind; modal booking thành công dùng close icon SVG đối xứng/centered và có nút xem lịch.

## Booking UI

`components/booking/BookingForm.tsx`:

1. Yêu cầu khôi phục session (`restoreSession`) và role cho phép.
2. GET branches/services; khách chọn một branch, các service thuộc branch.
3. Điều chỉnh `partySize`, ngày, GET `/appointments/availability` để thấy **giờ còn đủ nhân viên**.
4. Khách chỉ chọn **slot**, không có dropdown chọn nhân viên.
5. POST `/api/appointments` với `service_ids`, `start_time`, `party_size`, `customer_phone`.
6. Thành công hiển thị modal thông tin (branch/time/service/party/tổng dự kiến), trạng thái chờ xác nhận, mã 8 ký tự viết hoa, nút điều hướng lịch tôi.
7. Khi `SLOT_UNAVAILABLE`, người dùng cần refresh availability và chọn slot khác.

UI có thể render giờ dựa trên ISO UTC bằng timezone Việt Nam; **không lấy local timezone browser mặc định** thay giờ kinh doanh.

## Lịch cá nhân

`components/appointments/MyAppointments.tsx` tải user + GET `/api/appointments?scope=mine&page=1&limit=100`, filter theo trạng thái. Trang lịch cá nhân hiện chỉ tải tối đa 100 lịch trong một request. Backend hỗ trợ phân trang, nhưng UI chưa cung cấp khả năng duyệt các trang tiếp theo khi số lịch vượt giới hạn này.

## AdminDashboard

`components/admin/AdminDashboard.tsx` có tab:

- Tổng quan: stats theo ngày từ `/api/appointments/admin/today-summary`.
- Lịch hẹn: bảng lịch, chi nhánh, trạng thái, thao tác sửa/xóa, chuyển trạng thái; pagination **20 rows/page**.
- Dịch vụ, Nhân viên, Chi nhánh, Ưu đãi: danh mục/CRUD.

**Filters bảng Lịch hẹn hiện tại:**

- `Từ ngày` và `Đến ngày`: ngày theo giờ Việt Nam, end inclusive được chuyển sang `to` exclusive.
- Tìm kiếm theo **mã booking 8 ký tự** khách thấy trong confirmation (`booking_code`); cả giá trị 1–8 hex dạng prefix đều được API nhận.
- Chi nhánh và trạng thái; có nút xóa tất cả filters.
- Hiển thị mã 8 ký tự ngay dưới giờ hẹn và tổng số records khớp.
- Lọc/tìm kiếm dùng API query server-side, không chỉ lọc 20 rows đã tải.

UI phản ánh các chuyển trạng thái được hỗ trợ; **backend thực thi** các điều kiện thời gian và phân quyền. Ví dụ, lịch `confirmed` không thể thành `in_progress` trước giờ hẹn. Một số lỗi HTTP 409 vẫn dùng thông báo chung ở frontend thay vì thông điệp theo `error.code`.

## API client / state

- `src/lib/api.ts`: typed interfaces, `apiRequest<T>`, Bearer access token, `credentials: include`, refresh khi 401, mapping error code.
- `src/lib/auth.ts`: access token/user chỉ ở module memory; tự restore bằng refresh endpoint, single-flight refresh promise, logout invalidates local state.
- `src/lib/studio-data.ts` và `public-data.ts`: formatter/display helpers; không thay thế nguồn dữ liệu DB cho booking.
- Client browser gọi `/api/...`; server-side calls có base URL. Cấu hình `NEXT_PUBLIC_API_BASE_URL` để Next rewrite tới backend origin.

## Các điểm mở rộng

Frontend dùng các kiểu dữ liệu API tập trung trong `frontend/src/lib/api.ts`, state xác thực trong `frontend/src/lib/auth.ts` và các React components trong `frontend/src/components`. Các luồng cần truy cập backend phải đi qua typed API client và chịu kiểm tra phân quyền tại server.

Quy trình review, kiểm thử giao diện và cập nhật tài liệu khi bổ sung tính năng mới được mô tả trong [CONTRIBUTING](CONTRIBUTING.md).
