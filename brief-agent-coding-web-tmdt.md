# BRIEF CHO AI CODING AGENT: WEB TMĐT ĐIỆN TỬ

> File này dành để đưa trực tiếp cho AI coding agent (Cursor / Claude Code / v0 / Lovable / Bolt...) làm theo.
> Đây **không phải** bản kế hoạch tổng (đã có ở file `ke-hoach-agentic-rag-tmdt.md` — file đó là để người phụ trách đọc/theo dõi/log tiến độ).
> Phần **Agentic RAG (Python, service riêng)** do người phụ trách tự viết tay, **không nằm trong phạm vi việc của agent này**. Agent chỉ cần build đúng Web TMĐT + 1 điểm tích hợp API `/chat` (có thể mock tạm) để sau này người phụ trách cắm service RAG thật vào.

---

## 1. Yêu cầu tổng quát

Xây dựng website thương mại điện tử bán đồ điện tử (laptop, điện thoại, đồng hồ thông minh, tai nghe, phụ kiện) bằng:
- **Next.js 14+ (App Router) + TypeScript**
- **Tailwind CSS + shadcn/ui**
- **Zustand** (hoặc React Context) cho state giỏ hàng
- **Supabase** cho database (Postgres) + Auth (email/password + Google OAuth) + Storage (ảnh sản phẩm)
- **Stripe Checkout (test mode)** cho thanh toán
- Deploy: **Vercel**

Không cần tự dựng backend riêng ngoài Supabase — mọi logic dữ liệu đi qua Supabase client/API routes của Next.js.

---

## 2. Database schema (tạo trong Supabase)

### Bảng `products`
| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | khóa chính |
| category | text | laptop / phone / smartwatch / earphone / accessory |
| brand | text | Apple, Samsung, Dell, Sony... |
| name | text | tên sản phẩm |
| price | numeric | giá VNĐ |
| stock | integer | tồn kho |
| description | text | mô tả dài |
| specs | jsonb | thông số kỹ thuật dạng key-value, linh hoạt theo loại sản phẩm |
| images | text[] | danh sách URL ảnh |
| rating_avg | numeric | điểm đánh giá trung bình |
| created_at | timestamp | |

Cấu trúc `specs` (jsonb) gợi ý theo từng danh mục — **giữ đúng format này** vì có ý nghĩa cho phần tra cứu/so sánh sau này:

```json
// Laptop
{"cpu": "Intel Core i7-14700H", "ram": "16GB", "storage": "512GB SSD", "screen": "15.6 inch FHD", "gpu": "RTX 4060", "battery": "70Wh", "weight": "2.1kg"}

// Điện thoại
{"chip": "Snapdragon 8 Gen 3", "ram": "12GB", "storage": "256GB", "screen": "6.7 inch AMOLED", "battery": "5000mAh", "camera": "50MP+12MP+10MP"}

// Tai nghe
{"battery_life": "30 giờ (kèm hộp sạc)", "anc": true, "connection": "Bluetooth 5.3", "waterproof": "IPX4"}

// Đồng hồ thông minh
{"battery_life": "18 giờ", "display": "AMOLED 1.5 inch", "waterproof": "5ATM", "compatible": "iOS/Android"}
```

### Các bảng khác
- `orders` (id, user_id, status, items, total, created_at, shipping_address)
- `reviews` (id, product_id, user_id, rating, comment, created_at)
- `support_tickets` (id, customer_id, order_id nullable, category [advisory/negotiation/technical/attack_flagged/other], risk_level [low/medium/high], created_by [agent/staff/customer], status [open/in_progress/resolved], assigned_staff_id nullable, note, created_at)
- `chat_logs` (id, session_id, user_id nullable, role [user/agent/tool/system], message, tool_used nullable, risk_level nullable, created_at)

> `support_tickets` và `chat_logs` chỉ cần **tạo bảng đúng schema**, chưa cần logic nghiệp vụ — service RAG (Python, làm riêng) sẽ đọc/ghi 2 bảng này sau. Agent chỉ cần đảm bảo bảng tồn tại đúng cấu trúc trong Supabase.

Seed sẵn **30–50 sản phẩm mẫu** thực tế (có mô tả + specs đầy đủ theo đúng format trên) để có dữ liệu chạy demo.

---

## 3. Danh sách trang & chức năng cần build

### A. Trang chủ (Home)
- Banner khuyến mãi (carousel, dữ liệu tĩnh/giả lập)
- Danh mục nổi bật: Laptop / Điện thoại / Đồng hồ thông minh / Tai nghe / Phụ kiện
- Section "Sản phẩm bán chạy", "Sản phẩm mới"
- Header: logo, thanh tìm kiếm, icon giỏ hàng (badge số lượng), icon tài khoản, menu danh mục
- Footer: thông tin liên hệ + link các trang chính sách (đổi trả, bảo hành, vận chuyển)

### B. Thanh tìm kiếm
- Tìm theo tên sản phẩm/thương hiệu, luôn hiển thị ở header
- Autocomplete đơn giản (query DB theo tên gần đúng, không cần AI)
- Trang kết quả tìm kiếm dạng lưới sản phẩm

### C. Trang danh sách sản phẩm theo danh mục
- Filter: khoảng giá, thương hiệu, thông số riêng theo loại (RAM/CPU cho laptop, pin cho tai nghe...)
- Sort: giá tăng/giảm, mới nhất, đánh giá cao nhất
- Phân trang hoặc infinite scroll

### D. Trang chi tiết sản phẩm
- Ảnh (nhiều ảnh, zoom được)
- Tên, giá, tình trạng kho
- Bảng thông số kỹ thuật đầy đủ (lấy từ `specs`)
- Mô tả chi tiết
- Rating trung bình + danh sách review
- Nút "Thêm vào giỏ", "Mua ngay"
- Sản phẩm liên quan/gợi ý cùng danh mục

### E. Giỏ hàng
- Danh sách sản phẩm đã thêm, sửa số lượng, xóa
- Tự tính tổng tiền
- Nút "Tiến hành thanh toán"

### F. Thanh toán (Checkout)
1. Nhập/chọn địa chỉ giao hàng
2. Chọn phương thức thanh toán (COD giả lập / Stripe test card)
3. Xác nhận → tạo order trong Supabase → chuyển trang "Đặt hàng thành công"

### G. Đăng ký / Đăng nhập
- Email + mật khẩu (Supabase Auth)
- Đăng nhập Google (Supabase Auth OAuth — bật trong dashboard Supabase, cần Client ID/Secret từ Google Cloud Console do người dùng tự cấp)
- Quên mật khẩu (flow reset password có sẵn của Supabase)

### H. Trang tài khoản
- Tab "Thông tin cá nhân": xem/sửa tên, số điện thoại, địa chỉ
- Tab "Đơn hàng của tôi": danh sách + trạng thái (Đang xử lý/Đang giao/Đã giao/Đã hủy) + chi tiết từng đơn
- Tab "Đổi mật khẩu"

### I. Popup chat hỗ trợ khách hàng (widget) — **điểm tích hợp với RAG service**
- Icon chat nổi góc dưới phải, hiển thị mọi trang
- Click mở cửa sổ chat: khung tin nhắn (kiểu Messenger/Zalo), ô nhập, nút gửi
- Tin nhắn chào mừng mặc định khi mở lần đầu: *"Xin chào! Mình có thể giúp gì cho bạn về sản phẩm, đơn hàng hoặc chính sách?"*
- Gọi API theo đúng contract dưới đây, hiển thị `reply` trả về (hỗ trợ render markdown/link sản phẩm nếu có)
- Lưu lịch sử chat theo session (localStorage tạm là đủ)
- *(Nếu còn thời gian)*: nút "Yêu cầu gặp nhân viên" — chỉ cần hiển thị trạng thái "đã chuyển cho nhân viên" (giả lập UI, không cần hệ thống nhân viên thật)

**Contract API mà widget phải gọi (RAG service sẽ implement sau, agent chỉ cần gọi đúng format này):**
```
POST {NEXT_PUBLIC_RAG_SERVICE_URL}/chat
Body: { "message": "...", "session_id": "...", "user_token": "..." (optional, kèm nếu user đã đăng nhập) }
Response: { "reply": "...", "tool_used": "...", "sources": [...] (optional) }
```
- Trong lúc RAG service chưa sẵn sàng, **tạo 1 route mock** (`/api/chat` trong Next.js hoặc endpoint giả) trả về response tĩnh đúng format trên, để UI chat chạy được ngay và test được luồng end-to-end. Khi RAG service thật xong, chỉ cần đổi `NEXT_PUBLIC_RAG_SERVICE_URL` trỏ sang service Python thật — **không sửa code frontend**.

### J. *(Tùy chọn nếu dư thời gian)* Trang Admin đơn giản
- Thêm/sửa/xóa sản phẩm (dùng để chuẩn bị dữ liệu mẫu)
- Xem danh sách đơn hàng

---

## 4. Biến môi trường cần thiết lập

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_RAG_SERVICE_URL=   # tạm trỏ tới route mock nội bộ, sau đổi sang service Python thật
```

---

## 5. Thứ tự build đề xuất (7–9 ngày)

| Ngày | Việc |
|---|---|
| 1 | Khởi tạo project Next.js + Supabase, tạo schema DB (mục 2), seed 30–50 sản phẩm mẫu |
| 2 | Trang chủ + Header/Footer + danh mục sản phẩm |
| 3 | Trang danh sách sản phẩm + filter/sort + thanh tìm kiếm |
| 4 | Trang chi tiết sản phẩm + đánh giá |
| 5 | Giỏ hàng + Checkout + Stripe test mode |
| 6 | Đăng ký/Đăng nhập + Đăng nhập Google + Trang tài khoản |
| 7 | Popup chat widget (UI đầy đủ + gọi route mock `/api/chat` theo đúng contract mục 3.I) |
| 8–9 | Đệm: sửa lỗi, deploy Vercel, viết 2–3 trang chính sách tĩnh (đổi trả, bảo hành, vận chuyển) |

---

## 6. Checklist hoàn thành (Definition of Done)
- [ ] Toàn bộ trang ở mục 3 (A–I) chạy được, không lỗi console
- [ ] Auth (email + Google) hoạt động, có thể đăng ký/đăng nhập/đăng xuất/reset password
- [ ] Luồng mua hàng end-to-end: chọn sản phẩm → giỏ hàng → checkout → tạo order → xem trong "Đơn hàng của tôi"
- [ ] 30–50 sản phẩm mẫu có đủ `description` + `specs` đúng format ở mục 2
- [ ] 4 bảng phụ (`orders`, `reviews`, `support_tickets`, `chat_logs`) đã tạo đúng schema trong Supabase, kể cả khi chưa có logic dùng tới
- [ ] Popup chat gọi đúng contract `POST /chat` (mục 3.I), hoạt động với route mock, và **chỉ cần đổi 1 biến môi trường** để chuyển sang RAG service thật
- [ ] Deploy thành công lên Vercel
- [ ] Có 2–3 trang chính sách tĩnh (đổi trả, bảo hành, vận chuyển) — dùng làm nguồn dữ liệu cho RAG sau này, nên viết nội dung thật, không để placeholder "lorem ipsum"
