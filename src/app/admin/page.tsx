'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Package, ShoppingBag, Plus, Pencil, Trash2, X, Loader2, LayoutDashboard, Search, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  category: string;
  brand: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  images: string[];
  rating_avg: number;
}

const CATEGORIES = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'phone', label: 'Điện thoại' },
  { value: 'smartwatch', label: 'Đồng hồ' },
  { value: 'earphone', label: 'Tai nghe' },
  { value: 'accessory', label: 'Phụ kiện' },
];

const FALLBACK_PRODUCTS: Product[] = [
  { id: 'prod-1', category: 'laptop', brand: 'Apple', name: 'MacBook Air M3 13 inch', price: 27990000, stock: 15, description: 'MacBook Air M3 siêu mỏng nhẹ, hiệu năng cao.', images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'], rating_avg: 4.8 },
  { id: 'prod-6', category: 'phone', brand: 'Apple', name: 'iPhone 15 Pro Max 256GB', price: 29990000, stock: 25, description: 'Khung Titanium, camera zoom 5x, A17 Pro.', images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600'], rating_avg: 4.8 },
  { id: 'prod-7', category: 'phone', brand: 'Samsung', name: 'Samsung Galaxy S24 Ultra 256GB', price: 26990000, stock: 20, description: 'Galaxy AI, bút S Pen, camera 200MP.', images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'], rating_avg: 4.7 },
  { id: 'prod-10', category: 'smartwatch', brand: 'Apple', name: 'Apple Watch Ultra 2 Titanium', price: 21490000, stock: 10, description: 'Vỏ Titanium, màn hình 3000 nits, pin 36 giờ.', images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'], rating_avg: 4.8 },
  { id: 'prod-13', category: 'earphone', brand: 'Apple', name: 'AirPods Pro Gen 2 USB-C', price: 5690000, stock: 30, description: 'Chống ồn ANC mạnh, âm thanh không gian.', images: ['https://images.unsplash.com/photo-1588449668338-d134ae7f3639?w=600'], rating_avg: 4.8 },
  { id: 'prod-16', category: 'accessory', brand: 'Anker', name: 'Sạc Anker Prime GaN 67W', price: 990000, stock: 50, description: 'Củ sạc GaN nhỏ gọn, 3 cổng.', images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'], rating_avg: 4.7 },
];

const MOCK_ORDERS = [
  { id: 'ord_1', created_at: '2026-07-04T08:30:00Z', status: 'shipping', total: 5690000, shipping_address: 'Nguyễn Văn A - 0987654321 - 123 Cầu Giấy, Hà Nội', items: [{ name: 'AirPods Pro Gen 2', quantity: 1 }] },
  { id: 'ord_2', created_at: '2026-06-20T14:15:00Z', status: 'delivered', total: 28980000, shipping_address: 'Trần Thị B - 0912345678 - 45 Lê Lợi, TP.HCM', items: [{ name: 'MacBook Air M3', quantity: 1 }, { name: 'Sạc Anker 67W', quantity: 1 }] },
];

const emptyForm: Product = {
  id: '', category: 'laptop', brand: '', name: '', price: 0, stock: 0, description: '',
  images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'], rating_avg: 5,
};

  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Product>(emptyForm);
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const checkAdminRole = async () => {
      setIsLoading(true);
      
      // Nếu chưa cấu hình Supabase thì mặc định cho qua ở chế độ offline
      if (!isSupabaseConfigured) {
        setIsAdmin(true);
        setProducts(FALLBACK_PRODUCTS);
        setOrders(MOCK_ORDERS);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          setAuthError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!');
          setIsAdmin(false);
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
          return;
        }

        // Phân quyền admin:
        // 1. user_metadata có role === 'admin'
        // 2. Hoặc email chứa từ 'admin' hoặc bằng 'admin@gmail.com'
        const userRole = user.user_metadata?.role;
        const isUserAdmin = userRole === 'admin' || user.email === 'admin@gmail.com' || user.email?.toLowerCase().includes('admin');

        if (!isUserAdmin) {
          setAuthError('Tài khoản của bạn không có đặc quyền Admin! Đang chuyển hướng...');
          setIsAdmin(false);
          setTimeout(() => {
            router.push('/account');
          }, 2500);
          return;
        }

        setIsAdmin(true);
        
        // Load products và orders từ Supabase thật
        const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
        if (!prodErr && prodData) setProducts(prodData);
        
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!orderErr && orderData) setOrders(orderData);
        
      } catch (err) {
        console.error('Lỗi phân quyền admin:', err);
        setProducts(FALLBACK_PRODUCTS);
        setOrders(MOCK_ORDERS);
        setIsAdmin(true); // Fallback debug
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [router]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm(p);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock), rating_avg: Number(form.rating_avg) };
    try {
      if (editing) {
        await supabase.from('products').update(payload).eq('id', editing.id);
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...payload } : p)));
      } else {
        const newId = 'prod-' + Date.now();
        const created = { ...payload, id: payload.id || newId };
        await supabase.from('products').insert(created);
        setProducts((prev) => [created, ...prev]);
      }
    } catch {
      // Chế độ offline/mock: cập nhật state cục bộ
      if (editing) {
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...payload } : p)));
      } else {
        setProducts((prev) => [{ ...payload, id: payload.id || 'prod-' + Date.now() }, ...prev]);
      }
    } finally {
      setSaving(false);
      setModalOpen(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    try {
      await supabase.from('products').delete().eq('id', p.id);
    } catch {
      // bỏ qua, vẫn xóa khỏi state
    }
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
  };

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const set = (k: keyof Product, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  if (isAdmin === null) {
    return (
      <div className="container mx-auto px-4 py-32 text-center flex-1 flex flex-col items-center justify-center gap-3 transition-colors duration-200">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground">Đang xác thực quyền truy cập Admin...</span>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="container mx-auto px-4 py-32 text-center flex-1 flex flex-col items-center justify-center gap-4 transition-colors duration-200">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Truy cập bị từ chối</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {authError || 'Bạn không có quyền quản trị để truy cập trang này.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex-1 space-y-8 transition-colors duration-200">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">Trang quản trị</h1>
            <p className="text-xs text-muted-foreground">Quản lý sản phẩm và đơn hàng của cửa hàng</p>
          </div>
        </div>
        {tab === 'products' && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground text-sm font-bold shadow-md shadow-primary/15 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sản phẩm</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setTab('products')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 flex items-center gap-2 transition-all cursor-pointer ${
            tab === 'products' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" /> Sản phẩm ({products.length})
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 flex items-center gap-2 transition-all cursor-pointer ${
            tab === 'orders' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Đơn hàng ({orders.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : tab === 'products' ? (
        <div className="space-y-4">
          {/* Tìm kiếm */}
          <div className="relative max-w-sm">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc thương hiệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:border-primary"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
          </div>

          {/* Bảng sản phẩm */}
          <div className="rounded-2xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Sản phẩm</th>
                  <th className="text-left font-semibold px-4 py-3">Danh mục</th>
                  <th className="text-right font-semibold px-4 py-3">Giá</th>
                  <th className="text-right font-semibold px-4 py-3">Kho</th>
                  <th className="text-right font-semibold px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-background border border-border p-1 flex items-center justify-center flex-shrink-0">
                          <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground line-clamp-1">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${p.stock > 0 ? 'text-foreground' : 'text-destructive'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer" title="Sửa">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">Không có sản phẩm nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab đơn hàng */
        <div className="rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Mã đơn</th>
                <th className="text-left font-semibold px-4 py-3">Địa chỉ giao</th>
                <th className="text-left font-semibold px-4 py-3">Trạng thái</th>
                <th className="text-right font-semibold px-4 py-3">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">{o.id}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[280px] truncate">{o.shipping_address}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">{formatPrice(o.total)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground text-sm">Chưa có đơn hàng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal thêm/sửa sản phẩm */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tên sản phẩm</label>
                <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Thương hiệu</label>
                  <input required value={form.brand} onChange={(e) => set('brand', e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Danh mục</label>
                  <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Giá (VNĐ)</label>
                  <input type="number" required value={form.price} onChange={(e) => set('price', e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tồn kho</label>
                  <input type="number" required value={form.stock} onChange={(e) => set('stock', e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">URL ảnh</label>
                <input value={form.images?.[0] || ''} onChange={(e) => set('images', [e.target.value])} className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mô tả</label>
                <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className="w-full p-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 h-11 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-sm font-semibold transition-colors cursor-pointer">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground text-sm font-bold transition-all cursor-pointer">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{editing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
