# TESTING-OPERATIONS — Kiểm thử & vận hành

Đối tượng: người phát triển và admin vận hành. Phân biệt **CI unit/build** với **manual E2E ở môi trường thật**; không báo “đã test thực tế” khi chỉ chạy CI.

## Test commands

### Backend, từ repository root

```bash
npm ci
npm run typecheck
npx tsx --test src/tests/trusted-login-device.test.ts
npx tsx --test src/tests/booking-notification.test.ts
npx tsx --test src/tests/admin-appointment-filters.test.ts
npm run build
npm audit --audit-level=high
```

### MySQL 8 booking concurrency integration (database tạm)

CI job `backend-mysql-integration` khởi động **MySQL 8 thật trong GitHub Actions**, apply **toàn bộ production TypeORM migrations**, sau đó chạy:

```bash
npm run test:booking:integration
```

Test chạy 4 kịch bản, bao gồm **16 khách đồng thời** đặt cùng một staff/slot; **16 booking nhóm** tranh hai nhân viên; **rollback** phần reservation đã ghi khi đặt nhóm thất bại; và hai ca nằm sát nhau không cần buffer. Assertions kiểm tra số bản ghi `appointments`, `staff_booking_slots`, mã lỗi `SLOT_UNAVAILABLE` và tính nhất quán của `booking_group_id`.

Để chạy local, chỉ dùng **MySQL local + DB chuyên biệt** tên kết thúc `_integration_test` (script từ chối DB host không phải `localhost`/`127.0.0.1`). Chạy migrations trước:

```bash
# Đặt NODE_ENV=development, DB_SYNCHRONIZE=false, DB_HOST=127.0.0.1,
# DB_NAME=nail_salon_integration_test, DB_USER/DB_PASSWORD và JWT_SECRET qua env local
npm run build
npm run migration:run
# Bật explicit opt-in RUN_BOOKING_INTEGRATION_TESTS=1
npm run test:booking:integration
```

Các test này không tạo/đọc bookings production. Tuy nhiên chúng là **integration tests**, không phải test qua HTTP/JWT hoặc stress benchmark p95. Đừng tuyên bố load-test throughput khi chưa đo.

### Frontend, từ `frontend`

```bash
npm ci
npx tsc --noEmit
npm run lint
npm run build
node scripts/check-csp.mjs
node scripts/audit-ci.mjs
```

### VPS deployment config

```bash
cp .env.production.example .env.production
docker compose --env-file .env.production -f compose.production.yml config --quiet
bash -n deploy/vps/backup.sh
```

Mô tả job CI thực tế ở `.github/workflows/security-hardening-ci.yml`. `npm run lint` là command hữu ích local, nhưng workflow hiện tập trung tsc/build/CSP/audit, không có lint step riêng.

## Bộ test thủ công cần chạy trước release quan trọng

### Auth / security

- Đăng ký email mới → OTP → tạo CUSTOMER; mã sai/hết hạn, resend/rate limits.
- Đăng nhập CUSTOMER trên browser mới → OTP; logout và login lại cùng account/browser không OTP khi trust còn hạn.
- A OTP → logout → B OTP → logout → A không OTP → B không OTP (cả admin/customer khi applicable).
- Admin login OTP, refresh/reload trang admin, logout.
- Password change/reset revokes relevant sessions; API role check 401/403; Origin check cho refresh/logout.
- Không in token/OTP ra browser logs, không đưa JWT vào localStorage.

### Booking / availability

- GET availability cho đúng branch/services/party size.
- Mốc giờ 15 phút, giờ 09:00–20:30, tối thiểu 3 giờ và tối đa 14 ngày.
- Đặt 1 khách và nhóm 2 khách; hệ thống **không cho chọn staff**; group có chung ID.
- Hai giao dịch cùng staff slot: không double-book; một giao dịch phải thất bại hoặc chọn staff khác.
- Giờ liền kề không có buffer, test 09:00–09:15 và 09:15–09:30.
- Tối đa 3 pending group per user.
- Booking success hiển thị mã 8 ký tự; email ADMIN mang cùng group UUID.
- Admin tra cứu mã đó bằng search (case-insensitive), date range, status/branch và phân trang.
- `confirmed → in_progress` trước start trả 409 `APPOINTMENT_NOT_STARTED_YET`; sau start được chuyển.
- `in_progress → completed`, `cancelled` releases slots; tránh test xóa lịch thật.

### Frontend

- Mobile 320/375/430 px và desktop: booking modal, nút X, bảng admin ngang, filters, calendar.
- Empty/loading/network failure states, keyboard Escape/close/modal focus, aria labels.
- Không có lỗi CSP, hydration, content overflow.
- Sau deploy frontend và backend mới, test `/api` rewrite qua domain chính.

## Monitoring / troubleshooting

| Dấu hiệu | Check chính |
|---|---|
| 502/503 hoặc health fail | Railway runtime/start logs, connection DB, migration guard |
| `SLOT_UNAVAILABLE` | staff count, pending/confirmed/in_progress overlaps, slot primary key, race |
| Chọn giờ xong POST 409 | availability có thể stale: GET mới rồi chọn lại |
| OTP bị hỏi liên tục | Cookie trust per-account, browser UA, expiry, Secure/Origin, token_version |
| `REFRESH_TOKEN_REUSE` | token rotation/reused session; yêu cầu đăng nhập lại |
| 403 `UNTRUSTED_ORIGIN` | CORS_ORIGIN và HTTPS domain/rewrites |
| Gmail 503 hoặc admin thiếu mail | Gmail OAuth config/scope/quota, admin email, deployment logs |
| Search mã không thấy | Đối chiếu 8 ký tự group ID, role ADMIN, filter ngày/branch/status |
| `APPOINTMENT_NOT_STARTED_YET` | Chưa đến start theo giờ VN; **không phải trùng DB** |
| Admin báo lỗi 409 chung | Dựa vào `error.code` response và logs để xác định, không suy đoán |
| CI PASS nhưng site cũ | Deploy SHA/alias Vercel hoặc Railway không theo main |

**Theo dõi API request:** `src/app.ts` gắn `X-Request-Id`, error 500 trả `request_id`. Khi báo lỗi, thu thập timestamp, request ID, endpoint, HTTP status và error code, nhưng **không** thu thập Bearer/cookies/password/OTP hoặc full PII.

## Backup, retention, disaster recovery

- Trước migration hoặc cutover: backup nhất quán MySQL, thử restore vào DB tạm, so row counts và important tables; lưu encrypted offsite.
- `src/jobs/retention-cleanup.ts` script dọn audit/security data đã hết hạn theo 90/7/30 ngày. VPS Compose chạy service retention mỗi 24h.
- Trên Railway, cần **xác minh scheduler/cron thực sự được bật** thay vì giả định script luôn chạy.
- Backup/restore không được tạo two active writers hoặc phục hồi trạng thái mất booking.
- Có kế hoạch phục hồi DB secrets, user access và kiểm thử booking sau disaster recovery.

## Observability và hạn chế đã biết

- Email admin là fire-and-forget sau commit, **chưa có durable retry/outbox**. Vì vậy không xác nhận “chắc chắn đã gửi email” chỉ từ HTTP 201.
- Không có E2E Playwright/Cypress trong source được liệt kê; bộ test `src/tests` hiện tập trung regression logic (trusted-login, notification format, admin filters).
- UI lịch cá nhân hiện fetch page=1 limit=100; khi dữ liệu tăng cần review pagination.
- Không có scheduler retention Railway được định nghĩa trong source; không suy diễn đã hoạt động.

Xem [DEPLOYMENT](DEPLOYMENT.md), [AUTH-SECURITY](AUTH-SECURITY.md), [BOOKING](BOOKING.md).
