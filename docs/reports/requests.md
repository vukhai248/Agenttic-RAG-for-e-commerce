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
- Khi đến A7, Codex tạo `.env.bench` tại **gốc repo** và xuất `BENCH_CUSTOMER_EMAIL` / `BENCH_CUSTOMER_PASSWORD` cho **bench_customer_a**, theo đính chính mới của Claude. Playwright đọc cả `web_ui/.env.bench` và `../.env.bench`. Kiểm tra ignore tại đúng đường dẫn trước khi ghi; không in mật khẩu, không commit file này. `bench_admin` cần role=admin trong public.user_roles, không dùng user_metadata.
- File ignore trên nhánh frontend không tự có tác dụng trên worktree backend. Sau khi ghép nhánh vẫn phải kiểm tra ignore ở nơi chạy seed và nơi Playwright đọc cấu hình.
- A5.4 frontend chỉ được chốt khi chạy thật bằng tài khoản bench; chưa coi test skip là đạt kiểm tra quyền.

## A5 — Nguồn quyền admin

Đã đọc bàn giao frontend: dùng `public.user_roles`/`requireRole` làm nguồn quyền admin, không dùng `user_metadata.role`. A2 không thêm API admin và không sửa module auth của Anti. Theo đính chính C2 của Claude (03/11/2026), hợp đồng chat-logs chuẩn là object `{chat_logs, total, limit, offset}` đã được chấp nhận ở F3; thay thế dạng mảng trong E §3 cũ. A5-backend chỉ ghi bảng chat_logs, không viết lại route frontend.

## A4 — Tool/guard/bench và tài liệu RUN

- FastAPI `/chat` đã có `guard: {action:"allow", decision_id:null, flags:[]}` khi FOX tắt, đúng hợp đồng. Tool mới: `product_reviews`, `create_support_ticket`. Không cần thay body chat.
- Đề nghị frontend cập nhật RUN sau ghép nhánh: `LEGACY_LLM_GUARDRAIL=on|off` và `LEGACY_PROMPT_DEFENSE=on|off` (mặc định on); `FOX_GUARD_MODE=off` ở A4 (mode khác chưa triển khai); `FOX_GUARD_ARM` là nhãn do C định nghĩa.
- `BENCH_RECORD=1` opt-in ghi payload thử gửi Gemini/Groq tại `rag-service/bench_records/YYYY-MM-DD.jsonl` theo UTC. Mặc định tắt, thư mục gitignore, có thể chứa raw PII/text theo mục đích thực nghiệm; không phải chat_logs A5.
- `BENCH_TEMPERATURE=<số hữu hạn 0..2>` ghi đè nhiệt độ; bỏ biến để giữ config. BENCH_RECORD không đổi output, ghi lỗi thì chặn lần gửi không được ghi.
- Skill mới được ghi tại CHANGELOG-bench.md. Chưa có guard logic Phần B, chưa có migration/tài khoản seed A7 ở checkpoint này.
- Khi nghiệm thu sau ghép nhánh: hỏi “Mọi người đánh giá iPhone 16 thế nào?” để đọc review, “Tạo ticket báo đơn giao chậm” khi đã đăng nhập để tạo ticket. Với nhiều biến thể sản phẩm, cần resolve product_id trước; ticket chỉ gắn đơn thuộc chủ.

## A5-backend — Nhật ký thật và bàn giao B

- `/chat` ghi 2 message (user/agent) mỗi lượt bằng service_role, giữ session_id, user_id đã xác minh; risk safe/needs_ticket/attack map low/medium/high. Tool_used chỉ của lượt hiện tại; không lưu JWT/tool args/raw state.
- Migration `2026-11_chat_logs_guard.sql` chỉ là file để review. Chủ đồ án chạy sau duyệt; thêm guard_decision_ids/default [], index phiên/thời gian và khóa quyền client. Không chạy setup.sql. Cần apply trước nghiệm thu log thật.
- B/B9 cần triển khai thêm `guard_client.guard_log(text, ctx) -> LogText(message, decision_ids)`: message phải che PII không hoàn nguyên; ctx có session_id/user_id/mode/arm/role. Không dùng Decision.text nếu chỉ giả danh hóa hoặc đã restore. Mode off trả text gốc; mode bật thiếu masking thì writer từ chối ghi, không raw fallback.
- B có thể trả danh sách decision IDs của cả lượt qua AgentState.guard_decision_ids; writer gộp với IDs do guard_log trả. Trường này và turn_tool_calls reset mỗi lượt. Các hook input/context/output hiện giữ hợp đồng A4; A5 không tự triển khai detector hoặc thay policy B.
- Lỗi log không làm chat/tool đã hoàn tất thành lỗi/retry, chỉ phát mã cảnh báo cố định để vận hành; chưa có queue khôi phục. Ba lượt chat có 6 dòng message thật khi DB/migration sẵn sàng.
- Admin route chuẩn vẫn object `{chat_logs,total,limit,offset}` theo Claude C2. Dữ liệu client session_id cần UUID riêng theo user theo A1; nếu caller tự gửi trùng chuỗi giữa hai user, admin hiện nhóm theo session_id có thể trộn nhóm (khách không đọc được log). Khi cần chống nhóm trùng tuyệt đối, Anti bổ sung user_id vào grouping/filter; không sửa chéo UI tại gói này.
