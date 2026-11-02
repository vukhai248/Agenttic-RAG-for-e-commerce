# Yêu cầu & Bàn giao giữa các Tầng (Requests & Handoffs)

Tài liệu ghi nhận các thay đổi dùng chung hoặc các module xuyên suốt giữa Antigravity (Tầng 3 — Frontend & QA) và Codex (Tầng 2 — Backend & Tool).

---

## 1. Module Xác thực Phân quyền Quản trị: `web_ui/src/lib/server/auth.ts`
- **Người tạo**: Antigravity (theo chỉ dẫn của Claude Opus để khắc phục lỗ hổng F2 leo quyền Admin).
- **Mục đích**: Cung cấp hàm `requireRole(request, allowedRoles)` dùng Service Role Client truy vấn trực tiếp bảng **`public.user_roles`** (nguồn thẩm quyền duy nhất theo `database/setup.sql:108-113`), loại bỏ hoàn toàn việc đọc `user_metadata.role` (do client có thể tự sửa đổi).
- **Phạm vi sử dụng**:
  - `web_ui/src/app/api/admin/chat-logs/route.ts`
  - `web_ui/src/app/api/admin/orders/route.ts`
  - `web_ui/src/app/api/admin/tickets/route.ts`
  - `web_ui/src/app/api/admin/users/route.ts` (khi đổi vai trò, API thực hiện upsert vào bảng `user_roles`).
- **Ghi chú cho Codex**: Khi Codex phát triển thêm các API quản trị nội bộ hoặc đồng bộ database, vui lòng sử dụng trực tiếp module `requireRole` này để đảm bảo nhất quán và an toàn phân quyền.

---

## 2. Đặc tả Hợp đồng API Route `GET /api/admin/chat-logs`
- **Query Parameters**:
  - `session_id` hoặc `sessionId`: Lọc theo ID phiên trò chuyện.
  - `risk_level` hoặc `riskLevel`: Lọc theo mức độ rủi ro (`high`, `medium`, `low`).
  - `role`: Lọc theo vai trò (`user`, `agent`, `tool`, `system`).
  - `limit`: Số bản ghi tối đa (mặc định 100, tối đa 500).
  - `offset`: Vị trí bắt đầu phân trang (mặc định 0).
- **Định dạng Response thành công (200 OK)**:
  ```json
  {
    "chat_logs": [
      {
        "id": "uuid",
        "session_id": "string",
        "user_id": "uuid | null",
        "role": "user | agent | tool | system",
        "message": "string",
        "tool_used": "string | null",
        "risk_level": "low | medium | high | null",
        "guard_decision_ids": ["string"],
        "created_at": "ISO-8601 string"
      }
    ],
    "total": 100,
    "limit": 100,
    "offset": 0
  }
  ```
- **Định dạng Response lỗi**:
  - `401`: `{"error": {"code": "UNAUTHENTICATED", "message": "..."}}`
  - `403`: `{"error": {"code": "FORBIDDEN", "message": "..."}}`
  - `500`: `{"error": {"code": "INTERNAL_ERROR", "message": "..."}}`
