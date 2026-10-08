# Serpente Nail Room — Website đặt lịch & quản trị salon

Repository full-stack cho Serpente Nail Room: website giới thiệu, dịch vụ, đặt lịch trực tuyến theo khung giờ còn trống, quản lý nhân viên/chi nhánh/lịch/ưu đãi, OTP email và dashboard admin.

**Cơ sở tài liệu:** Source trên `main`, commit `ad110058` (09/10/2026 ICT). Mọi thay đổi nghiệp vụ phải cập nhật tài liệu tương ứng.

## Công nghệ

| Tầng | Stack |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 |
| Backend | Node.js, Express 5, TypeScript |
| CSDL | MySQL 8, TypeORM, migrations |
| Xác thực | JWT + refresh sessions + OTP Gmail + trusted browser |
| Triển khai hiện tại | Vercel (web) + Railway (API/database) |
| Triển khai thay thế | Docker Compose VPS + Caddy |

## Chức năng

- **Khách:** đăng ký xác minh email; login và OTP khi cần; xem chi nhánh/dịch vụ/ưu đãi; chọn ngày/giờ khả dụng, đặt lịch nhóm, xem lịch cá nhân.
- **Booking:** backend tự phân nhân viên; slot 15 phút với khóa duy nhất theo nhân viên; hỗ trợ 1–N khách; lịch mới `pending`.
- **Admin:** thống kê trong ngày, CRUD chi nhánh/dịch vụ/nhân viên/ưu đãi, quản lý trạng thái lịch, lọc từ ngày–đến ngày và tìm mã lịch 8 ký tự.
- **Thông báo:** gửi email khi có booking mới đến tài khoản `admin` có email, sau DB commit, best-effort.
- **Bảo mật:** role-based authorization, login OTP, refresh-token rotation, audit log và rate limiting.

## Khởi động nhanh local

Yêu cầu: Node.js 22+ (CI: Node 22, Docker: Node 24), npm, Docker Compose v2.

```bash
git clone https://github.com/hello1224354/nail_salon_api.git
cd nail_salon_api
cp .env.example .env
# Thay DB_PASSWORD, JWT_SECRET bằng giá trị local của bạn
docker compose up -d
npm ci
npm run dev
```

Terminal khác:

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

- Web: `http://localhost:3001`; API: `http://localhost:3000`; health: `/health`.
- Muốn OTP/email hoạt động cần điền đủ Gmail OAuth; xem [SETUP](docs/SETUP.md). Không commit secrets hay data khách hàng.

## Tài liệu

[Trang mục lục](docs/README.md) · [Kiến trúc](docs/ARCHITECTURE.md) · [Setup](docs/SETUP.md) · [API](docs/API.md) · [Database](docs/DATABASE.md) · [Booking](docs/BOOKING.md) · [Auth/Security](docs/AUTH-SECURITY.md) · [Frontend](docs/FRONTEND.md) · [Deployment](docs/DEPLOYMENT.md) · [Testing/Operations](docs/TESTING-OPERATIONS.md) · [Contributing](docs/CONTRIBUTING.md).

## Cấu trúc

```text
frontend/          Next App Router, components, browser auth/API
src/app.ts         Express application + routes + middleware
src/server.ts      DB initialization, HTTP service
src/modules/       Business domains
src/config/        Environment, TypeORM
src/migrations/    Database schema/seed history
src/tests/         Regression tests
src/jobs/          Retention cleanup script
deploy/vps/        Caddy, backups, VPS instructions
docs/              Project documentation
```

## Môi trường

- Website: https://nail-salon-web-v2.vercel.app/
- API health: https://api-production-e911.up.railway.app/health
- Hướng dẫn VPS ở `deploy/vps/README.md` là **phương án khác**, không phải thông báo đã cutover.

**Giới hạn:** Chưa có thanh toán tích hợp, lịch shift riêng của nhân viên, email queue/retry bền vững hoặc API khách tự hủy lịch; không suy luận các tính năng này từ UI. Repository chưa có file `LICENSE`.
