# SETUP — Cài đặt, chạy local và cấu hình

## Prerequisites

- Node.js **22+** và npm (`.github/workflows/security-hardening-ci.yml` dùng 22; `Dockerfile` dùng 24).
- Docker Engine + Docker Compose v2 để chạy MySQL 8 local.
- Git, terminal; nền tảng Windows có thể dùng PowerShell (thay `cp` bằng `Copy-Item`).
- Gmail OAuth credentials **chỉ khi cần** test chức năng gửi OTP/email. Không lưu credentials vào Git.

## 1. Clone & database

```bash
git clone https://github.com/hello1224354/nail_salon_api.git
cd nail_salon_api
cp .env.example .env
```

Trong `.env`, tối thiểu điền `DB_PASSWORD`, `JWT_SECRET` đủ mạnh; local `DB_HOST=localhost`, `DB_PORT=3306`, `DB_NAME=nail_salon_db`. Cấu hình `docker-compose.yml` chạy service `mysql-db` với mật khẩu root `${DB_PASSWORD}` và DB `${DB_NAME}`:

```bash
docker compose up -d
docker compose ps
```

Chỉ dùng `DB_SYNCHRONIZE=true` trong **local development**, không bao giờ dùng ở production. Database có sẵn dữ liệu/migration nên **backup trước khi thay đổi phương thức tạo schema**. Với local DB hoàn toàn mới, dev TypeORM có thể tự đồng bộ schema; để xác nhận migration pipeline tương tự production, đặt `DB_SYNCHRONIZE=false`, build rồi chạy migrations trước API.

## 2. Backend

```bash
npm ci
npm run typecheck
npm run dev
```

- `npm run dev`: `tsx watch src/server.ts` tại port `3000`.
- `npm run build`: TypeScript compile ra `dist/`.
- `npm run start`: chạy `node dist/server.js` sau khi build.
- `npm run migration:show`: chỉ sau khi build và có DB config.
- `npm run migration:run`: chạy migration qua `dist/config/database.js` (build trước).

API health: `http://localhost:3000/health` → `{"status":"ok"}`.

**Lưu ý:** `src/server.ts` chặn khởi động production nếu còn migration chưa áp dụng. `DB_SYNCHRONIZE` bị ép `false` ở production.

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

`frontend/.env.local`: `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`. Website ở `http://localhost:3001`. Next rewrite `/api/:path*` về backend; client code gọi same-origin path.

Các command trong thư mục `frontend`:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Lưu ý: `npm run start` của Next không đặt port 3001 như script dev; cần cấu hình `PORT=3001` khi chạy production riêng.

## 4. Biến môi trường backend

| Biến | Mục đích | Ghi chú |
|---|---|---|
| `NODE_ENV` | `development` / `production` | default `development` |
| `PORT` | Express HTTP port | default 3000 |
| `CORS_ORIGIN` | origin được phép, yêu cầu trong production | local `http://localhost:3001` |
| `TRUST_PROXY_HOPS` | số proxy hops | 0–5, default 1 |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection | DB_PASSWORD bắt buộc |
| `DB_SYNCHRONIZE` | TypeORM schema synchronization | chỉ local, production luôn false |
| `DB_LOGGING` | SQL logging | production luôn false |
| `JWT_SECRET` | ký JWT và OTP HMAC | bắt buộc, bảo vệ tuyệt đối |
| `JWT_EXPIRES_IN_SECONDS` | tuổi JWT | 300–900, default 600 |
| `REFRESH_SESSION_DAYS` | tuổi refresh session/trust | 1–30, default 7 |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_FROM_EMAIL` | Gmail OAuth sender | cần cả 4 để gửi email |
| `GOOGLE_MAPS_URL` | link map nội dung salon | optional |

`frontend/.env.example` chỉ có `NEXT_PUBLIC_API_BASE_URL`. `SITE_ADDRESS`, `ACME_EMAIL`, `MYSQL_ROOT_PASSWORD` nằm trong **mẫu môi trường VPS** `.env.production.example`, không phải cấu hình Express API.

## 5. Gmail

Sender `src/modules/users/email.service.ts` trao đổi refresh token qua Google OAuth token endpoint, sau đó POST Gmail `users/me/messages/send`. Cần refresh token với quyền gửi Gmail hợp lệ của địa chỉ `GMAIL_FROM_EMAIL`. Các chức năng phụ thuộc sender: OTP đăng ký, OTP đăng nhập, reset/đổi mật khẩu và thông báo booking cho admin. Nếu thiếu cấu hình, `EMAIL_NOT_CONFIGURED` hoặc lỗi gửi; không tự tạo bypass OTP để test.

## 6. Troubleshooting setup

- `JWT_EXPIRES_IN_SECONDS must be between 300 and 900`: kiểm tra `.env`; không dùng giá trị ngoài khoảng.
- `DB_PASSWORD is required`: thêm biến vào `.env`.
- `ECONNREFUSED:3306`: kiểm tra container MySQL và port conflict.
- Server không chạy production: `npm run build`, `npm run migration:run`, rồi `npm start`.
- OTP không được gửi: kiểm tra đủ 4 biến Gmail, OAuth scope/token, server logs; không chia sẻ token.
- Lỗi frontend fetch: kiểm tra `NEXT_PUBLIC_API_BASE_URL`, API health, cấu hình rewrite/CORS.

Xem [DEPLOYMENT](DEPLOYMENT.md) cho production và [TESTING](TESTING-OPERATIONS.md) cho kiểm tra.
