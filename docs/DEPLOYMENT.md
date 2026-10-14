# DEPLOYMENT — production, rollback, VPS

Source đối chiếu: `Dockerfile`, `compose.production.yml`, `deploy/vps/README.md`, `frontend/next.config.ts`, `src/server.ts`.

## Môi trường đang sử dụng

| Thành phần | Dịch vụ | URL |
|---|---|---|
| Web Next.js | Vercel: `nail-salon-web-v2` | https://serpentenailroom.site/ |
| API Express | Railway: `api` | https://api-production-e911.up.railway.app |
| API health | Express | https://api-production-e911.up.railway.app/health |
| Database | MySQL qua biến môi trường backend | Không expose credentials công khai |

Frontend và backend được triển khai riêng trên Vercel và Railway. Healthcheck chỉ thể hiện trạng thái tiến trình API, không bảo đảm mọi chức năng nghiệp vụ.

Frontend Next rewrite `/api/:path*` sang `NEXT_PUBLIC_API_BASE_URL`. Trên Vercel, cấu hình environment cần trỏ đến API Railway thực tế **theo cơ chế dự án đang dùng**, và phải được kiểm tra ở dashboard khi clone project mới.

## Triển khai

Repository không còn bộ kiểm thử. Workflow GitHub Actions [Build](../.github/workflows/build.yml) chỉ cài dependencies và build backend/frontend (hai status checks bắt buộc của nhánh `main`), **không chạy test, QA, audit hoặc kiểm tra trình duyệt**. Vercel và Railway triển khai ứng dụng theo cấu hình deployment riêng.

## Quy trình deploy an toàn

1. Tạo feature branch từ `main` mới nhất, sửa source và tài liệu liên quan.
2. Review thay đổi trước merge, không commit secrets.
3. Merge vào `main` khi head còn khớp/không conflict.
4. **Vercel:** kiểm tra project nội bộ `nail-salon-web-v2` nhận đúng commit SHA và deployment `READY`; xác nhận `https://serpentenailroom.site` trỏ đúng deployment production, không chỉ kiểm tra URL deployment `.vercel.app`. Alias cũ phải chuyển hướng về domain chính, không được quảng bá làm website độc lập.
5. **Railway:** kiểm tra service `api` nhận đúng commit SHA và deployment `SUCCESS`. Nếu auto-deploy không nhận, kiểm tra GitHub source/branch trong Railway thay vì giả định deploy đã chạy.
6. Kiểm tra logs backend có DB migrations hoàn tất và `Server is running on port: 3000`.
7. Theo dõi `/health`, trạng thái deployment, runtime logs và cảnh báo vận hành.
8. Nếu thay đổi schema, làm verified database backup **trước** migration; chuẩn bị rollback tương thích schema.

Backend `src/server.ts` gọi `AppDataSource.showMigrations()` ở production và **fail startup nếu còn pending migration**. TypeORM migrations cần chạy trước khi start, có thể đặt thành Railway pre-deploy step phù hợp service; Dockerfile mặc định chỉ build và start application.

## Config production

- `NODE_ENV=production`, `DB_SYNCHRONIZE=false`, `DB_LOGGING=false`.
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` trỏ đúng DB và quyền tối thiểu.
- `JWT_SECRET` dài/ngẫu nhiên; không tái sử dụng giữa staging/production.
- `CORS_ORIGIN=https://serpentenailroom.site` cho website production; Origin check yêu cầu khớp chính xác cho refresh/logout. Không thay bằng URL deployment tạm hoặc domain cũ.
- Gửi OTP/khôi phục mật khẩu: **ưu tiên Resend** khi có `RESEND_API_KEY` và `RESEND_FROM_EMAIL` (địa chỉ thuộc domain đã được Resend xác minh). Resend dùng API key phía server, không phụ thuộc Google OAuth refresh token hết hạn/thu hồi.
- Chỉ khi **chưa** cấu hình `RESEND_API_KEY`, code mới dùng Gmail OAuth cũ (`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_FROM_EMAIL`). Nếu đặt Resend key nhưng thiếu sender, API sẽ báo thiếu cấu hình; không tự động gửi bằng Gmail.
- Chuyển production sang Resend: (1) tạo tài khoản tại https://resend.com; (2) thêm và xác minh domain `serpentenailroom.site`, cấu hình bản ghi DNS đúng theo dashboard Resend, **không xóa MX nhận thư hoặc ghi đè SPF hiện có**; (3) tạo API key chỉ có quyền gửi; (4) đặt `RESEND_API_KEY` và `RESEND_FROM_EMAIL=no-reply@serpentenailroom.site` trong Railway service `api` production; (5) deploy lại service theo cấu hình Railway. Không thêm API key vào Git.
- Resend loại bỏ rủi ro hết hạn 7 ngày do Google OAuth app ở chế độ Testing nhưng **không** bảo đảm 100% email luôn gửi được: API key có thể bị revoke, DNS bị sửa, provider gặp sự cố, hoặc tài khoản vượt giới hạn gửi. Theo dõi lỗi `Resend email send failed` trong runtime logs và dashboard nhà cung cấp.
- Ảnh upload được lưu trong bảng `media_files` dưới dạng MEDIUMBLOB trong MySQL Railway. Không yêu cầu R2 hay secret bổ sung. Khi chạy migration, cần backup database trước. Hướng dẫn: [MEDIA-STORAGE](MEDIA-STORAGE.md).
- `NEXT_PUBLIC_API_BASE_URL` cấu hình tại Vercel trước build.
- Cookie production dùng `Secure`, cần HTTPS. Không test login thực qua HTTP.

**Không đăng giá trị env thực, OAuth refresh token, database dump hoặc console cookies vào repo.**

## Rollback

- **Frontend-only:** chọn deployment Vercel trước đó tương thích API, xác nhận domain/health/UI.
- **Backend-only:** rollback phiên bản API tương thích với schema DB hiện tại; **không** rollback Docker image và kỳ vọng migration DB tự đảo ngược.
- **Có migration/ghi dữ liệu mới:** sao lưu, đánh giá backward/forward compatibility và kế hoạch phục hồi; không restore bản backup cũ lên production đang nhận booking mới vì sẽ làm mất các lần đặt.
- Ghi lại SHA source, deployment ID, thời gian cutover, trạng thái vận hành và rollback.

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

## Thông tin vận hành

- Theo dõi main SHA và commit SHA được triển khai tại Vercel, Railway.
- Theo dõi HTTP `/health`, migrations, kết nối MySQL và runtime logs.
- Xác nhận domain chính `https://serpentenailroom.site` được trỏ về deployment mới.
- Theo dõi dung lượng MySQL, backups và lỗi gửi email ADMIN.

Đọc thêm [OPERATIONS](OPERATIONS.md).
