# CONTRIBUTING — Quy trình phát triển và bảo trì

Dự án gồm backend TypeScript/Express, frontend Next.js, MySQL và TypeORM. Các migration lịch sử đã xóa khỏi nhánh hiện tại; schema production vẫn nằm trong MySQL.

## Workflow

1. Tạo nhánh từ `main` mới nhất (`feat/`, `fix/`, `docs/`).
2. Đọc [ARCHITECTURE](ARCHITECTURE.md), [API](API.md) và tài liệu liên quan.
3. Sửa đúng phạm vi; cập nhật API types/docs khi contract thay đổi.
4. Nếu đổi DB, tạo migration **mới** dựa trên schema production thực tế, kiểm tra trên DB clone, backup và phương án rollback; không bật `synchronize` trên production.
5. Đảm bảo không đưa JWT, OTP, dữ liệu cá nhân hoặc secrets vào repository.
6. Review diff và merge vào `main`.
7. Theo dõi Vercel/Railway deployment status, commit SHA, runtime logs và rollback khi cần.

Các unit test và workflow GitHub Actions CI đã được loại khỏi repository. Trước khi merge hoặc deploy, phải tự chạy `npm ci && npm run build` cho backend và `cd frontend && npm ci && npm run build` cho frontend; build không thay thế kiểm thử nghiệp vụ/integration/E2E.

## Cấu trúc mã nguồn

- Route, middleware, role: `src/modules/<domain>/<domain>.routes.ts`.
- DTO validate request; service thực thi nghiệp vụ và transactions.
- API adapter: controllers; giao diện và API client tại `frontend/src`.
- Schema: các `.entity.ts` ánh xạ bảng; production có bảng TypeORM `migrations` lưu lịch sử. Không có baseline dựng DB mới; chỉ tạo `src/migrations/` khi có migration mới được review.

Không bypass authorization; booking phải duy trì constraint `(staff_id, slot_start)` và auto-assign staff phía backend.

Điểm khởi đầu: [README](../README.md), [tài liệu](README.md), [deployment](DEPLOYMENT.md).
