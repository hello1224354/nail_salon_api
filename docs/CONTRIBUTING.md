# CONTRIBUTING — Quy trình phát triển và bảo trì

Repository sử dụng TypeScript cho backend và frontend, MySQL migrations và GitHub Actions. Quy trình đóng góp tập trung vào tính nhất quán dữ liệu, kiểm thử, code review và xác thực bản triển khai.

## Workflow

1. Cập nhật `main`, tạo nhánh ngắn có mục tiêu rõ (`feat/`, `fix/`, `docs/`).
2. Đọc [ARCHITECTURE](ARCHITECTURE.md), [API](API.md) và tài liệu domain liên quan.
3. Sửa các file đúng phạm vi; hạn chế sửa logic độc lập trong một PR.
4. Thay đổi DB: thêm migration, tuyệt đối không dùng `synchronize` cho production.
5. Nếu thay đổi contract API: cập nhật DTO/service, frontend types và [API](API.md).
6. Nếu đổi booking/OTP: thêm regression test tại `src/tests`, cập nhật [BOOKING](BOOKING.md)/[AUTH](AUTH-SECURITY.md).
7. Nếu đổi frontend: chạy tsc/build/CSP/audit, kiểm tra desktop và điện thoại; không suy UI chỉ từ code.
8. Đảm bảo GitHub Actions CI pass; review diff, tránh secrets, force push vào main.
9. Merge; kiểm tra deployment Vercel/Railway theo **SHA mới** và test môi trường live an toàn.
10. Ghi lại kết quả test, giới hạn chưa test, và cập nhật docs cùng PR.

## Cấu trúc mã nguồn

- Route, middleware, role: `src/modules/<domain>/<domain>.routes.ts`.
- Parse/validate: DTO, không dùng raw body làm domain state.
- Database/business: service, transactions, TypeORM entities.
- API HTTP adapter: controller, success/error envelope.
- UI: components; typed interfaces tại `frontend/src/lib/api.ts`.
- DB schema/data evolution: migration + backup + rollback plan.
- Credentials: environment config, không hard-code.

Không bypass authorization chỉ vì UI ẩn control; backend phải enforce. Với booking, giữ constraint `(staff_id, slot_start)` và không chuyển staff selection về client.

## Checklist trước khi merge

- [ ] Source và migrations đúng với nghiệp vụ.
- [ ] Code không chứa secrets, email/mật khẩu/OTP/dump thật.
- [ ] Backend `npm run typecheck`, regression tests, `npm run build`.
- [ ] Frontend `npx tsc --noEmit`, `npm run build`, CSP check/audit.
- [ ] Không phá role boundaries, OTP, session, CORS/origin.
- [ ] Không tạo double booking/slot overlap trong concurrent requests.
- [ ] Empty/error/loading/responsive states có thể dùng.
- [ ] API/docs/examples cập nhật đúng thay đổi.
- [ ] CI PR PASS, không còn merge conflicts.
- [ ] Production deployment SHA + health/E2E checks đã xác nhận trước khi báo hoàn thành.

## Chính sách tài liệu

- Mọi thông số thời gian (09:00–20:30, 3 giờ, 14 ngày...), quyền truy cập, status transition phải chỉ nguồn file tương ứng.
- Nếu tính năng không có trong source, ghi là *chưa triển khai* hoặc *đề xuất*, không mô tả như đã có.
- Không copy secrets hay PII vào issue, test fixtures, screenshot hoặc docs.
- API examples dùng UUID/credentials giả; không tái sử dụng dữ liệu production.
- Tài liệu dưới `docs/` bằng tiếng Việt, giữ tên class/endpoint/field đúng source.
- Khi source đổi, cập nhật dấu mốc commit/documentation scope để tránh docs stale.

## Thông tin bản phát hành

Ghi ngắn gọn: PR URL, merge SHA, CI result, Vercel deployment state/SHA, Railway state/SHA, healthcheck, E2E đã thực hiện, lỗi/giới hạn chưa kiểm chứng. Đặc biệt **email fire-and-forget**: phải kiểm tra inbox/logs khi test gửi, CI không đủ chứng minh delivery.

Điểm khởi đầu: [README repo](../README.md) và [mục lục docs](README.md).
