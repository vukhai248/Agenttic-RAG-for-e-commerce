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
