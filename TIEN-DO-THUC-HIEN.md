# Tiến độ trùng tu & bổ sung chức năng — Antigravity E-Shop

> File theo dõi công việc phần **giao diện + chức năng TMĐT** (phần RAG/agent do chủ dự án tự làm).
> Cập nhật: mỗi khi hoàn thành 1 hạng mục thì đánh dấu `[x]`.

## Quyết định thiết kế
- Theme: giữ **cả Light + Dark**, đồng bộ hoàn toàn qua design token trong `globals.css`.
- Phong cách: **đen/trắng tối giản + 1 accent màu xanh dương (blue)** cho CTA, giá, link, badge.
- Dữ liệu: dùng **fallback tĩnh** để hoàn thiện UI trước; tích hợp Supabase/seed để sau.

---

## A. Sửa bug kỹ thuật (ưu tiên cao)
- [x] `chat-widget.tsx`: bỏ thuộc tính `className` bị trùng trên `<div>` tin nhắn (JSX lỗi) - Đã hoàn thành.
- [x] Class Tailwind không tồn tại (bị bỏ qua âm thầm), cần thay bằng class hợp lệ / token:
  - [x] `text-yellow-555` (products/page.tsx)
  - [x] `text-yellow-455` (account/page.tsx)
  - [x] `text-slate-350` (products/[id]/page.tsx — 2 chỗ, có chỗ trùng lặp)
  - [x] `text-slate-455` (account/page.tsx — trùng với text-slate-400)
  - [x] `border-slate-850`, `bg-slate-850` (account, auth)
- [x] `checkout-success`: literal `**Antigravity E-Shop**` hiển thị dấu sao — bỏ markdown thừa - Đã hoàn thành.
- [x] `checkout/page.tsx`: `router.push('/cart')` gọi trong render khi giỏ trống → chuyển vào `useEffect` - Đã hoàn thành.
- [x] `auth/login`: OAuth Google trỏ `/auth/callback` nhưng route chưa tồn tại → tạo route callback - Đã hoàn thành.

## B. Đồng bộ giao diện theo token (Light + Dark)
- [x] Cập nhật token màu trong `globals.css` (đen/trắng + accent blue) - Đã hoàn thành.
- [x] `footer.tsx`: bỏ hardcode `bg-slate-950 / text-white / text-slate-*` - Đã hoàn thành.
- [x] `chat-widget.tsx`: khung chat dùng token thay `bg-slate-950 / border-slate-800` - Đã hoàn thành.
- [x] `cart/page.tsx`: thay `text-white / text-slate-500 / text-emerald-400` - Đã hoàn thành.
- [x] `checkout/page.tsx`: thay `text-white / bg-slate-800 / border-red-500` - Đã hoàn thành.
- [x] `checkout-success/page.tsx`: thay toàn bộ slate/blue hardcode - Đã hoàn thành.
- [x] `account/page.tsx`: thay toàn bộ slate/blue hardcode - Đã hoàn thành.
- [x] `auth/login` + `auth/register`: thay nền gradient slate + input slate - Đã hoàn thành.

## C. Bổ sung chức năng TMĐT
- [x] **Trang tài khoản hoàn thiện**: tab Hồ sơ cho sửa Họ tên / SĐT / Địa chỉ + tab Đổi mật khẩu - Đã hoàn thành.
- [x] **Route `/auth/callback`** xử lý OAuth Google trở về - Đã hoàn thành.
- [x] **Quên mật khẩu**: trang `/auth/forgot-password` (gửi email) + `/auth/reset-password` (đặt lại) - Đã hoàn thành.
- [x] **Trang Admin `/admin`**: thêm/sửa/xóa sản phẩm + xem đơn hàng (đơn giản) - Đã hoàn thành.
- [x] **Trang chủ**: banner carousel nhiều slide + section "Sản phẩm mới" - Đã hoàn thành.

## D. Kiểm thử
- [x] Kiểm tra giao diện ở cả Light & Dark trên các trang chính (browser) - Đã hoàn thành.
- [x] Kiểm tra luồng: xem SP → thêm giỏ → checkout (COD/Stripe mock) → success → account - Đã hoàn thành.

---

## E. Agentic RAG — Phần tự làm (Python / FastAPI)

> Đây là trọng tâm học thuật, phần web TMĐT (A–D) đã xong để RAG có dữ liệu thật mà dùng.
> File kế hoạch chi tiết: [ke-hoach-agentic-rag-tmdt.md](./ke-hoach-agentic-rag-tmdt.md)

### E.1 Thiết kế & Kiến trúc (đọc kỹ trước khi code)
- [x] **Nguyên tắc định tuyến truy vấn (Query Routing)** đã ghi rõ tại mục 2.3.1:
  - Loại 1 (SQL trực tiếp): chỉ cho **đơn hàng, user data, thao tác ghi** — dữ liệu không nằm trong Chroma
  - Loại 2 (Vector search): **tất cả câu hỏi về sản phẩm** (kể cả giá, giảm giá cụ thể) + chính sách
  - Câu hỏi cụ thể "S22 bao nhiêu tiền?" → Loại 2 (vector tìm đúng SP, LLM đọc giá từ context)
- [x] **Cơ chế function calling**: LLM KHÔNG tự viết SQL hay truy cập DB. Bạn viết sẵn tools (hàm Python), LLM chỉ chọn tool + truyền tham số
- [x] **Vector store chính: Chroma** (thay vì pgvector) — lý do:
  - Pipeline rõ ràng từng bước (chunk → embed → index → query), dễ trình bày báo cáo
  - Dễ swap chunking strategy / embedding model / vector store backend để benchmark
  - Supabase Postgres vẫn là source of truth, Chroma là bản copy đã embedding
  - pgvector / FAISS thêm sau để benchmark so sánh (mục 3.2)
- [x] **Pipeline RAG có 2 giai đoạn tách biệt** (mục 2.3.1):
  - **OFFLINE** (chạy 1 lần): Supabase → chunk/ghép JSON→text → embed → lưu Chroma
  - **ONLINE** (mỗi câu hỏi): embed CÂU HỎI → tìm Chroma (cosine sim) → top-k → LLM trả lời
  - Chunking/embedding KHÔNG xảy ra real-time khi khách hỏi
- [x] **Xử lý 2 loại dữ liệu khác nhau**:
  - Sản phẩm (JSON): ghép trường → text → embed, **KHÔNG cần chunk** (1 SP = 1 chunk)
  - Chính sách (văn bản dài): **CẦN chunk** (200-400 từ, overlap 50 từ) → embed từng chunk
- [ ] Thiết kế schema FastAPI endpoint `/chat` (mục 2.5)
- [ ] Vẽ sơ đồ luồng xử lý agent đầy đủ (agent chọn tool → thực thi → lặp lại / trả lời)

### E.2 Chuẩn bị dữ liệu (Data Prep — OFFLINE, script `sync_data.py`)
- [ ] Viết hàm `product_to_text()` — ghép JSON sản phẩm thành đoạn text (name + brand + description + specs)
- [ ] Viết hàm `chunk_policy()` — split văn bản chính sách thành chunk 200-400 từ (có overlap)
- [ ] Script embed + lưu sản phẩm vào Chroma collection `products` (kèm metadata: price, category, brand)
- [ ] Viết 3–5 tài liệu chính sách (đổi trả, bảo hành, vận chuyển, FAQ)
- [ ] Script chunk + embed + lưu chính sách vào Chroma collection `policies`
- [ ] Tạo bộ câu hỏi test (30–50 câu) theo danh mục ở mục 3.4-a

### E.3 Xây dựng Agent & Tools (theo thứ tự ưu tiên)
- [ ] **`product_search_tool`** — query Chroma `products` collection bằng cosine similarity
- [ ] **`policy_rag_tool`** — query Chroma `policies` collection
- [ ] **`order_lookup_tool`** — SQL trực tiếp Supabase (KHÔNG qua vector), có xác thực user trước
- [ ] **Agent controller** — LLM function calling, quyết định gọi tool nào, tổng hợp kết quả
- [ ] **Guardrail chống bịa** — tự chấm điểm tài liệu, trả lời "không biết" khi cần (Corrective RAG)
- [ ] **`product_compare_tool`** — lấy specs 2–3 sản phẩm, trình bày bảng so sánh
- [ ] **`recommendation_tool`** — gợi ý theo ngân sách + nhu cầu
- [ ] **`escalate_tool`** + **Risk Classifier** (3 mức: thấp / tư vấn / tấn công) — mục 2.7
- [ ] **`staff_assist_tool`** — hỗ trợ nhân viên xử lý ticket nội bộ
- [ ] **Giới hạn vòng lặp agentic** (`max_iterations = n`) + cơ chế multi-turn (mục 2.9)

### E.4 Tích hợp & Logging
- [ ] Expose endpoint `POST /chat` (FastAPI)
- [ ] Tích hợp vào popup chat trên web Next.js (thay thế call hiện tại)
- [ ] Ghi log hội thoại vào bảng `chat_logs` bất đồng bộ (mục 2.10)

### E.5 Benchmark & Đánh giá (mục 3.1–3.4)
- [ ] Script benchmark tự động chạy bộ test (không test tay trong khung chat)
- [ ] Benchmark LLM controller: Gemini Flash / Gemma / Claude Haiku (mục 3.1)
- [ ] Benchmark embedding model: multilingual-e5-large / BGE-M3 / text-embedding-004 (mục 3.2)
- [ ] So sánh kiến trúc RAG: Hybrid → +Rerank → Corrective RAG → Agentic (mục 3.3)
- [ ] Xuất kết quả benchmark ra CSV/bảng để đưa vào báo cáo
- [ ] Benchmark vector store: Chroma (chính) vs FAISS vs pgvector — dùng cùng pipeline chunk+embed, chỉ đổi backend (mục 3.2)

### E.6 Mở rộng (nếu còn thời gian — mục 5)
- [ ] *(Nâng cao)* Finetune model nhỏ local với KD/DPO (mục 2.8, 5.1)
- [ ] *(Nâng cao)* Diffusion LLM cho bước viết câu trả lời cuối (mục 3.5)
- [ ] *(Nâng cao)* RAG cho nhân viên hỏi đáp nội bộ (mục 5.2)

