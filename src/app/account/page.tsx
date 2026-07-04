'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, User, LogOut, Package, Clock, ShieldCheck, MapPin, Eye } from 'lucide-react';
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

export default function AccountPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('orders');

  useEffect(() => {
    const fetchUserDataAndOrders = async () => {
      setIsLoading(true);
      try {
        // 1. Kiểm tra session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // 2. Truy vấn danh sách đơn hàng của user từ Supabase
          const { data: orderData, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          
          if (orderData && orderData.length > 0) {
            setOrders(orderData);
          } else {
            // Nếu chưa có đơn hàng, nạp đơn hàng mock mẫu cho đẹp
            setOrders(MOCK_ORDERS);
          }
        } else {
          // Kiểm tra xem có đang ở chế độ mock login offline không
          const isMockLogged = localStorage.getItem('mock_user_logged');
          if (isMockLogged === 'true') {
            setUser({
              id: 'mock_user_id_123456789',
              email: 'guest.developer@gmail.com',
              user_metadata: {
                full_name: 'Developer Guest',
              }
            });
            setOrders(MOCK_ORDERS);
          } else {
            // Chưa đăng nhập, chuyển về login
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('mock_user_logged');
    router.push('/');
    router.refresh();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-450 border border-yellow-500/20">Chờ xử lý (Pending)</span>;
      case 'processing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Đã thanh toán (Paid)</span>;
      case 'shipping':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Đang giao hàng (Shipping)</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Đã giao hàng (Delivered)</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">Đã hủy đơn (Cancelled)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">Không xác định</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400">Đang tải thông tin tài khoản...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 flex-1 space-y-8">
      {/* Tiêu đề & Thông tin cơ bản */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-blue-500/20">
            {user.email?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </h1>
            <span className="text-xs text-slate-500 block">{user.email}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/25 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-900 pb-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
            activeTab === 'orders'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Đơn hàng của tôi ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
            activeTab === 'profile'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Thông tin cá nhân
        </button>
      </div>

      {/* TAB NỘI DUNG */}
      {activeTab === 'orders' ? (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-3">
              <ShoppingBag className="w-10 h-10 text-slate-600" />
              <p className="text-slate-400 text-sm">Bạn chưa thực hiện đơn đặt hàng nào.</p>
              <Link href="/products" className="text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold">
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-900 bg-slate-900/10 overflow-hidden divide-y divide-slate-900/60">
                  {/* Order Header */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Mã đơn hàng:</span>
                        <span className="text-xs font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-900 truncate max-w-[200px]">{order.id}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>Đặt lúc: {formatDate(order.created_at)}</span>
                      </div>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 text-xs sm:text-sm">
                        <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-850 p-1 flex items-center justify-center flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <h4 className="font-bold text-white line-clamp-1">{item.name}</h4>
                          <div className="flex justify-between text-slate-500">
                            <span>Số lượng: {item.quantity}</span>
                            <span className="text-slate-300 font-semibold">{formatPrice(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="p-4 sm:p-5 space-y-3 bg-slate-900/5 text-xs sm:text-sm">
                    <div className="flex items-start gap-2 text-slate-400">
                      <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Địa chỉ nhận hàng:</strong> {order.shipping_address}</span>
                    </div>
                    <div className="border-t border-slate-900 pt-3 flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-450 text-slate-400">Tổng thanh toán:</span>
                      <span className="text-base font-black text-blue-400">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB PROFILE */
        <div className="max-w-xl rounded-2xl border border-slate-900 bg-slate-900/10 p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-3">
            <User className="w-5 h-5 text-blue-500" />
            <span>Chi tiết tài khoản</span>
          </h2>
          
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-3 py-2 border-b border-slate-900/60">
              <span className="text-slate-500 font-semibold">Tên người dùng:</span>
              <span className="col-span-2 text-white font-medium">{user.user_metadata?.full_name || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-3 py-2 border-b border-slate-900/60">
              <span className="text-slate-500 font-semibold">Địa chỉ Email:</span>
              <span className="col-span-2 text-white font-medium">{user.email}</span>
            </div>
            <div className="grid grid-cols-3 py-2 border-b border-slate-900/60">
              <span className="text-slate-500 font-semibold">User UID (Supabase):</span>
              <span className="col-span-2 text-white font-mono text-xs truncate">{user.id}</span>
            </div>
            <div className="grid grid-cols-3 py-2 border-b border-slate-900/60">
              <span className="text-slate-500 font-semibold">Vai trò thành viên:</span>
              <span className="col-span-2 text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Thành viên thường (Khách hàng)</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
