# Nhật ký Lỗi & Vấn đề Kỹ thuật (Bug Tracker — QA Wave 3)

**Dự án**: Agentic RAG E-Commerce & FOX-Guardrails  
**Ngày cập nhật**: 03/11/2026  
**Người thực hiện**: Antigravity (Tầng 3 — Frontend & QA)  
**Trạng thái tổng thể**: **TẤT CẢ CÁC CA ĐỀU ĐẠT (0 Functional Bug tồn đọng)**

---

## 1. 📋 Bảng Tổng hợp Lỗi theo Mức độ

| Mã lỗi | Tiêu đề | Mức độ | Phạm vi | Trạng thái |
| :--- | :--- | :---: | :---: | :---: |
| — | Không phát hiện lỗi chức năng (Functional Bug) hay lỗ hổng bảo mật (Security Flaw) | — | — | **PASSED 100%** |

---

## 2. 💡 Ghi nhận Kỹ thuật & Khắc phục Môi trường (Environmental Fixes)

### [ENV-01] Xung đột IPv6 khi Next.js gọi Backend FastAPI trên Windows
- **Mức độ**: Medium (Ảnh hưởng môi trường Windows)
- **Hiện tượng**: `POST /api/chat` trả về HTTP 503 `BACKEND_UNAVAILABLE` dù Uvicorn đang chạy trên port 8080.
- **Nguyên nhân gốc**: Node.js v20+ ưu tiên phân giải `localhost` ra địa chỉ IPv6 `::1`. Do Uvicorn được bind trên IPv4 `--host 127.0.0.1`, các kết nối tới `::1:8080` bị Windows từ chối.
- **Khắc phục**: Cập nhật biến môi trường trong `web_ui/.env.local`:
  ```env
  NEXT_PUBLIC_RAG_SERVICE_URL=http://127.0.0.1:8080/chat
  ```
- **Kết quả**: Next.js proxy kết nối trực tiếp IPv4 thành công 100%, không còn bị timeout.

### [ENV-02] Lỗi Charmap Codec khi Python Uvicorn in ký tự tiếng Việt / Emoji trên Windows
- **Mức độ**: Low (Cấu hình chạy server)
- **Hiện tượng**: Pipeline ném ngoại lệ `'charmap' codec can't encode characters` dẫn đến HTTP 500.
- **Nguyên nhân gốc**: Console codepage mặc định trên Windows (CP1258 / CP936) không hỗ trợ đầy đủ các codepoint Unicode và emoji trong log pipeline.
- **Khắc phục**: Luôn thiết lập biến môi trường `$env:PYTHONUTF8=1` trước khi khởi chạy server (đã chuẩn hóa trong `docs/RUN.md`).
- **Kết quả**: RAG service ghi log tiếng Việt có dấu và emoji hoàn toàn ổn định.
