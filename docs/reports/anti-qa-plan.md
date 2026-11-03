# Kế hoạch Kiểm thử Toàn diện Hệ thống (Post-Merge QA Plan)

**Người soạn thảo**: Antigravity (Tầng 3 — Frontend & QA / Kiểm thử)  
**Nhánh Git**: `feat/a-frontend`  
**Ngày soạn thảo**: 03/11/2026  
**Tham chiếu chỉ đạo**: Kế hoạch G2 từ Claude Opus (Lead Architect)

---

## 1. 🎯 Mục tiêu & Điều kiện Tiên quyết

### 1.1 Mục tiêu
Xác thực toàn diện tính toàn vẹn chức năng, luồng nghiệp vụ E-Commerce, hợp đồng API và các lớp phòng thủ an ninh mạng trên toàn bộ hệ thống sau khi **Claude Opus** thực hiện merge hai nhánh `feat/a-frontend` và `feat/a-backend`.

### 1.2 Điều kiện Tiên quyết (Prerequisites)
> [!IMPORTANT]
> **Bộ kiểm thử này CHỈ ĐƯỢC PHÉP CHẠY khi thỏa mãn toàn bộ các điều kiện sau:**
> 1. Nhánh `feat/a-frontend` và `feat/a-backend` đã được Claude Opus gộp (merge) thành công vào nhánh chung.
> 2. Chủ đồ án đã thực thi an toàn file migration `database/migrations/2026-11_payment_and_address.sql` trên Supabase (kèm bản sao lưu DB trước khi chạy).
> 3. Backend Codex đã hoàn tất gói A7: chạy `python scripts/seed_bench.py` tạo các tài khoản mẫu `bench_customer_a`, `bench_customer_b`, `bench_admin` và xuất file `.env.bench` ở gốc repo.
> 4. **QUY TẮC KHỞI ĐỘNG MÔI TRƯỜNG BẮT BUỘC**:
>    - Phải tắt toàn bộ các tiến trình dev server cũ đang chiếm cổng 3000 và 8080.
>    - Khởi động lại dev server sạch từ đúng thư mục làm việc đã merge:
>      - Terminal 1 (Backend): `$env:PYTHONUTF8=1; cd rag-service; conda run -n DL uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload`
>      - Terminal 2 (Frontend): `cd web_ui; npm.cmd run dev`
>      - Terminal 3 (Stripe CLI): `stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## 2. 📋 Danh mục 5 Ca Kiểm thử Trọng Yếu (Critical QA Test Cases)

### Ca 1: Đặt hàng COD & Thanh toán Stripe Thẻ Test `4242...` (Inventory & Idempotency)
- **Mục tiêu**: Kiểm tra luồng thanh toán đa phương thức, cập nhật trạng thái đơn hàng chính xác và trừ kho sản phẩm đúng 1 lần duy nhất (chống trừ kho kép).
- **Các bước thực hiện**:
  1. **Luồng COD**:
     - Đăng nhập tài khoản `bench_customer_a`.
     - Thêm sản phẩm (ví dụ: iPhone 15 Pro Max, số lượng 1) vào giỏ hàng.
     - Vào `/checkout`, kiểm tra thông tin địa chỉ tách trường.
     - Chọn phương thức: *Thu tiền khi nhận hàng (COD)* -> Bấm *Xác nhận đặt hàng*.
     - **Kỳ vọng**: Chuyển hướng sang `/checkout-success?order_id=...` (URL không lộ PII). Trạng thái đơn trong DB là `status: 'pending'`, `payment_status: 'cod_pending'`. Tồn kho (`inventory_quantity`) của sản phẩm giảm đi đúng 1 đơn vị.
  2. **Luồng Stripe (Thẻ Test `4242...`)**:
     - Thêm sản phẩm vào giỏ hàng -> Chọn phương thức *Thẻ tín dụng / Stripe*.
     - Nhập số thẻ: `4242 4242 4242 4242`, ngày hết hạn hợp lệ trong tương lai, CVC bất kỳ -> Bấm thanh toán.
     - Stripe CLI bắt sự kiện và chuyển tiếp webhook `payment_intent.succeeded` về `/api/stripe/webhook`.
     - **Kỳ vọng**: Đơn hàng chuyển sang `payment_status: 'paid'`. Tồn kho bị trừ chính xác 1 lần.
  3. **Kiểm tra Tính Bất Biến (Idempotency)**:
     - Gửi lại cùng một payload webhook `payment_intent.succeeded` lần thứ hai vào `/api/stripe/webhook`.
     - **Kỳ vọng**: API trả về `200 OK` (`{ received: true, already_processed: true }`), số lượng tồn kho trong database **tuyệt đối không bị trừ thêm lần nữa**.

---

### Ca 2: Chống Can Thiệp Giá & ID Người Dùng (Price & User ID Tampering Protection)
- **Mục tiêu**: Đảm bảo kẻ tấn công không thể mua hàng với giá tùy biến (ví dụ: sửa 30 triệu thành 1.000 VNĐ) hoặc mạo danh người khác đặt hàng.
- **Các bước thực hiện**:
  1. Sử dụng công cụ gửi request (cURL hoặc Playwright request) gửi trực tiếp payload cố tình can thiệp giá lên `POST /api/orders`:
     ```json
     {
       "items": [
         {
           "product_id": 1,
           "quantity": 1,
           "price": 1000
         }
       ],
       "user_id": "00000000-0000-0000-0000-000000000000",
       "recipient_name": "Attacker",
       "recipient_phone": "0988888888",
       "address_line": "123 Hack St",
       "province": "Thành phố Hà Nội",
       "district": "Quận Ba Đình",
       "ward": "Phường Phúc Xá",
       "payment_method": "cod"
     }
     ```
  2. **Kỳ vọng**:
     - Hàm RPC server-side `create_order_rpc` **hoàn toàn bỏ qua trường `price`** do client gửi lên.
     - Server tự động truy vấn giá niêm yết thực tế từ bảng `products` trong DB để tính `total_amount`.
     - Server **hoàn toàn bỏ qua `user_id` giả mạo** trong body, chỉ sử dụng `auth.uid()` từ JWT token xác thực (hoặc gán `null` nếu khách không đăng nhập).

---

### Ca 3: Kiểm Soát Quyền Truy Cập Chéo Đơn Hàng (Cross-Account Isolation / PII Protection)
- **Mục tiêu**: Ngăn chặn rò rỉ thông tin cá nhân (PII) khi người dùng cố tình đoán `order_id` của khách hàng khác.
- **Các bước thực hiện**:
  1. Dùng tài khoản `bench_customer_a` tạo một đơn hàng thành công, ghi nhận mã đơn: `ORDER_ID_A`.
  2. Đăng xuất và đăng nhập bằng tài khoản `bench_customer_b` (hoặc gọi API không có token).
  3. Gửi request `GET /api/orders/ORDER_ID_A`.
  4. Truy cập giao diện trực tiếp tại: `/account` và `/checkout-success?order_id=ORDER_ID_A`.
- **Kỳ vọng**:
  - API `GET /api/orders/ORDER_ID_A` từ chối và trả về đúng **404 NOT_FOUND** (tuân thủ chuẩn OWASP API Security: không trả về 403 để tránh để lộ sự tồn tại của đơn hàng).
  - Không có bất kỳ thông tin PII nào (Tên, Số điện thoại, Địa chỉ giao hàng) của Khách hàng A bị rò rỉ sang phiên của Khách hàng B.

---

### Ca 4: Kiểm Thử Hội Thoại Multi-turn Agentic RAG Thực Tế
- **Mục tiêu**: Đảm bảo Master Agent và các Tool mới (`review_summary`, `support_ticket`) hoạt động chính xác với dữ liệu thật, không hallucination.
- **Các bước thực hiện**:
  1. **Câu hỏi 1 (Review Summary Tool)**:
     - Mở Chat widget, nhập: *"Mọi người đánh giá iPhone 16 thế nào?"*.
     - **Kỳ vọng**: Master Agent gọi tool tổng hợp đánh giá, trích xuất điểm sao trung bình và tóm tắt nhận xét từ bảng `product_reviews`. Phản hồi trả lời lịch sự, đầy đủ thông tin, không bịa đặt review giả.
  2. **Câu hỏi 2 (Support Ticket Tool)**:
     - Trong cùng phiên chat, nhập tiếp: *"Tạo ticket báo đơn giao chậm"*.
     - **Kỳ vọng**: Master Agent nhận diện ý định hỗ trợ khiếu nại, gọi tool tạo ticket và tạo thành công một bản ghi trong bảng `support_tickets` liên kết với `user_id` hiện tại. Phản hồi cung cấp mã ticket hỗ trợ và thông báo nhân viên sẽ tiếp nhận.

---

### Ca 5: Kiểm Thử Tự Động A5.4 Chạy Thật với Tài Khoản `bench_customer_a`
- **Mục tiêu**: Chốt nghiệm thu hoàn toàn gói **A5-UI**, chứng minh module `requireRole` chặn đứng tấn công leo quyền quản trị viên trên API server thật.
- **Các bước thực hiện**:
  1. Kiểm tra file `.env.bench` ở gốc repo có chứa:
     ```env
     BENCH_CUSTOMER_EMAIL=bench_customer_a@example.com
     BENCH_CUSTOMER_PASSWORD=your_bench_password
     ```
  2. Chạy kịch bản test Playwright A5.4:
     ```powershell
     cd web_ui
     npx.cmd playwright test tests/e2e/a5_ui.spec.ts -g "A5.4" --reporter=list
     ```
- **Kỳ vọng**:
  - Test nạp credentials từ `.env.bench` thành công, đăng nhập tài khoản thật qua Supabase client.
  - Tự cập nhật `user_metadata.role = 'admin'`.
  - Gọi cả 4 route `GET /api/admin/{chat-logs,orders,tickets,users}` và `PUT /api/admin/users`.
  - Toàn bộ 5 request đều nhận phản hồi **403 `FORBIDDEN`** do máy chủ kiểm tra bảng `public.user_roles`.
  - Test **PASSED 100% (KHÔNG BỊ SKIP)**.

---

## 3. 📝 Quy trình Ghi nhận Lỗi (Bug Reporting Protocol)

Nếu phát hiện bất kỳ lỗi sai khác nào so với kết quả mong đợi trong quá trình thực thi 5 ca kiểm thử trên:
1. Tạo hoặc cập nhật file: `docs/QA/bugs.md`.
2. Format mẫu ghi nhận bug:
   ```markdown
   ### [BUG-00X] Tiêu đề ngắn gọn của lỗi
   - **Mức độ**: Critical / High / Medium / Low
   - **Ca kiểm thử**: Ca 1 / 2 / 3 / 4 / 5
   - **Các bước tái hiện**:
     1. ...
     2. ...
   - **Kết quả mong đợi**: ...
   - **Kết quả thực tế**: ...
   - **Bằng chứng**: Ảnh chụp / Log API đính kèm tại `docs/reports/evidence/`
   ```
