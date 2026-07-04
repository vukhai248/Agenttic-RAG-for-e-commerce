'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/store/useCart';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, ArrowRight, ShoppingBag, Eye } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const statusParam = searchParams.get('status') || ''; // 'cod' hoặc null/stripe
  const sessionId = searchParams.get('session_id') || '';
  const userId = searchParams.get('user_id') || '00000000-0000-0000-0000-000000000000';
  const address = searchParams.get('address') || '';

  const clearCart = useCart((state) => state.clearCart);
  
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleOrderSuccess = async () => {
      // 1. Nếu là đơn hàng COD:
      if (statusParam === 'cod') {
        // Đơn hàng COD đã được ghi vào DB ở trang Checkout
        // Chỉ cần dọn sạch giỏ hàng và hoàn tất
        clearCart();
        setIsProcessing(false);
        return;
      }

      // 2. Nếu là đơn hàng thanh toán qua Stripe (Stripe chuyển hướng về thành công):
      if (sessionId) {
        try {
          const tempItemsRaw = localStorage.getItem('temp_checkout_items');
          if (tempItemsRaw) {
            const tempItems = JSON.parse(tempItemsRaw);
            const total = tempItems.reduce((acc: number, cur: any) => acc + cur.price * cur.quantity, 0);

            // Kiểm tra xem đơn hàng cho session này đã tồn tại chưa để tránh trùng lặp khi reload trang
            const { data: existingOrder } = await supabase
              .from('orders')
              .select('id')
              .eq('shipping_address', decodeURIComponent(address))
              .eq('total', total)
              .limit(1);

            if (existingOrder && existingOrder.length > 0) {
              setOrderId(existingOrder[0].id);
              clearCart();
              localStorage.removeItem('temp_checkout_items');
              setIsProcessing(false);
              return;
            }

            // Ghi nhận đơn hàng thành công từ Stripe vào database Supabase
            const { data: newOrder, error } = await supabase
              .from('orders')
              .insert({
                user_id: userId,
                status: 'processing', // Stripe đã nhận thanh toán thành công
                items: tempItems.map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  image: item.image,
                })),
                total: total,
                shipping_address: decodeURIComponent(address),
              })
              .select('id')
              .single();

            if (error) {
              console.error('Lỗi khi ghi nhận đơn hàng Stripe vào DB:', error);
            } else if (newOrder) {
              setOrderId(newOrder.id);
            }
          }
        } catch (e) {
          console.error('Lỗi phân tích dữ liệu giỏ hàng tạm:', e);
        } finally {
          clearCart();
          localStorage.removeItem('temp_checkout_items');
          setIsProcessing(false);
        }
      } else {
        setIsProcessing(false);
      }
    };

    handleOrderSuccess();
  }, [statusParam, sessionId, userId, address]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center gap-8 max-w-lg text-center">
      {isProcessing ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400">Đang xác thực và ghi nhận đơn hàng...</span>
        </div>
      ) : (
        <>
          {/* Icon Thành Công */}
          <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 animate-bounce">
            <CheckCircle2 className="w-16 h-16" />
          </div>

          {/* Tiêu đề thông báo */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Đặt hàng thành công!</h1>
            <p className="text-slate-400 text-sm">
              Cảm ơn quý khách đã tin tưởng và mua sắm tại **Antigravity E-Shop**. Đơn hàng của bạn đã được xác nhận thành công và đang được chuẩn bị đóng gói.
            </p>
          </div>

          {/* Chi tiết đơn hàng */}
          <div className="w-full p-6 rounded-2xl border border-slate-900 bg-slate-900/20 text-left text-xs sm:text-sm space-y-3">
            <h3 className="font-bold text-white border-b border-slate-800 pb-2">Chi tiết giao hàng</h3>
            {orderId && (
              <div className="flex justify-between">
                <span className="text-slate-500">Mã đơn hàng (DB):</span>
                <span className="text-white font-mono font-bold truncate max-w-[200px]">{orderId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Hình thức thanh toán:</span>
              <span className="text-white font-semibold">
                {statusParam === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thẻ tín dụng (Stripe Online)'}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 block">Địa chỉ nhận hàng:</span>
              <p className="text-white bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 text-xs leading-relaxed">
                {decodeURIComponent(address) || 'Thông tin địa chỉ chưa cập nhật'}
              </p>
            </div>
          </div>

          {/* Các nút điều hướng */}
          <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
            <Link
              href="/account"
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-350 hover:text-white font-bold transition-all text-xs sm:text-sm"
            >
              <Eye className="w-4 h-4" />
              <span>Đơn hàng của tôi</span>
            </Link>
            <Link
              href="/products"
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all text-xs sm:text-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tiếp tục mua sắm</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
