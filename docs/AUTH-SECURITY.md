# AUTH-SECURITY — Xác thực, session và hardening

Source: `src/modules/users`, `src/common/middleware`, `frontend/src/lib/auth.ts`, `frontend/src/proxy.ts`.

## Roles & authorization

`users.role`: `admin`, `staff`, `customer`. Server tin `req.user.id/role` đã xác thực bằng JWT, **không tin role do browser tự gửi**.

- CUSTOMER: đọc dịch vụ công khai, xem availability, tự đặt lịch, chỉ xem lịch của mình; không PUT/DELETE appointments.
- STAFF: xem lịch được phân công; được chuyển lịch sang `in_progress` hoặc `completed` theo guard, không đổi staff/service/time.
- ADMIN: quản trị chi nhánh, staff, service, offer, lịch; có thể đặt lịch cá nhân qua flow public nhưng không được chỉ định nhân viên tại endpoint tạo lịch.
- GET `/api/site-content`, `/api/services`, `/api/branches`, `/api/offers` (current) là public với rate limits.

Mỗi route protected dùng `authenticate` + `requireRole`; service còn enforce quyền truy cập theo ID (khách xem lịch mình, staff lịch được giao).

## Đăng ký và đăng nhập

- Đăng ký: `POST /api/users/register/code` gửi OTP tới email; `POST /api/users/register` xác minh code và tạo customer.
- Login: `POST /api/users/login` kiểm tra email/password bằng service. Với CUSTOMER/ADMIN không trusted, trả HTTP **202** với `mfa_required`, `challenge_id`, `masked_email`, `expires_at`.
- OTP email gồm 6 chữ số, hiệu lực **5 phút**, tối đa **5 lần thử**, một lần sử dụng.
- Xác minh: `POST /api/users/login/mfa/verify` → session mới, access token và cookies.
- Login trên **trusted browser** đúng user + token_version + role + User-Agent hash + hạn dùng → bypass OTP, vẫn cần password.
- STAFF không nằm trong nhánh OTP đó theo code `loginUser`.

Mã OTP được sinh và xác minh ở backend, không hard-code trong ứng dụng. Các bài test tự động sử dụng dữ liệu kiểm thử thay vì thông tin tài khoản production.

## Access JWT & refresh

- Access token: JWT `HS256`, `iss=nail-salon-api`, `aud=nail-salon-web`, `type=access`, `role`, `ver=token_version`, subject user ID; hạn token từ `JWT_EXPIRES_IN_SECONDS` (300–900).
- Frontend giữ access JWT và current user **trong bộ nhớ**, không đưa vào localStorage.
- Refresh token: opaque secret với session UUID, lưu **hash SHA-256** trong `refresh_sessions`.
- Cookie refresh production: `__Secure-ns_refresh`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/users/session`; local là `ns_refresh`.
- `remember_me=true` tạo persistent refresh cookie (`Max-Age`/`Expires`); `false` là session cookie.
- POST `/session/refresh` rotate token; server detect reuse, revoke family (sau điều kiện xử lý gần đồng thời). Frontend retry một lần khi gặp `REFRESH_RACE`.
- Logout thu hồi refresh session hiện tại và xóa cookie; không xóa toàn bộ trusted browser cookies.

## Trusted browser — riêng từng tài khoản

- Cookie base production: `__Secure-ns_login_trust`, local: `ns_login_trust`, `Path=/api/users/login`, HttpOnly/Secure trên production.
- **Tên cookie tách theo user**, thêm suffix SHA-256 của user ID (32 hex chars). Không lưu user ID gốc trong cookie key.
- Proof random 256 bit; database chỉ lưu hash trong `trusted_login_devices`.
- Khi verify OTP mới, chỉ revoke proof trước đó **thuộc cùng user**, không ảnh hưởng tài khoản khác.
- Code có legacy shared-cookie fallback để cookie cũ còn hợp lệ tiếp tục được xác minh bởi server.
- Đổi mật khẩu/reset password/khóa phiên nhạy cảm có thể revoke trust theo user. Nếu trình duyệt đổi User-Agent, cookie hết hạn hoặc bị revoke, lần login tiếp theo cần OTP.
- Luồng kiểm thử bắt buộc: A OTP → logout → B OTP → logout → A không OTP → B không OTP.

## Các biện pháp khác

- Endpoint refresh/logout yêu cầu `Origin` đúng **chính xác** `CORS_ORIGIN` (`requireTrustedOrigin`). Browser dùng same-origin `/api`.
- `cors` chỉ cho origin cấu hình và `credentials: true`.
- `express.json` giới hạn body **32 KB**.
- Headers Express: X-Request-Id, nosniff, Referrer-Policy, Permissions-Policy, CSP deny-all cho API, HSTS trên production.
- Next `frontend/src/proxy.ts`: nonce CSP riêng mỗi HTML request, hạn chế script injections; `layout.tsx` dùng `connection()` để tránh static-render CSP nonce sai.
- Rate limits: login 5/15 phút, registration 5/giờ, MFA 10/15 phút, password recovery 5/15 phút, booking 5/15 phút theo user, availability 30/phút theo user, authenticated/public read 120/phút, refresh 60/5 phút. Ngoài middleware còn giới hạn login theo audit/account/IP.
- Audit log: login failures, MFA, security events; thành công với POST/PUT/DELETE có audit mutation best-effort. Lưu identifier/IP/UA dạng hash khi sử dụng trong security context.
- Password lưu `password_hash` (bcryptjs trong users service); token_version phục vụ thu hồi JWT cũ.

## Cấu hình Gmail

Gửi mail qua Gmail OAuth2: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_FROM_EMAIL`. Cấu hình thiếu → không tự bỏ qua OTP. Cần kiểm tra quyền gửi của refresh token, hạn quyền và quotas. Không đưa giá trị biến thật vào `.env.example`.

## Các điều cần kiểm tra khi troubleshooting

| Hiện tượng | Kiểm tra |
|---|---|
| OTP xuất hiện mỗi lần đổi A/B | Cookie per-account, `Path`, Origin/proxy, User-Agent hash, token_version, expiry |
| Login đúng password nhưng 202 | Bình thường nếu thiết bị chưa được trust |
| Refresh 401 | Cookie/expiry, revoke, reuse/family |
| Refresh 403 | `Origin` không khớp `CORS_ORIGIN` |
| 429 | Rate limiter / audit thresholds |
| API 403 | Role server-side, không sửa bằng UI bypass |
| Gmail 503 | OAuth config/quyền gửi, log server |

Các giá trị credentials, token, cookie, Gmail OAuth secrets, JWT secret và log chứa dữ liệu cá nhân được phân loại là thông tin nhạy cảm, không lưu trong repository.
