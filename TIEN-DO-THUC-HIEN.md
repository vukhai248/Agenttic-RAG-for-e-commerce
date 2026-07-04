# Tiến độ trùng tu & bổ sung chức năng — Antigravity E-Shop

> File theo dõi công việc phần **giao diện + chức năng TMĐT** (phần RAG/agent do chủ dự án tự làm).
> Cập nhật: mỗi khi hoàn thành 1 hạng mục thì đánh dấu `[x]`.

## Quyết định thiết kế
- Theme: giữ **cả Light + Dark**, đồng bộ hoàn toàn qua design token trong `globals.css`.
- Phong cách: **đen/trắng tối giản + 1 accent màu xanh dương (blue)** cho CTA, giá, link, badge.
- Dữ liệu: dùng **fallback tĩnh** để hoàn thiện UI trước; tích hợp Supabase/seed để sau.

---

## A. Sửa bug kỹ thuật (ưu tiên cao)
- [ ] `chat-widget.tsx`: bỏ thuộc tính `className` bị trùng trên `<div>` tin nhắn (JSX lỗi).
- [ ] Class Tailwind không tồn tại (bị bỏ qua âm thầm), cần thay bằng class hợp lệ / token:
  - [ ] `text-yellow-550` (products/page.tsx)
  - [ ] `text-yellow-450` (account/page.tsx)
  - [ ] `text-slate-350` (products/[id]/page.tsx — 2 chỗ, có chỗ trùng lặp)
  - [ ] `text-slate-450` (account/page.tsx — trùng với text-slate-400)
  - [ ] `border-slate-850`, `bg-slate-850` (account, auth)
- [ ] `checkout-success`: literal `**Antigravity E-Shop**` hiển thị dấu sao — bỏ markdown thừa.
- [ ] `checkout/page.tsx`: `router.push('/cart')` gọi trong render khi giỏ trống → chuyển vào `useEffect`.
- [ ] `auth/login`: OAuth Google trỏ `/auth/callback` nhưng route chưa tồn tại → tạo route callback.

## B. Đồng bộ giao diện theo token (Light + Dark)
- [ ] Cập nhật token màu trong `globals.css` (đen/trắng + accent blue).
- [ ] `footer.tsx`: bỏ hardcode `bg-slate-950 / text-white / text-slate-*`.
- [ ] `chat-widget.tsx`: khung chat dùng token thay `bg-slate-950 / border-slate-800`.
- [ ] `cart/page.tsx`: thay `text-white / text-slate-500 / text-emerald-400`.
- [ ] `checkout/page.tsx`: thay `text-white / bg-slate-800 / border-red-500`.
- [ ] `checkout-success/page.tsx`: thay toàn bộ slate/blue hardcode.
- [ ] `account/page.tsx`: thay toàn bộ slate/blue hardcode.
- [ ] `auth/login` + `auth/register`: thay nền gradient slate + input slate.

## C. Bổ sung chức năng TMĐT
- [ ] **Trang tài khoản hoàn thiện**: tab Hồ sơ cho sửa Họ tên / SĐT / Địa chỉ + tab Đổi mật khẩu.
- [ ] **Route `/auth/callback`** xử lý OAuth Google trở về.
- [ ] **Quên mật khẩu**: trang `/auth/forgot-password` (gửi email) + `/auth/reset-password` (đặt lại).
- [ ] **Trang Admin `/admin`**: thêm/sửa/xóa sản phẩm + xem đơn hàng (đơn giản).
- [ ] **Trang chủ**: banner carousel nhiều slide + section "Sản phẩm mới".

## D. Kiểm thử
- [ ] Kiểm tra giao diện ở cả Light & Dark trên các trang chính (browser).
- [ ] Kiểm tra luồng: xem SP → thêm giỏ → checkout (COD/Stripe mock) → success → account.
