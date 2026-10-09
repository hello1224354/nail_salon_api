# DEPLOYMENT — CI/CD, production, rollback, VPS

Source đối chiếu: `.github/workflows/security-hardening-ci.yml`, `Dockerfile`, `compose.production.yml`, `deploy/vps/README.md`, `frontend/next.config.ts`, `src/server.ts`.

## Môi trường đang sử dụng

| Thành phần | Dịch vụ | URL |
|---|---|---|
| Web Next.js | Vercel: `nail-salon-web-v2` | https://nail-salon-web-v2.vercel.app/ |
| API Express | Railway: `api` | https://api-production-e911.up.railway.app |
| API health | Express | https://api-production-e911.up.railway.app/health |
| Database | MySQL qua biến môi trường backend | Không expose credentials công khai |

Frontend và backend được triển khai riêng trên Vercel và Railway. Healthcheck xác nhận tiến trình API hoạt động; các luồng đặt lịch, OTP và email cần kiểm thử chức năng độc lập.

Frontend Next rewrite `/api/:path*` sang `NEXT_PUBLIC_API_BASE_URL`. Trên Vercel, cấu hình environment cần trỏ đến API Railway thực tế **theo cơ chế dự án đang dùng**, và phải được kiểm tra ở dashboard khi clone project mới.

## GitHub CI

Workflow [Security Hardening CI](../.github/workflows/security-hardening-ci.yml) chạy khi mở PR vào `main`, push lên `main` hoặc kích hoạt thủ công. Pipeline gồm **4 jobs**:

- **backend:** cài dependencies, typecheck, unit/regression tests (trusted device, booking notification, admin filters), build và audit dependencies.
- **backend-mysql-integration:** chạy **MySQL 8 tạm thời** trong GitHub Actions, apply TypeORM migrations và kiểm thử booking concurrency: 16 yêu cầu đồng thời, tính nguyên tử booking nhóm, rollback và giờ đặt liền kề.
- **frontend:** cài dependencies, TypeScript typecheck, Next.js build, CSP check và dependency audit; sử dụng API URL cấu hình riêng trong CI.
- **vps-config:** xác thực Docker Compose production bằng env mẫu và cú pháp backup script.

CI PASS xác nhận kết quả build và các bài kiểm thử của commit. Trạng thái triển khai cần được xác thực riêng qua deployment SHA, healthcheck và kiểm thử các luồng chức năng liên quan.

## Quy trình deploy an toàn

1. Tạo feature branch từ `main` mới nhất; code + regression tests + docs trong cùng PR.
2. Chạy CI/đọc diff trước merge, không merge khi job FAIL.
3. Merge vào `main` khi head còn khớp/không conflict.
4. **Vercel:** kiểm tra project `nail-salon-web-v2` nhận đúng commit SHA và deployment `READY`; xác nhận domain production đã gắn deployment. Chỉ frontend đổi vẫn cần verify website.
5. **Railway:** kiểm tra service `api` nhận đúng commit SHA và deployment `SUCCESS`. Nếu auto-deploy không nhận, kiểm tra GitHub source/branch trong Railway thay vì giả định deploy đã chạy.
6. Kiểm tra logs backend có DB migrations hoàn tất và `Server is running on port: 3000`.
7. Gọi `/health`, xem site live, sau đó test các chức năng thay đổi với test account và test data được phép.
8. Nếu thay đổi schema, làm verified database backup **trước** migration; chuẩn bị rollback tương thích schema.

Backend `src/server.ts` gọi `AppDataSource.showMigrations()` ở production và **fail startup nếu còn pending migration**. TypeORM migrations cần chạy trước khi start, có thể đặt thành Railway pre-deploy step phù hợp service; Dockerfile mặc định chỉ build và start application.

## Config production

- `NODE_ENV=production`, `DB_SYNCHRONIZE=false`, `DB_LOGGING=false`.
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` trỏ đúng DB và quyền tối thiểu.
- `JWT_SECRET` dài/ngẫu nhiên; không tái sử dụng giữa staging/production.
- `CORS_ORIGIN` chính xác website production; Origin check yêu cầu khớp cho refresh/logout.
- `GMAIL_*` đủ bốn biến, Gmail OAuth sender còn hiệu lực.
- R2 private bucket và bucket-scoped token: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (API Railway). Upload media sẽ không hoạt động trước khi cấu hình. Hướng dẫn: [MEDIA-STORAGE](MEDIA-STORAGE.md).
- `NEXT_PUBLIC_API_BASE_URL` cấu hình tại Vercel trước build.
- Cookie production dùng `Secure`, cần HTTPS. Không test login thực qua HTTP.

**Không đăng giá trị env thực, OAuth refresh token, database dump hoặc console cookies vào repo.**

## Rollback

- **Frontend-only:** chọn deployment Vercel trước đó tương thích API, xác nhận domain/health/UI.
- **Backend-only:** rollback phiên bản API tương thích với schema DB hiện tại; **không** rollback Docker image và kỳ vọng migration DB tự đảo ngược.
- **Có migration/ghi dữ liệu mới:** sao lưu, đánh giá backward/forward compatibility và kế hoạch phục hồi; không restore bản backup cũ lên production đang nhận booking mới vì sẽ làm mất các lần đặt.
- Ghi lại SHA source, deployment ID, thời gian cutover, kiểm thử và trạng thái rollback.

## VPS Compose — phương án thay thế, chưa cutover

`compose.production.yml` tổ chức:

```text
db (MySQL internal) -> migrate -> api -> frontend -> caddy :80/:443
                       retention job (mỗi 24h)
```

`deploy/vps/README.md` là runbook cụ thể; `deploy/vps/Caddyfile` terminate HTTPS và reverse-proxy Next, không public MySQL/API port. Để cài mới:

```bash
cp .env.production.example .env.production
# Điền mọi placeholder an toàn, tạo DNS A record và backup strategy
docker compose --env-file .env.production -f compose.production.yml config
docker compose --env-file .env.production -f compose.production.yml up -d --build
```

**Nếu chuyển production khỏi Railway:** bắt buộc dump/restore MySQL một cách nhất quán trong maintenance window, verify users/appointments/staff slots/migrations, thử restore backup, rồi mới đổi DNS. Không chạy đồng thời hai bản production ghi hai DB khác nhau. `deploy/vps/backup.sh` yêu cầu encrypted offsite destination (`BACKUP_TARGET` qua rclone); không xem một disk volume là backup.

## Deployment verification matrix

| Check | Cách kiểm chứng |
|---|---|
| Source đúng | Main SHA == GitHub build SHA == Vercel/Railway deployed SHA |
| API sống | `GET /health` HTTP 200 |
| DB đúng | migration step succeeded, không pending |
| Routing | Next `/api/...` trả nội dung API mong muốn |
| Auth | OTP lần đầu, trusted browser, đổi account, refresh/logout |
| Booking | availability → POST test → admin thấy booking → update status hợp lệ |
| Email | ADMIN inbox và Railway logs, không chỉ CI unit test |
| UI | Desktop/mobile layout, modal, date filters/search code |
| Dữ liệu | Không có duplicate staff slot, không mất booking khi deploy |

Đọc thêm [TESTING-OPERATIONS](TESTING-OPERATIONS.md).
