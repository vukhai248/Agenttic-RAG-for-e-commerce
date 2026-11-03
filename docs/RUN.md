# 🚀 Hướng Dẫn Cài Đặt & Chạy Local — Agentic RAG E-Commerce

Tài liệu hướng dẫn triển khai và vận hành hệ thống cục bộ (local) dành cho nhà phát triển và kiểm thử viên.

---

## 1. 🏗️ Tổng quan kiến trúc hệ thống

```text
               ┌────────────────────────────────────────────────────────┐
               │         Frontend: Next.js 16 (App Router)              │
               │         URL: http://localhost:3000                     │
               └───────────────────┬────────────────────────────────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────────────┐
        │  Backend RAG Service: FastAPI + LangGraph Workflow           │
        │  URL: http://127.0.0.1:8080                                  │
        └──────────────┬───────────────────────────────┬───────────────┘
                       │                               │
                       ▼                               ▼
        ┌─────────────────────────────┐  ┌─────────────────────────────┐
        │  Supabase Cloud (PostgreSQL)│  │  ChromaDB (Local Vector DB) │
        │  Dữ liệu sản phẩm, đơn hàng,│  │  Embeddings cho sản phẩm   │
        │  chính sách, review, auth   │  │  và chính sách cửa hàng     │
        └─────────────────────────────┘  └─────────────────────────────┘
```

- **Frontend (`web_ui/`)**: Next.js 16 (React 19, Tailwind CSS v4, Zustand, Lucide icons), tích hợp chat-widget hỏi đáp sản phẩm và chính sách.
- **Backend (`rag-service/`)**: FastAPI, LangGraph `workflow_1` (Multi-turn Agentic RAG, Gemini / Groq LLM, tools: `product_search`, `product_compare`, `policy_search`, `order_lookup`).
- **Cơ sở dữ liệu quan hệ**: Supabase (PostgreSQL với Row-Level Security - RLS).
- **Cơ sở dữ liệu vector**: ChromaDB lưu trữ cục bộ tại `database/chroma_db/`.

---

## 2. ⚙️ Yêu cầu môi trường tiên quyết (Prerequisites)

- **Hệ điều hành**: Windows 10/11 (khuyến nghị dùng PowerShell) hoặc Linux/macOS.
- **Node.js**: Phiên bản `>= 20.x` (khuyến nghị dùng `npm.cmd` trên Windows nếu lệnh `npm` gặp xung đột).
- **Python**: Phiên bản `3.11 - 3.13`. Khuyến nghị môi trường Conda tên `DL` (hoặc virtualenv).
- **Trình duyệt**: Google Chrome hoặc Microsoft Edge (cho kiểm thử E2E).

> [!IMPORTANT]
> **Lưu ý đặc biệt trên Windows:**
> Trước khi khởi chạy `rag-service`, bắt buộc phải đặt biến môi trường `$env:PYTHONUTF8=1` để tránh lỗi `UnicodeEncodeError: 'charmap'` khi pipeline ghi log có chứa ký tự đặc biệt hoặc emoji.

---

## 3. 🔑 Cấu hình biến môi trường

### 3.1 Backend (`rag-service/.env`)
Sao chép mẫu cấu hình từ `rag-service/.env.example` sang `rag-service/.env`:

```bash
cd rag-service
copy .env.example .env
```

Điền các thông tin cấu hình vào `rag-service/.env`:

| Tên biến | Bắt buộc | Mô tả |
| :--- | :--- | :--- |
| `PORT` | Có | Cổng backend (mặc định: `8080`). |
| `HOST` | Có | Địa chỉ lắng nghe (mặc định: `0.0.0.0` hoặc `127.0.0.1`). |
| `DEBUG` | Có | Chế độ debug (khuyến nghị: `True` khi chạy local). |
| `SUPABASE_URL` | Có | URL project Supabase (dạng: `https://<project-id>.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Có | Secret API Key quyền cao của Supabase để backend truy vấn DB. |
| `SUPABASE_ANON_KEY` | Có | Public Anon Key của Supabase để verify token client. |
| `GEMINI_API_KEY` | Có | Google Gemini API Key để chạy mô hình ngôn ngữ cho Master Agent. |
| `GROQ_API_KEY` | Tùy chọn | Groq API Key dự phòng khi chuyển đổi LLM provider. |
| `VECTOR_DB_DIR` | Có | Đường dẫn tương đối hoặc tuyệt đối tới ChromaDB (mặc định: `../database/chroma_db`). |
| `LEGACY_LLM_GUARDRAIL` | Tùy chọn | Cơ chế guardrail LLM cũ (giá trị: `on` / `off`, mặc định: `on`). |
| `LEGACY_PROMPT_DEFENSE` | Tùy chọn | Bộ lọc phòng vệ prompt injection cũ (giá trị: `on` / `off`, mặc định: `on`). |
| `FOX_GUARD_MODE` | Tùy chọn | Chế độ bảo vệ FOX-Guardrails (giá trị: `off` / `baseline` / `guard`, mặc định: `off`). |
| `FOX_GUARD_ARM` | Tùy chọn | Tên cụm kiểm nghiệm FOX-Guardrails phục vụ A/B testing đối chuẩn. |
| `BENCH_RECORD` | Tùy chọn | Bật/tắt ghi dữ liệu đánh giá benchmark vào cơ sở dữ liệu (`true` / `false`). |
| `BENCH_TEMPERATURE` | Tùy chọn | Nhiệt độ lấy mẫu (sampling temperature) cho LLM khi chạy benchmark (ví dụ: `0.0`). |

### 3.2 Frontend (`web_ui/.env.local`)
Sao chép mẫu cấu hình từ `web_ui/.env.example` sang `web_ui/.env.local`:

```bash
cd web_ui
copy .env.example .env.local
```

Điền các thông tin cấu hình vào `web_ui/.env.local`:

| Tên biến | Bắt buộc | Mô tả |
| :--- | :--- | :--- |
| `APP_URL` | Có | URL gốc của website frontend (mặc định: `http://localhost:3000`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Có | URL Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Có | Public Key của Supabase dùng trên giao diện web. |
| `SUPABASE_SERVICE_ROLE_KEY` | Có | Service Role Key dùng trong các API route phân quyền phía server. |
| `NEXT_PUBLIC_RAG_SERVICE_URL` | Có | URL trỏ tới FastAPI backend (mặc định: `http://localhost:8080/chat`). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Có | Public Key Stripe Test Mode (`pk_test_...`). |
| `STRIPE_SECRET_KEY` | Có | Secret Key Stripe Test Mode (chỉ sử dụng khóa bắt đầu bằng `sk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | Có | Signing secret của Stripe Webhook (bắt đầu bằng `whsec_...`). |
| `NEXT_PUBLIC_ALLOW_MOCK_CHAT` | Tùy chọn | Mặc định `false`. Nếu bật `true`, khi backend sập thì frontend trả lời giả lập. |
| `NEXT_PUBLIC_ALLOW_MOCK_ADMIN` | Tùy chọn | Mặc định `false`. Chỉ dùng dữ liệu thật, không đổ số liệu giả trong admin. |
| `NEXT_PUBLIC_SAFE_RENDER` | Tùy chọn | Mặc định `true`. Bật chế độ render an toàn, chặn link ngoài và ẩn ảnh lạ. |

#### Chuyển tiếp Stripe Webhook khi chạy Local
Để nhận sự kiện webhook thanh toán Stripe (`payment_intent.succeeded`) trên môi trường phát triển local, sử dụng Stripe CLI:
```powershell
# 1. Đăng nhập Stripe CLI
stripe login

# 2. Lắng nghe và chuyển tiếp webhook về endpoint Next.js
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
> [!TIP]
> Terminal sẽ in ra dòng: `Your webhook signing secret is whsec_...`. Sao chép mã secret này vào biến `STRIPE_WEBHOOK_SECRET` trong file `web_ui/.env.local`.

> [!CAUTION]
> Tuyệt đối **không commit các file `.env` hoặc `.env.local`** lên repository Git để tránh lộ thông tin bảo mật và secret key.

---

## 4. 🚀 Hướng dẫn khởi chạy từng bước

### 4.1 Khởi động Backend RAG Service

Mở một cửa sổ PowerShell mới tại thư mục gốc dự án:

```powershell
# 1. Chuyển vào thư mục backend
cd "d:\create\DATN\Agenttic-RAG-for-e-commerce\rag-service"

# 2. Cài đặt các thư viện Python (nếu chưa cài)
conda run -n DL pip install -r requirements.txt

# 3. Kích hoạt UTF-8 và khởi chạy server trên cổng 8080
$env:PYTHONUTF8=1
conda run -n DL uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

**Kiểm tra sức khỏe Backend:**
Mở trình duyệt hoặc PowerShell khác và gọi:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/health" -Method Get | ConvertTo-Json
```
Kết quả phản hồi mong đợi:
```json
{
  "status": "healthy",
  "service": "rag-service",
  "debug_mode": true,
  "supabase_connected": true,
  "chroma_connected": true,
  "chroma_products_count": 1325
}
```

---

### 4.2 Khởi động Frontend Web

Mở một cửa sổ PowerShell khác tại thư mục gốc dự án:

```powershell
# 1. Chuyển vào thư mục web_ui
cd "d:\create\DATN\Agenttic-RAG-for-e-commerce\web_ui"

# 2. Cài đặt gói dependencies
npm.cmd install

# 3. Khởi chạy Next.js development server
npm.cmd run dev
```

Giao diện web sẵn sàng phục vụ tại: **`http://localhost:3000`**.

Để kiểm tra build production hoàn chỉnh:
```powershell
npm.cmd run build
```

---

## 5. 🗄️ Quản lý Cơ sở dữ liệu & ChromaDB

### 5.1 Quy trình thực thi Migration an toàn
> [!CAUTION]
> **CẢNH BÁO NGUY HIỂM VỀ DỮ LIỆU**:
> 1. Tuyệt đối **KHÔNG BAO GIỜ CHẠY LẠI file `database/setup.sql`** trên cơ sở dữ liệu Supabase đang hoạt động. File này chứa các lệnh `DROP TABLE ... CASCADE` sẽ xóa vĩnh viễn toàn bộ dữ liệu sản phẩm, đơn hàng và tài khoản!
> 2. File migration mới: `database/migrations/2026-11_payment_and_address.sql` **do chủ đồ án chạy** trực tiếp trên Supabase SQL Editor.
> 3. **Thời điểm thực thi**: **CHỈ CHẠY SAU KHI ĐÃ MERGE FRONTEND** vào nhánh chính. Lý do: Migration này sẽ thu hồi quyền `INSERT` trực tiếp vào bảng `orders` từ phía client (`REVOKE INSERT ON orders FROM authenticated, anon`) và chuyển toàn bộ việc tạo đơn/trừ kho sang hàm RPC bảo mật phía server. Nhánh frontend (`feat/a-frontend`) đã được hoàn thiện để gọi API server, nên chỉ khi code frontend đã merge thì hệ thống mới hoạt động trơn tru.
> 4. **Sao lưu trước khi chạy**: Thực hiện xuất backup dữ liệu bảng `orders` hiện tại trước khi bấm chạy migration.

### 5.2 Dữ liệu Vector ChromaDB
- ChromaDB đã được nạp sẵn dữ liệu vector của hơn 1.300 sản phẩm và bộ quy tắc chính sách tại thư mục: `database/chroma_db/`.
- Nếu cần nạp lại từ đầu từ nguồn dữ liệu thô:
  ```powershell
  cd "d:\create\DATN\Agenttic-RAG-for-e-commerce\rag-service"
  $env:PYTHONUTF8=1
  conda run -n DL python scripts/ingest.py
  ```

---

## 6. 🧪 Kiểm tra hoạt động ban đầu (Smoke Test)

### 6.1 Test Chat API Trực tiếp qua PowerShell
```powershell
$jsonStr = '{"message":"Shop có những chính sách đổi trả nào?", "session_id":"smoke-test-1"}'
$bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
Invoke-RestMethod -Uri "http://127.0.0.1:8080/chat" -Method Post -Body $bytes -ContentType "application/json; charset=utf-8" | ConvertTo-Json -Depth 5
```
Backend sẽ trả về phản hồi chi tiết với `tool_used: "policy_search"` và câu trả lời chính sách đổi trả 30 ngày.

### 6.2 Test Giao diện Web Người dùng
1. Mở trình duyệt truy cập `http://localhost:3000`.
2. Kiểm tra danh sách sản phẩm hiển thị trên trang chủ.
3. Nhấp vào biểu tượng Chat Widget ở góc dưới bên phải màn hình.
4. Gửi câu hỏi: *"iPhone 15 Pro Max có giá bao nhiêu?"*.
5. Kiểm tra bot phản hồi đúng thông số và giá từ cơ sở dữ liệu.
