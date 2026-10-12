# OPERATIONS — Vận hành Serpente Nail Room

## Production

- Web: https://serpentenailroom.site/
- API: https://api-production-e911.up.railway.app
- Backend sử dụng Railway/MySQL; frontend chạy trên Vercel.
- Giữ `CORS_ORIGIN=https://serpentenailroom.site` ở backend và cấu hình API rewrite của Next.js theo môi trường production.

## Theo dõi và xử lý sự cố

| Dấu hiệu | Nguồn điều tra |
|---|---|
| HTTP 502/503, API không phản hồi | Railway deployment/runtime logs, `/health`, kết nối MySQL |
| Lịch hẹn không tạo được / lỗi 409 | API error code, nhân viên đủ điều kiện, reservation slots |
| OTP không nhận được | Gmail OAuth, logs gửi mail, cấu hình email |
| Phiên bị mất / 401 | Refresh cookie, rotation, hạn cookie, `Secure` và `SameSite` |
| 403 `UNTRUSTED_ORIGIN` | `CORS_ORIGIN`, HTTPS, domain chính |
| Website chưa cập nhật | Vercel production alias và commit SHA được deploy |
| Dung lượng storage tăng | MySQL media BLOB và dung lượng volume |

API ghi `X-Request-Id`; khi điều tra lỗi sử dụng timestamp, endpoint, status và request ID. Không thu thập mật khẩu, JWT, refresh cookie, OTP hay thông tin cá nhân không cần thiết.

## Backup và phục hồi

- Sao lưu nhất quán MySQL trước migration hoặc cutover, mã hóa backup và lưu ngoài máy chủ.
- Giữ bản backup và kế hoạch rollback tương thích schema, đặc biệt với những migration đã ghi dữ liệu.
- Không phục hồi bản sao cũ lên production đang nhận booking mới vì có thể làm mất lịch.
- `src/jobs/retention-cleanup.ts` hỗ trợ dọn bản ghi audit/security hết hạn; theo dõi lịch cron của Railway.
- Nếu chuyển sang VPS, xem [runbook VPS](../deploy/vps/README.md).

Xem [DEPLOYMENT](DEPLOYMENT.md) và [AUTH-SECURITY](AUTH-SECURITY.md).
