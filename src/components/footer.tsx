import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-sm mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* CỘT 1: THƯƠNG HIỆU */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <span className="bg-gradient-to-r from-blue-500 to-indigo-600 px-2 py-1 rounded text-white text-xs font-bold shadow-md shadow-blue-500/20">
                AG
              </span>
              Antigravity E-Shop
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Trang web thương mại điện tử chuyên nghiệp cung cấp các thiết bị công nghệ chính hãng hàng đầu Việt Nam. Tích hợp giải pháp AI hỗ trợ 24/7.
            </p>
          </div>

          {/* CỘT 2: HỖ TRỢ KHÁCH HÀNG */}
          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/policy/warranty" className="hover:text-white transition-colors">
                  Chính sách bảo hành
                </Link>
              </li>
              <li>
                <Link href="/policy/return" className="hover:text-white transition-colors">
                  Chính sách đổi trả & hoàn tiền
                </Link>
              </li>
              <li>
                <Link href="/policy/shipping" className="hover:text-white transition-colors">
                  Chính sách vận chuyển & đồng kiểm
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 3: SẢN PHẨM MỚI */}
          <div>
            <h4 className="text-white font-semibold mb-4">Danh mục sản phẩm</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/products?category=laptop" className="hover:text-white transition-colors">
                  Máy tính xách tay Laptop
                </Link>
              </li>
              <li>
                <Link href="/products?category=phone" className="hover:text-white transition-colors">
                  Điện thoại thông minh
                </Link>
              </li>
              <li>
                <Link href="/products?category=smartwatch" className="hover:text-white transition-colors">
                  Đồng hồ thông minh
                </Link>
              </li>
              <li>
                <Link href="/products?category=earphone" className="hover:text-white transition-colors">
                  Tai nghe không dây
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 4: LIÊN HỆ */}
          <div className="space-y-2 text-xs">
            <h4 className="text-white font-semibold mb-4">Thông tin liên hệ</h4>
            <p className="text-slate-400">📍 Địa chỉ: 123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội</p>
            <p className="text-slate-400">📞 Hotline: 1900 6789 (Hỗ trợ 8:00 - 21:00)</p>
            <p className="text-slate-400">✉️ Email: support@antigravity-eshop.com</p>
          </div>
        </div>

        {/* BẢN QUYỀN */}
        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} Antigravity E-Shop. Tất cả các quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <span className="text-slate-600 hover:text-slate-400 cursor-pointer">Điều khoản dịch vụ</span>
            <span className="text-slate-600 hover:text-slate-400 cursor-pointer">Bảo mật thông tin</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
