# CONTRIBUTING — Quy trình phát triển và bảo trì

Dự án gồm backend TypeScript/Express, frontend Next.js, MySQL và TypeORM migrations.

## Workflow

1. Tạo nhánh từ `main` mới nhất (`feat/`, `fix/`, `docs/`).
2. Đọc [ARCHITECTURE](ARCHITECTURE.md), [API](API.md) và tài liệu liên quan.
3. Sửa đúng phạm vi; cập nhật API types/docs khi contract thay đổi.
4. Nếu đổi DB, thêm migration và backup strategy; không bật `synchronize` trên production.
5. Đảm bảo không đưa JWT, OTP, dữ liệu cá nhân hoặc secrets vào repository.
6. Review diff và merge vào `main`.
7. Theo dõi Vercel/Railway deployment status, commit SHA, runtime logs và rollback khi cần.

Repository không còn file hoặc workflow kiểm thử tự động. Lệnh `build` được giữ vì là bước đóng gói cần thiết để chạy ứng dụng.

## Cấu trúc mã nguồn

- Route, middleware, role: `src/modules/<domain>/<domain>.routes.ts`.
- DTO validate request; service thực thi nghiệp vụ và transactions.
- API adapter: controllers; giao diện và API client tại `frontend/src`.
- Schema: `src/migrations`, triển khai với backup và migration phù hợp.

Không bypass authorization; booking phải duy trì constraint `(staff_id, slot_start)` và auto-assign staff phía backend.

Điểm khởi đầu: [README](../README.md), [tài liệu](README.md), [deployment](DEPLOYMENT.md).
