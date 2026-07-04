'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/useCart';
import { supabase } from '@/lib/supabase';
import { CreditCard, Truck, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cod'>('stripe');
  
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      setIsLoadingUser(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setFullName(session.user.user_metadata?.full_name || '');
          setPhone(session.user.user_metadata?.phone || '');
        }
      } catch (err) {
        console.error('Lỗi kiểm tra auth:', err);
      } finally {
        setIsLoadingUser(false);
      }
    };

    checkUser();
  }, []);

  // Nếu giỏ hàng trống thì quay lại trang giỏ (chạy trong effect, tránh push khi render)
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin giao hàng!');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const shippingAddressText = `${fullName} - SĐT: ${phone} - ĐC: ${address}`;
      const targetUserId = user?.id || '00000000-0000-0000-0000-000000000000'; // Fallback guest ID

      if (paymentMethod === 'stripe') {
        // Luồng 1: Thanh toán qua Stripe
        const response = await fetch('/api/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items,
            user_id: targetUserId,
            shipping_address: shippingAddressText,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.url) {
          throw new Error(data.error || 'Lỗi khi kết nối cổng thanh toán Stripe');
        }

        // Chuyển hướng người dùng sang trang thanh toán Stripe (hoặc Mock Success URL)
        // Nếu là Mock Success URL, ta chuyển trực tiếp ở frontend
        if (data.isMock) {
          // Lưu tạm giỏ hàng vào localStorage để trang Success khôi phục và ghi DB
          localStorage.setItem('temp_checkout_items', JSON.stringify(items));
          router.push(data.url);
        } else {
          // Stripe thật
          localStorage.setItem('temp_checkout_items', JSON.stringify(items));
          window.location.href = data.url;
        }
      } else {
        // Luồng 2: Thanh toán COD (giao hàng thu tiền)
        // Lưu đơn hàng trực tiếp vào Supabase
        const { error } = await supabase.from('orders').insert({
          user_id: targetUserId,
          status: 'pending',
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          total: getTotalPrice(),
          shipping_address: shippingAddressText,
        });

        if (error) {
          throw new Error('Lỗi ghi đơn hàng vào cơ sở dữ liệu: ' + error.message);
        }

        // Xóa giỏ hàng và chuyển hướng về trang success
        clearCart();
        router.push(`/checkout-success?status=cod&user_id=${targetUserId}&address=${encodeURIComponent(shippingAddressText)}`);
      }
    } catch (err: any) {
      console.error('Lỗi thanh toán:', err);
      setErrorMsg(err.message || 'Có lỗi xảy ra trong quá trình xử lý thanh toán.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 flex-1 space-y-8 transition-colors duration-200">
      {/* Quay lại */}
      <div>
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại giỏ hàng</span>
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground border-b border-border pb-6">Thanh toán đơn hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái + giữa: Form nhập thông tin */}
        <form onSubmit={handleCheckout} className="lg:col-span-2 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs sm:text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoadingUser ? (
            <div className="h-10 w-full animate-pulse bg-card rounded-xl" />
          ) : !user ? (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs sm:text-sm flex items-center justify-between gap-4">
              <span>Đăng nhập giúp lưu đơn hàng vào tài khoản của bạn để tra cứu sau này.</span>
              <Link href="/auth/login" className="px-4 py-1.5 bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold rounded-lg whitespace-nowrap transition-all">
                Đăng nhập ngay
              </Link>
            </div>
          ) : null}

          {/* Form Thông tin */}
          <div className="rounded-2xl border border-border bg-card/10 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-2">1. Thông tin giao nhận hàng</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Họ và tên người nhận</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Số điện thoại liên hệ</label>
                <input
                  type="tel"
                  required
                  placeholder="09xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Địa chỉ giao hàng chi tiết</label>
              <textarea
                required
                rows={3}
                placeholder="Số nhà, ngõ hẻm, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="rounded-2xl border border-border bg-card/10 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-2">2. Phương thức thanh toán</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`p-4 rounded-xl border flex items-center justify-between text-left transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-background/40 text-muted-foreground hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-bold text-sm block">Thẻ tín dụng / Stripe</span>
                    <span className="text-[10px] text-muted-foreground">Chấp nhận Visa, Master, JCB (Test)</span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'stripe' ? 'border-primary' : 'border-border'}`}>
                  {paymentMethod === 'stripe' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-xl border flex items-center justify-between text-left transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-background/40 text-muted-foreground hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-success" />
                  <div>
                    <span className="font-bold text-sm block">Thu tiền khi nhận hàng (COD)</span>
                    <span className="text-[10px] text-muted-foreground">Kiểm tra đồng kiểm và thanh toán mặt</span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-primary' : 'border-border'}`}>
                  {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
              </button>
            </div>
          </div>
        </form>

        {/* Cột phải: Xem lại giỏ hàng */}
        <div>
          <div className="rounded-2xl border border-border bg-card/45 p-6 space-y-4 sticky top-24">
            <h2 className="text-lg font-bold text-foreground border-b border-border pb-3">Giỏ hàng của bạn</h2>
            
            {/* Danh sách items tóm tắt */}
            <div className="max-h-56 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 text-xs sm:text-sm">
                  <div className="w-12 h-12 rounded-lg bg-background border border-border p-1 flex items-center justify-center flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h4 className="font-semibold text-foreground line-clamp-1">{item.name}</h4>
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>SL: {item.quantity}</span>
                      <span className="text-primary font-bold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span className="text-foreground font-semibold">{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between">
                <span>Vận chuyển:</span>
                <span className="text-success font-semibold">Miễn phí giao hàng</span>
              </div>
            </div>

            <div className="border-t border-border pt-4 flex justify-between items-center">
              <span className="font-semibold text-foreground text-sm">Tổng thanh toán:</span>
              <span className="text-xl font-black text-primary">{formatPrice(getTotalPrice())}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-primary hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:scale-100 disabled:opacity-50 transition-all text-sm mt-4 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý đơn hàng...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận đặt hàng</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
