# Backend handoff — yêu cầu tích hợp

Ngày: 03/11/2026. Nhánh `feat/a-backend`.

## A2 — Frontend và tài liệu chạy

- API backend đã có `POST /api/orders`, `GET /api/orders/{id}`, `PATCH /api/orders/{id}/note`, `POST /api/stripe/webhook` theo hợp đồng §3. `/api/stripe` cũ dùng chung luồng xác thực/tính giá mới; không còn nhận giá hay user_id của client làm nguồn tin cậy.
- Checkout và checkout-success mới đã ở nhánh frontend. Cần ghép nhánh trước nghiệm thu; không dùng trang checkout cũ trên baseline backend sau khi áp dụng migration, vì đường ghi Supabase trực tiếp đã bị khóa.
- Đề nghị Anti cập nhật `docs/RUN.md` với cấu hình server: `APP_URL` (origin shop; local mặc định `http://localhost:3000`), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` (**sk_test_**), `STRIPE_WEBHOOK_SECRET`. Không ghi giá trị khóa vào tài liệu.
- Migration `database/migrations/2026-11_payment_and_address.sql` chỉ được chủ đồ án chạy sau khi review/sao lưu. Không chạy lại setup.sql. Sau đó thử Stripe CLI `stripe listen --forward-to localhost:3000/api/stripe/webhook` và thẻ test, kiểm trạng thái/kho và request sửa giá/chủ đơn.
- Có thể chạy Node tests bằng lệnh trong `codex-A2.md`, không cần thêm vitest/package.json.
- Khi merge, hợp nhất file requests.md của hai nhánh và giữ các bàn giao cũ của Anti; file backend này không thay đổi hợp đồng API đã duyệt.

## A7 — Bench credentials (ghi nhớ F10 của Opus)

- Backend đã tự ignore `.env.bench` và `*.env.bench`, có kiểm chứng `git check-ignore -v --no-index`. Chưa tạo tài khoản hoặc ghi mật khẩu ở A2.
- Khi đến A7, Codex tạo `.env.bench` và xuất `BENCH_CUSTOMER_EMAIL` / `BENCH_CUSTOMER_PASSWORD` cho **bench_customer_a**, theo yêu cầu Anti. Kiểm tra ignore tại đúng đường dẫn trước khi ghi; không in mật khẩu, không commit file này.
- File ignore trên nhánh frontend không tự có tác dụng trên worktree backend. Sau khi ghép nhánh vẫn phải kiểm tra ignore ở nơi chạy seed và nơi Playwright đọc cấu hình.
- A5.4 frontend chỉ được chốt khi chạy thật bằng tài khoản bench; chưa coi test skip là đạt kiểm tra quyền.

## A5 — Nguồn quyền admin

Đã đọc bàn giao frontend: dùng `public.user_roles`/`requireRole` làm nguồn quyền admin, không dùng `user_metadata.role`. A2 không thêm API admin và không sửa module auth của Anti. Giữ hợp đồng chat-logs dạng mảng ở §3 khi làm A5; ghi chú response dạng object trong bản requests cũ của Anti đã lỗi thời so với F3 được sửa.
