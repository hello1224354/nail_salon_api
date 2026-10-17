# SETUP — Cài đặt, chạy local và cấu hình

## Prerequisites

- Node.js **22+** và npm.
- Docker Engine + Docker Compose v2 để chạy MySQL 8 local.
- Git, terminal; nền tảng Windows có thể dùng PowerShell (thay `cp` bằng `Copy-Item`).
- Resend API key và sender đã xác minh, hoặc Gmail OAuth fallback, khi cần gửi OTP/email. Không lưu secrets vào Git.

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

`DB_SYNCHRONIZE=true` chỉ hỗ trợ local để TypeORM tạo bảng từ entity phục vụ phát triển, **không bảo đảm giống hoàn toàn schema production hoặc dữ liệu seed**. Production luôn sử dụng `false`. Vì 30 migration lịch sử đã bị xóa khỏi source và chưa có baseline mới, muốn dựng môi trường tương đương production phải **restore bản backup MySQL hợp lệ**; không thể chỉ chạy `migration:run` trên DB rỗng. Bất kỳ thay đổi schema production nào đều phải backup trước.

## 2. Backend

```bash
npm ci
npm run dev
```

- `npm run dev`: `tsx watch src/server.ts` tại port `3000`.
- `npm run build`: TypeScript compile ra `dist/`.
- `npm run start`: chạy `node dist/server.js` sau khi build.
- `npm run migration:show`: xem migration **mới** đang pending (nếu có), sau khi build và có DB config.
- `npm run migration:run`: áp dụng migration **mới** qua `dist/config/database.js` (build trước); hiện không có migration trong source, nên lệnh không tạo DB rỗng.

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

Lệnh `npm run start` của Next không được cấu hình sẵn để sử dụng port 3001 như script dev. Có thể đặt `PORT=3001` khi khởi động bản build Next.js riêng.

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
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Transactional email ưu tiên | địa chỉ gửi phải thuộc domain đã xác minh |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_FROM_EMAIL` | Gmail OAuth fallback | cần cả 4 khi không dùng Resend |
| `GOOGLE_MAPS_URL` | link map nội dung salon | optional |

`frontend/.env.example` chỉ có `NEXT_PUBLIC_API_BASE_URL`. Các biến deployment production được thiết lập trực tiếp trong Railway/Vercel; không commit file `.env` chứa secrets.

## 5. Gửi email (Resend/Gmail)

`src/modules/users/email.service.ts` ưu tiên Resend khi `RESEND_API_KEY` được cấu hình cùng `RESEND_FROM_EMAIL` hợp lệ. Nếu chưa có Resend API key thì mới dùng Gmail OAuth2 (`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_FROM_EMAIL`). Các luồng OTP đăng ký, đăng nhập, khôi phục/đổi mật khẩu gửi đồng bộ; email thông báo booking sử dụng `notification_outbox` và worker retry. Không có nhà cung cấp gửi mail hợp lệ sẽ trả lỗi; không tự tạo đường bypass OTP.

## 6. Troubleshooting setup

- `JWT_EXPIRES_IN_SECONDS must be between 300 and 900`: kiểm tra `.env`; không dùng giá trị ngoài khoảng.
- `DB_PASSWORD is required`: thêm biến vào `.env`.
- `ECONNREFUSED:3306`: kiểm tra container MySQL và port conflict.
- Server không chạy production: kiểm tra Railway pre-deploy `npm run migration:run` và kết nối tới **DB đã có schema hợp lệ**, rồi kiểm tra `npm run build`/`npm start`; lệnh migration không dựng schema mới từ DB rỗng.
- OTP không được gửi: kiểm tra Resend key/sender đã verify hoặc bộ Gmail fallback, DNS/provider logs và server logs; không chia sẻ token.
- Lỗi frontend fetch: kiểm tra `NEXT_PUBLIC_API_BASE_URL`, API health, cấu hình rewrite/CORS.

Xem [DEPLOYMENT](DEPLOYMENT.md) cho production và [OPERATIONS](OPERATIONS.md) cho vận hành.
