# Bàn giao tổng hợp backend Phần A

Ngày 03/11/2026. Repo/worktree: `D:/create/DATN/.worktrees/a1-backend`, nhánh `feat/a-backend`.
Frontend hiện tại: `feat/a-frontend` tại `3b260ec`. Đây là bàn giao **code đã kiểm cục bộ**, chưa phải nghiệm thu dịch vụ thật hoặc merge/deploy.

## 1. Đã hoàn tất

| Phần | Commit | Kết quả |
| --- | --- | --- |
| A1 phiên chat/vòng tool | db7f3d4 | Claude đã duyệt |
| A2 đơn hàng/Stripe test phía server | f1733bf | Claude duyệt code/migration; live pending |
| C1/C2 review Claude | e6fb8bd | Phân loại retry webhook; admin chat-logs chuẩn object |
| A4 tool review/ticket, guard hooks, bench flags | ad5658d | Claude duyệt code; live pending |
| A5-backend log hội thoại | 0cdf528 | Ghi2 row/lượt, riêng guard audit text; review độc lập qua |
| A7 seed/idempotency/reset | 40e1c64 | Code + SQL + schema/sample + recovery; review độc lập qua |
| Bổ sung A3 API review và health thật | c811652 | Lấp endpoint404 và health báo khỏe giả; review độc lập qua |

Không còn gói code bắt buộc chưa làm trong phần Codex được giao. UI/admin/Playwright thuộc Anti; B/C và A8 tùy chọn không thuộc lần giao này. A7 đã có cơ chế đầy đủ; chưa được coi tài khoản/dataset thật là đã seed.

## 2. Bằng chứng kiểm tra cuối

- **90 pytest passed in5.18s**, không skip; có FastAPI/LangGraph thật, session isolation, loop exhaustion, Unicode, log/redaction boundary, health và Auth SDK transport.
- **69 Node/PostgreSQL tests passed,0fail,0skip**: order/webhook/signature, review API, migration logs và seed/reset/rollback/permissions. PGlite là PostgreSQL nhúng, không chứng minh contention đa-session thật.
- Compileall exit0; ESLint toàn code server mới/đổi exit0. Next production build dùng env giả `.invalid`: compile/TypeScript qua, **28/28**, có route `/api/reviews`. Đây không phải build đã kết nối DB/Stripe thật.
- TDD regression đã tái hiện các lỗi review trước khi sửa. Reviewer seed và reviewer tích hợp riêng đã kiểm lại; không còn finding Critical/Important/Minor mở trong phần họ review. C1/A5 cũng có review độc lập ở các checkpoint trước.
- `.env.bench` và lock được kiểm ignore; không tạo/commit/in credential thật. Không chạy setup.sql, remote SQL, seed Auth thật, merge, push hay deploy.

Lệnh tái lập từ worktree:

```powershell
cd rag-service
& 'C:/Users/Admin/anaconda3/envs/DL/python.exe' -m pytest -q
cd ..
$env:PGLITE_MODULE_PATH='D:/create/DATN/.test-tools/a2/node_modules/@electric-sql/pglite'
node --test web_ui/src/lib/server/__tests__/*.test.cjs rag-service/tests/*-db.test.cjs
& 'C:/Users/Admin/anaconda3/envs/DL/python.exe' scripts/seed_bench.py --cases scripts/fixtures/seed_bench.sample.jsonl --dry-run
```

PGlite nằm ngoài repo, không thêm dependency app. Nếu chuyển máy, cài PGlite vào thư mục công cụ và đặt lại đường dẫn; dependency web dùng lockfile, Python theo rag-service/requirements*.txt.

## 3. Merge: giao Claude thực hiện

Giữ thứ tự đã chốt: backend vào main trước, rồi frontend. Chưa merge thật trong lần bàn giao này.

`git merge-tree --write-tree feat/a-backend feat/a-frontend` đã xác định **3 conflict**:

1. `.gitignore`: giữ hợp của cả hai, gồm env.bench, bench_records, .seed-bench.lock, Chroma/screenshot ignore của Anti.
2. `docs/reports/requests.md`: giữ cả hai bàn giao; contract chat-logs mới là `{chat_logs,total,limit,offset}` theo Claude C2.
3. `rag-service/app/main.py`: giữ phiên bản backend mới. Frontend chỉ thay health ở file này; backend đã có health thật và phải giữ session isolation, guard/default response, log A5, bound session_id100.

Sau giải conflict, chạy lại pytest/Node/build trên checkout đã merge trước live QA. Không giữ checkout-success tạo đơn client hoặc admin tin user_metadata từ baseline backend: các bản sửa UI/quyền thật nằm ở frontend và phải được ghép đủ.

## 4. Thứ tự triển khai sau review/sao lưu

Chủ đồ án áp dụng thủ công sau khi merge frontend, **không chạy setup.sql**:

1. `database/migrations/2026-11_payment_and_address.sql` — Claude đã duyệt.
2. `database/migrations/2026-11_chat_logs_guard.sql` — cần Claude duyệt.
3. `database/migrations/2026-11_product_reviews.sql` — cần Claude duyệt.
4. `database/migrations/2026-11_seed_bench.sql` — cần Claude duyệt; private mapping/RPC không đi vào context bot.

Sau đó C cung cấp JSONL chính thức, product_id thật và dữ liệu tổng hợp. Chạy seed tại **gốc workspace đã merge** theo [SEED-BENCH.md](../SEED-BENCH.md), chạy lại cùng file và so snapshot/mapping. `.env.bench` gốc cung cấp BENCH_CUSTOMER_EMAIL/PASSWORD cho A5.4; bench_admin lấy quyền từ user_roles. Không có mật khẩu trong tài liệu này.

## 5. Nghiệm thu dịch vụ thật còn phải chạy

- COD/Stripe test4242; sửa giá/user trong request không có tác dụng; đơn người khác404, URL không PII; replay Checkout webhook đã ký không trừ kho hai lần. Lỗi vĩnh viễn acknowledge200 cần đối soát qua order_id/code, không tự refund.
- Review chưa mua403; người đã có đơn COD accepted hoặc paid mới201; cancelled/unpaid/refunded không đủ điều kiện. Unicode round-trip đúng codepoint.
- Hai user không lộ lịch sử chat; thiếu session sinh UUID; input session quá100 bị422 trước gọi bot.
- Hỏi review và yêu cầu ticket bằng model thật; kiểm ticket owner và row DB. Test offline không chứng minh model thật tự chọn tool đúng.
- Chat3 lượt =>6 log message user/agent; tool_used chỉ của lượt hiện tại. Tắt DB log không làm client retry tạo ticket. Admin xem/lọc đúng object response; A5.4 phải chạy với bench_customer_a thật, không tính skip là đạt.
- `/health`: Supabase/Chroma mất kết nối hoặc collection rỗng =>degraded; không lộ exception/keys.
- Seed2 lần không đổi rows; reset chỉ mapped namespace, không đụng dữ liệu thật. Ticket ngoài mapping tham chiếu order bench =>từ chối reset để giữ nguyên ticket.

Đính chính `anti-qa-plan.md`: cột tồn kho là **stock**; webhook là **checkout.session.completed/checkout.session.async_payment_succeeded**, không phải payment_intent.succeeded; response idempotent là **{received:true}**, không cần already_processed. Ghi yêu cầu này ở requests.md, không sửa chéo tài liệu của Anti.

## 6. Giới hạn phải giữ rõ

- FOX off là baseline. FOX enabled/PII detector/masking thật thuộc B; A5 không ghi raw khi thiếu guard_log implementation. B cần trả LogText đã che không hoàn nguyên và decision IDs; không lấy reply đã restore làm audit text.
- Log hiện đồng bộ, lỗi có cảnh báo mã cố định nhưng chưa có queue recovery; SDK timeout có thể làm chậm request. Admin grouping theo session_id có thể gộp nếu caller cố dùng cùng chuỗi giữa user, dù backend memory/user_id vẫn tách.
- Stripe chưa reserve kho unpaid, còn đối soát thiếu kho sau payment/refund/session bỏ dở theo báo cáo A2. Không coi code checkpoint là quy trình vận hành tài chính đầy đủ.
- Auth provisioning và DB transaction không atomic chung. Credential giữ trước, metadata mismatch/UUID đổi phải đối soát; không auto take over, delete user hoặc reset password. Giữ file credential và namespace; mất file không có recovery tự động.
- Seed snapshot không thay stock/charge; mẫu chỉ smoke. C dataset, B guard, live Supabase/Stripe/provider và QA toàn web sau merge chưa được chứng minh trong môi trường thật.

Chi tiết: [A7](codex-A7.md), [A3/health](codex-A3-backend.md), [A5](codex-A5.md), [C1/C2](codex-C1-C2.md), [A2](codex-A2.md), [A4](codex-A4.md).
