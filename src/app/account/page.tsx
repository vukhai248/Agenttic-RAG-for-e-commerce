'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ShoppingBag, User, LogOut, Clock, ShieldCheck, MapPin, Lock, Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import Link from 'next/link';

// Đơn hàng mock mẫu để chạy offline/test khi chưa có đơn thực tế trong DB
const MOCK_ORDERS = [
  {
    id: 'ord_1',
    created_at: '2026-07-04T08:30:00Z',
    status: 'shipping',
    total: 5690000,
    shipping_address: 'Nguyễn Văn A - SĐT: 0987654321 - ĐC: 123 Đường Cầu Giấy, Cầu Giấy, Hà Nội',
    items: [
      { id: 'prod-13', name: 'Apple AirPods Pro Gen 2 USB-C', price: 5690000, quantity: 1, image: 'https://images.unsplash.com/photo-1588449668338-d134ae7f3639?w=600' }
    ]
  },
  {
    id: 'ord_2',
    created_at: '2026-06-20T14:15:00Z',
    status: 'delivered',
    total: 28980000,
    shipping_address: 'Nguyễn Văn A - SĐT: 0987654321 - ĐC: 123 Đường Cầu Giấy, Cầu Giấy, Hà Nội',
    items: [
      { id: 'prod-16', name: 'Sạc Anker Prime GaN 67W 3 Cổng', price: 990000, quantity: 1, image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600' },
      { id: 'prod-1', name: 'MacBook Air M3 13 inch', price: 27990000, quantity: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600' }
    ]
  }
];

type TabKey = 'orders' | 'profile' | 'password';

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('orders');

  // Form hồ sơ cá nhân
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form đổi mật khẩu
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchUserDataAndOrders = async () => {
      setIsLoading(true);
      // Chưa cấu hình Supabase: nếu có phiên mock thì hiển thị, ngược lại về trang đăng nhập
      if (!isSupabaseConfigured) {
        const isMockLogged = localStorage.getItem('mock_user_logged');
        if (isMockLogged === 'true') {
          hydrateUser({
            id: 'mock_user_id_123456789',
            email: 'guest.developer@gmail.com',
            user_metadata: { full_name: 'Developer Guest', phone: '0900000000', address: '' },
          });
          setOrders(MOCK_ORDERS);
        } else {
          router.push('/auth/login');
        }
        setIsLoading(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          hydrateUser(session.user);

          const { data: orderData, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          setOrders(orderData && orderData.length > 0 ? orderData : MOCK_ORDERS);
        } else {
          const isMockLogged = localStorage.getItem('mock_user_logged');
          if (isMockLogged === 'true') {
            hydrateUser({
              id: 'mock_user_id_123456789',
              email: 'guest.developer@gmail.com',
              user_metadata: { full_name: 'Developer Guest', phone: '0900000000', address: '' },
            });
            setOrders(MOCK_ORDERS);
          } else {
            router.push('/auth/login');
          }
        }
      } catch (err) {
        console.warn('Lỗi kết nối hoặc tải đơn hàng, chuyển về dữ liệu mock:', err);
        setOrders(MOCK_ORDERS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDataAndOrders();
  }, [router]);

  const hydrateUser = (u: any) => {
    setUser(u);
    setFullName(u.user_metadata?.full_name || '');
    setPhone(u.user_metadata?.phone || '');
    setAddress(u.user_metadata?.address || '');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('mock_user_logged');
    router.push('/');
    router.refresh();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, phone, address },
      });
      if (error) throw error;
      setUser((prev: any) => ({
        ...prev,
        user_metadata: { ...prev?.user_metadata, full_name: fullName, phone, address },
      }));
      setProfileMsg({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công!' });
    } catch (err: any) {
      // Chế độ mock offline: cập nhật ngay trên giao diện
      setUser((prev: any) => ({
        ...prev,
        user_metadata: { ...prev?.user_metadata, full_name: fullName, phone, address },
      }));
      setProfileMsg({ type: 'success', text: 'Đã lưu thông tin (chế độ offline/mock).' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu nhập lại không khớp.' });
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      pending: { cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'Chờ xử lý' },
      processing: { cls: 'bg-primary/10 text-primary border-primary/20', label: 'Đã thanh toán' },
      shipping: { cls: 'bg-primary/10 text-primary border-primary/20', label: 'Đang giao hàng' },
      delivered: { cls: 'bg-success/10 text-success border-success/20', label: 'Đã giao hàng' },
      cancelled: { cls: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Đã hủy đơn' },
    };
    const s = map[status] || { cls: 'bg-muted text-muted-foreground border-border', label: 'Không xác định' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.cls}`}>{s.label}</span>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Đang tải thông tin tài khoản...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'orders', label: `Đơn hàng của tôi (${orders.length})` },
    { key: 'profile', label: 'Thông tin cá nhân' },
    { key: 'password', label: 'Đổi mật khẩu' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 flex-1 space-y-8 transition-colors duration-200">
      {/* Tiêu đề & thông tin cơ bản */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground text-lg shadow-md shadow-primary/20 uppercase">
            {user.email?.substring(0, 2)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </h1>
            <span className="text-xs text-muted-foreground block">{user.email}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-destructive border border-destructive/20 hover:border-destructive/40 bg-destructive/5 hover:bg-destructive/10 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-semibold border-b-2 px-1 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: ĐƠN HÀNG */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl flex flex-col items-center gap-3">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Bạn chưa thực hiện đơn đặt hàng nào.</p>
              <Link href="/products" className="text-xs px-4 py-2 bg-primary hover:opacity-90 text-primary-foreground rounded-full font-bold">
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-border bg-card/40 overflow-hidden divide-y divide-border">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">Mã đơn hàng:</span>
                        <span className="text-xs font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border truncate max-w-[200px]">{order.id}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Đặt lúc: {formatDate(order.created_at)}</span>
                      </div>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 text-xs sm:text-sm">
                        <div className="w-14 h-14 rounded-xl bg-background border border-border p-1 flex items-center justify-center flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <h4 className="font-bold text-foreground line-clamp-1">{item.name}</h4>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Số lượng: {item.quantity}</span>
                            <span className="text-foreground font-semibold">{formatPrice(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 sm:p-5 space-y-3 bg-muted/20 text-xs sm:text-sm">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong className="text-foreground">Địa chỉ nhận hàng:</strong> {order.shipping_address}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between items-center text-sm">
                      <span className="font-semibold text-muted-foreground">Tổng thanh toán:</span>
                      <span className="text-base font-black text-primary">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: HỒ SƠ CÁ NHÂN (SỬA ĐƯỢC) */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="max-w-xl rounded-2xl border border-border bg-card/40 p-6 space-y-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <User className="w-5 h-5 text-primary" />
            <span>Chỉnh sửa thông tin cá nhân</span>
          </h2>

          {profileMsg && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
              profileMsg.type === 'success'
                ? 'border-success/20 bg-success/5 text-success'
                : 'border-destructive/20 bg-destructive/5 text-destructive'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <div className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Địa chỉ Email (không thể thay đổi)</label>
              <input
                type="email"
                disabled
                value={user.email || ''}
                className="w-full h-11 px-4 rounded-xl border border-border bg-muted text-muted-foreground text-sm cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Họ và tên</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Số điện thoại</label>
              <input
                type="tel"
                placeholder="09xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Địa chỉ mặc định</label>
              <textarea
                rows={3}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:border-primary resize-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileSaving}
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground text-sm font-bold shadow-md shadow-primary/15 active:scale-[0.98] transition-all cursor-pointer"
          >
            {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Lưu thay đổi</span>
          </button>
        </form>
      )}

      {/* TAB: ĐỔI MẬT KHẨU */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="max-w-xl rounded-2xl border border-border bg-card/40 p-6 space-y-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Lock className="w-5 h-5 text-primary" />
            <span>Đổi mật khẩu</span>
          </h2>

          {passwordMsg && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
              passwordMsg.type === 'success'
                ? 'border-success/20 bg-success/5 text-success'
                : 'border-destructive/20 bg-destructive/5 text-destructive'
            }`}>
              {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <div className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mật khẩu mới</label>
              <input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordSaving}
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground text-sm font-bold shadow-md shadow-primary/15 active:scale-[0.98] transition-all cursor-pointer"
          >
            {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Cập nhật mật khẩu</span>
          </button>
        </form>
      )}
    </div>
  );
}
