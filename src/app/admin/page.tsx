'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Package,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  LayoutDashboard,
  Search,
  AlertCircle,
  Users,
  LifeBuoy,
  TrendingUp,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Info,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  category: string;
  brand: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  specs: Record<string, string>;
  images: string[];
  rating_avg: number;
}

interface SpecRow {
  key: string;
  value: string;
}

interface VariantRow {
  label: string;
  price: string;
  ram: string;
  storage: string;
}

interface ColorRow {
  name: string;  // Tên màu tiếng Việt
  image: string; // URL ảnh của màu
}

const CATEGORIES = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'phone', label: 'Điện thoại' },
  { value: 'smartwatch', label: 'Đồng hồ' },
  { value: 'earphone', label: 'Tai nghe' },
  { value: 'accessory', label: 'Phụ kiện' },
];

const FALLBACK_PRODUCTS: Product[] = [
  { id: 'prod-1', category: 'laptop', brand: 'Apple', name: 'MacBook Air M3 13 inch', price: 27990000, stock: 15, description: 'MacBook Air M3 siêu mỏng nhẹ, hiệu năng cao.', specs: { "cpu": "M3", "ram": "8GB" }, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'], rating_avg: 4.8 },
  { id: 'prod-6', category: 'phone', brand: 'Apple', name: 'iPhone 15 Pro Max 256GB', price: 29990000, stock: 25, description: 'Khung Titanium, camera zoom 5x, A17 Pro.', specs: { "cpu": "A17 Pro", "screen": "6.7 inch" }, images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600'], rating_avg: 4.8 },
  { id: 'prod-7', category: 'phone', brand: 'Samsung', name: 'Samsung Galaxy S24 Ultra 256GB', price: 26990000, stock: 2, description: 'Galaxy AI, bút S Pen, camera 200MP.', specs: { "cpu": "Snapdragon 8 Gen 3" }, images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'], rating_avg: 4.7 },
  { id: 'prod-13', category: 'earphone', brand: 'Apple', name: 'AirPods Pro Gen 2 USB-C', price: 5690000, stock: 0, description: 'Chống ồn ANC mạnh, âm thanh không gian.', specs: { "anc": "Yes" }, images: ['https://images.unsplash.com/photo-1588449668338-d134ae7f3639?w=600'], rating_avg: 4.8 },
];

const MOCK_ORDERS = [
  { id: 'ord_1', created_at: '2026-07-04T08:30:00Z', status: 'shipping', total: 5690000, shipping_address: 'Nguyễn Văn A - SĐT: 0987654321 - ĐC: 123 Cầu Giấy, Hà Nội', items: [{ name: 'AirPods Pro Gen 2', quantity: 1, price: 5690000, image: 'https://images.unsplash.com/photo-1588449668338-d134ae7f3639?w=600' }] },
  { id: 'ord_2', created_at: '2026-06-20T14:15:00Z', status: 'delivered', total: 28980000, shipping_address: 'Trần Thị B - SĐT: 0912345678 - ĐC: 45 Lê Lợi, TP.HCM', items: [{ name: 'MacBook Air M3', quantity: 1, price: 27990000, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600' }, { name: 'Sạc Anker 67W', quantity: 1, price: 990000, image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600' }] },
];

const MOCK_TICKETS = [
  { id: 'tk_1', customer_id: 'cust_1', category: 'technical', risk_level: 'medium', created_by: 'customer', status: 'open', note: 'Sản phẩm tai nghe AirPods bị rè bên tai trái, tôi muốn đổi trả.', created_at: '2026-07-04T10:00:00Z', user_email: 'khachhang.test@gmail.com' },
  { id: 'tk_2', customer_id: 'cust_2', category: 'negotiation', risk_level: 'high', created_by: 'agent', status: 'in_progress', note: 'AI Chatbot phát hiện: Khách hàng yêu cầu giảm giá quá 3 lần liên tiếp cho iPhone 15.', created_at: '2026-07-04T09:15:00Z', user_email: 'user.oauth@gmail.com' }
];

const emptyForm: Product = {
  id: '', category: 'laptop', brand: '', name: '', price: 0, stock: 0, description: '',
  specs: {}, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'], rating_avg: 5,
};

type ActivePanel = 'dashboard' | 'products' | 'orders' | 'users' | 'tickets';

export default function AdminPage() {
  const [panel, setPanel] = useState<ActivePanel>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  
  // Search & Filters
  const [prodSearch, setProdSearch] = useState('');
  const [prodFilterCategory, setProdFilterCategory] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState('');
  const [chartTab, setChartTab] = useState<'week' | 'month'>('month');

  // Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formProduct, setFormProduct] = useState<Product>(emptyForm);
  const [specRows, setSpecRows] = useState<SpecRow[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [colorRows, setColorRows] = useState<ColorRow[]>([]);
  const [ratingsCount, setRatingsCount] = useState('');
  const [amazonLink, setAmazonLink] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Trợ lý AI Admin State
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: 'Xin chào Admin! Tôi là Trợ lý AI Nội bộ (Admin Assistant) hỗ trợ quản trị hệ thống. Tôi có thể giúp gì cho bạn hôm nay? (Ví dụ: tra cứu doanh thu, phân tích sản phẩm bán chạy, hoặc chính sách đổi trả)'
    }
  ]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [isAdminChatLoading, setIsAdminChatLoading] = useState(false);

  const handleSendAdminChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminChatInput.trim() || isAdminChatLoading) return;

    const userMsg = adminChatInput.trim();
    setAdminChatInput('');

    // Thêm tin nhắn của User vào danh sách
    const updatedMessages = [...adminChatMessages, { role: 'user', content: userMsg }];
    setAdminChatMessages(updatedMessages);
    setIsAdminChatLoading(true);

    try {
      // Gửi request tới API chat admin
      const response = await fetch('/api/chat/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          session_id: 'admin-session-' + Date.now()
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lỗi kết nối AI Assistant');

      // Thêm phản hồi của AI Assistant vào danh sách
      setAdminChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'Xin lỗi, tôi gặp sự cố khi xử lý câu trả lời.',
          tool_used: data.tool_used,
          sources: data.sources
        }
      ]);
    } catch (err: any) {
      console.error('Lỗi chat AI Admin:', err);
      setAdminChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lỗi: Không thể kết nối với Trợ lý AI Admin. Vui lòng kiểm tra lại kết nối mạng hoặc máy chủ API.'
        }
      ]);
    } finally {
      setIsAdminChatLoading(false);
    }
  };

  // Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

  // User Role State
  const [updatingUserRole, setUpdatingUserRole] = useState<string | null>(null);

  // Ticket Modal State
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReplyNote, setTicketReplyNote] = useState('');
  const [updatingTicket, setUpdatingTicket] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Nén ảnh: max width 500px, quality 0.7
          const canvas = document.createElement('canvas');
          const maxW = 500;
          const scale = Math.min(1, maxW / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.7);
          setPendingImage(base64);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Auth State
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string>('');
  
  const router = useRouter();
  const adminChatEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống đáy khi note (tin nhắn) của ticket thay đổi
  const scrollAdminChatToBottom = () => {
    setTimeout(() => {
      adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    if (selectedTicket) {
      scrollAdminChatToBottom();
    }
  }, [selectedTicket?.note]);

  // Polling Live Chat - nạp tin nhắn mới mỗi 3 giây khi đang mở Modal
  useEffect(() => {
    if (!selectedTicket || !isSupabaseConfigured) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('id', selectedTicket.id)
          .single();
        if (!error && data) {
          // Chỉ cập nhật nếu có tin nhắn mới hoặc đổi status
          if (data.note !== selectedTicket.note || data.status !== selectedTicket.status) {
            setSelectedTicket(data);
            setTickets(prev => prev.map(t => t.id === data.id ? data : t));
          }
        }
      } catch (e) {
        console.error('Lỗi Polling ticket chat:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedTicket?.id, selectedTicket?.note, selectedTicket?.status]);

  useEffect(() => {
    const checkAdminRoleAndLoadData = async () => {
      setIsLoading(true);
      
      if (!isSupabaseConfigured) {
        setIsAdmin(true);
        setProducts(FALLBACK_PRODUCTS);
        setOrders(MOCK_ORDERS);
        setTickets(MOCK_TICKETS);
        setUsers([
          { id: '1', email: 'vugiakhai2004@gmail.com', user_metadata: { full_name: 'Vũ Gia Khải', role: 'admin' }, created_at: '2026-07-04' },
          { id: '2', email: 'nhanvien.test@gmail.com', user_metadata: { full_name: 'Nguyễn Văn Staff', role: 'staff' }, created_at: '2026-07-01' },
          { id: '3', email: 'khachhang.test@gmail.com', user_metadata: { full_name: 'Trần Thị Customer' }, created_at: '2026-07-02' }
        ]);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
          setAuthError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!');
          setIsAdmin(false);
          setTimeout(() => { router.push('/auth/login'); }, 2000);
          return;
        }

        // Quyền admin: role === 'admin' hoặc email chỉ định
        const userRole = user.user_metadata?.role;
        const isUserAdmin = userRole === 'admin' || user.email === 'admin@gmail.com' || user.email === 'vugiakhai2004@gmail.com' || user.email?.toLowerCase().includes('admin');

        if (!isUserAdmin) {
          setAuthError('Tài khoản của bạn không có đặc quyền Admin! Đang chuyển hướng...');
          setIsAdmin(false);
          setTimeout(() => { router.push('/account'); }, 2500);
          return;
        }

        setIsAdmin(true);

        // Load Products từ Supabase thật
        const { data: prodData, error: prodErr } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (!prodErr && prodData) {
          setProducts(prodData.map(p => ({
            ...p,
            specs: typeof p.specs === 'string' ? JSON.parse(p.specs) : (p.specs || {})
          })));
        } else {
          setProducts(FALLBACK_PRODUCTS);
        }

        // Load Orders
        const { data: orderData, error: orderErr } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!orderErr && orderData) setOrders(orderData);
        else setOrders(MOCK_ORDERS);

        // Load Support Tickets
        const { data: ticketData, error: ticketErr } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
        if (!ticketErr && ticketData) {
          setTickets(ticketData);
        } else {
          setTickets(MOCK_TICKETS);
        }

      } catch (err) {
        console.error('Lỗi khi tải dữ liệu admin:', err);
        setProducts(FALLBACK_PRODUCTS);
        setOrders(MOCK_ORDERS);
        setTickets(MOCK_TICKETS);
        setIsAdmin(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRoleAndLoadData();
  }, [router]);

  // Load Users qua API Route (phải truyền token xác thực)
  const fetchUsersList = async () => {
    setIsUsersLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) throw new Error('Không tìm thấy token phiên đăng nhập');

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lỗi tải danh sách người dùng');
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Lỗi fetch users:', err);
      alert(err.message || 'Lỗi hệ thống khi tải danh sách người dùng');
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    if (panel === 'users' && isSupabaseConfigured) {
      fetchUsersList();
    }
  }, [panel]);

  // Đổi Role cho User
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    if (!window.confirm(`Xác nhận đổi vai trò của người dùng này thành "${newRole}"?`)) return;
    setUpdatingUserRole(userId);
    try {
      if (!isSupabaseConfigured) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_metadata: { ...u.user_metadata, role: newRole } } : u));
        alert('Cập nhật vai trò thành công (offline mode)');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Hết phiên đăng nhập');

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role: newRole })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cập nhật vai trò thất bại');
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_metadata: { ...u.user_metadata, role: newRole } } : u));
      alert('Đã cập nhật quyền thành công!');
    } catch (err: any) {
      console.error('Lỗi đổi role:', err);
      alert(err.message || 'Lỗi không thể cập nhật quyền');
    } finally {
      setUpdatingUserRole(null);
    }
  };

  // Cập nhật trạng thái đơn hàng
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderStatus(true);
    try {
      if (!isSupabaseConfigured) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder) setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder) setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      alert('Cập nhật trạng thái đơn hàng thành công!');
    } catch (err: any) {
      console.error('Lỗi cập nhật đơn hàng:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // Cập nhật trạng thái Ticket
  const handleUpdateTicket = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    setUpdatingTicket(true);
    try {
      const payload = { status: newStatus };

      if (!isSupabaseConfigured) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...payload } : t));
        setSelectedTicket((prev: any) => ({ ...prev, ...payload }));
        alert('Cập nhật trạng thái Ticket thành công (offline mode)');
        return;
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(payload)
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...payload } : t));
      setSelectedTicket((prev: any) => ({ ...prev, ...payload }));
      alert('Cập nhật trạng thái Ticket thành công!');
    } catch (err: any) {
      console.error('Lỗi cập nhật trạng thái ticket:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Nhân viên gửi tin nhắn trả lời trong Ticket chat (Ghi đè cột note dạng JSON)
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!ticketReplyNote.trim() && !pendingImage) || !selectedTicket || updatingTicket) return;

    const replyMsgText = ticketReplyNote.trim();
    setUpdatingTicket(true);

    try {
      // Đọc các tin nhắn hiện có từ note
      let currentMessages: any[] = [];
      try {
        const parsed = JSON.parse(selectedTicket.note);
        if (Array.isArray(parsed)) currentMessages = parsed;
      } catch (e) {
        currentMessages = [
          { role: 'customer', message: selectedTicket.note || 'Không có mô tả chi tiết.', created_at: selectedTicket.created_at }
        ];
      }

      // Tạo tin nhắn mới của nhân viên
      const newMsg = {
        role: 'staff',
        message: replyMsgText,
        image_url: pendingImage || undefined,
        created_at: new Date().toISOString()
      };

      const updatedMessages = [...currentMessages, newMsg];
      const updatedNoteJson = JSON.stringify(updatedMessages);

      const payload = {
        note: updatedNoteJson,
        status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status // tự động chuyển thành in_progress để báo đang xử lý
      };

      if (!isSupabaseConfigured) {
        const updatedTicket = { ...selectedTicket, ...payload };
        setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
        setSelectedTicket(updatedTicket);
        setTicketReplyNote('');
        setPendingImage(null);
        return;
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(payload)
        .eq('id', selectedTicket.id);

      if (error) throw error;

      const updatedTicket = { ...selectedTicket, ...payload };
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      setTicketReplyNote('');
      setPendingImage(null);
    } catch (err: any) {
      console.error('Lỗi gửi phản hồi ticket:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Thêm/Sửa sản phẩm
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);

    // Convert danh sách Specs Key-Value từ form sang Object JSON
    const specsObject: Record<string, any> = {};
    specRows.forEach(row => {
      if (row.key.trim()) specsObject[row.key.trim()] = row.value.trim();
    });

    // Thêm các trường nội bộ
    if (amazonLink.trim()) specsObject.original_link = amazonLink.trim();
    if (ratingsCount.trim()) specsObject.ratings_count = ratingsCount.trim();

    // Đóng gói Variants
    const validVariants = variantRows.filter(v => v.label.trim());
    if (validVariants.length > 0) {
      specsObject.variants = validVariants.map(v => ({
        label: v.label.trim(),
        price: Number(v.price) || Number(formProduct.price),
        ram: v.ram.trim(),
        storage: v.storage.trim(),
      }));
    }

    // Đóng gói Màu sắc
    const validColors = colorRows.filter(c => c.name.trim());
    if (validColors.length > 0) {
      specsObject.color_options = validColors.map(c => c.name.trim());
      specsObject.color_images  = validColors.map(c => c.image.trim());
    }

    const payload = {
      category: formProduct.category,
      brand: formProduct.brand,
      name: formProduct.name,
      price: Number(formProduct.price),
      stock: Number(formProduct.stock),
      description: formProduct.description,
      images: formProduct.images,
      specs: specsObject,
      rating_avg: Number(formProduct.rating_avg)
    };

    try {
      if (editingProduct) {
        if (isSupabaseConfigured) {
          const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
          if (error) throw error;
        }
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p)));
      } else {
        const newId = 'prod-' + Date.now();
        if (isSupabaseConfigured) {
          const { error } = await supabase.from('products').insert({ ...payload, id: newId });
          if (error) throw error;
        }
        setProducts((prev) => [{ ...payload, id: newId } as Product, ...prev]);
      }
      setModalOpen(false);
      alert('Lưu sản phẩm thành công!');
    } catch (err: any) {
      console.error('Lỗi lưu sản phẩm:', err);
      alert('Lỗi khi lưu sản phẩm: ' + err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  // Xóa sản phẩm
  const handleDeleteProduct = async (p: Product) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${p.name}"?`)) return;
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('products').delete().eq('id', p.id);
        if (error) throw error;
      }
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      alert('Xóa sản phẩm thành công!');
    } catch (err: any) {
      console.error('Lỗi khi xóa:', err);
      alert('Lỗi: ' + err.message);
    }
  };

  // Mở modal thêm sản phẩm mới
  const openCreateProduct = () => {
    setEditingProduct(null);
    setFormProduct(emptyForm);
    setSpecRows([]);
    setVariantRows([]);
    setColorRows([]);
    setAmazonLink('');
    setRatingsCount('');
    setModalOpen(true);
  };

  // Mở modal sửa sản phẩm
  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormProduct(p);
    setAmazonLink((p.specs as any)?.original_link || '');
    setRatingsCount((p.specs as any)?.ratings_count || '');

    // Parse variants
    const vRows: VariantRow[] = ((p.specs as any)?.variants || []).map((v: any) => ({
      label: v.label || '',
      price: String(v.price || ''),
      ram: v.ram || '',
      storage: v.storage || '',
    }));
    setVariantRows(vRows);

    // Parse colors
    const colorOpts: string[] = (p.specs as any)?.color_options || [];
    const colorImgs: string[] = (p.specs as any)?.color_images || [];
    const cRows: ColorRow[] = colorOpts.map((name, idx) => ({ name, image: colorImgs[idx] || '' }));
    setColorRows(cRows);

    // Parse specs object sang key-value (lọc bỏ các key nội bộ)
    const INTERNAL_KEYS = new Set(['original_link','ratings_count','color_options','color_images','variants','ram','storage']);
    const rows: SpecRow[] = Object.entries(p.specs || {})
      .filter(([key]) => !INTERNAL_KEYS.has(key))
      .map(([key, value]) => ({ key, value: String(value) }));
    setSpecRows(rows);
    setModalOpen(true);
  };

  // Quản lý spec rows động trong form sản phẩm
  const addSpecRow = () => setSpecRows([...specRows, { key: '', value: '' }]);
  const removeSpecRow = (index: number) => setSpecRows(specRows.filter((_, idx) => idx !== index));
  const updateSpecRow = (index: number, field: 'key' | 'value', val: string) =>
    setSpecRows(specRows.map((row, idx) => idx === index ? { ...row, [field]: val } : row));

  // Quản lý variant rows
  const addVariantRow = () => setVariantRows([...variantRows, { label: '', price: '', ram: '', storage: '' }]);
  const removeVariantRow = (index: number) => setVariantRows(variantRows.filter((_, idx) => idx !== index));
  const updateVariantRow = (index: number, field: keyof VariantRow, val: string) =>
    setVariantRows(variantRows.map((row, idx) => idx === index ? { ...row, [field]: val } : row));

  // Quản lý color rows
  const addColorRow = () => setColorRows([...colorRows, { name: '', image: '' }]);
  const removeColorRow = (index: number) => setColorRows(colorRows.filter((_, idx) => idx !== index));
  const updateColorRow = (index: number, field: keyof ColorRow, val: string) =>
    setColorRows(colorRows.map((row, idx) => idx === index ? { ...row, [field]: val } : row));

  // Định dạng hiển thị tiền tệ
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Định dạng ngày tháng
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  // Trả về màu Badge trạng thái đơn hàng
  const getOrderStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      pending: { cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'Chờ xử lý' },
      processing: { cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', label: 'Đã thanh toán / Xử lý' },
      shipping: { cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', label: 'Đang giao hàng' },
      delivered: { cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Đã hoàn tất' },
      cancelled: { cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', label: 'Đã hủy đơn' },
    };
    const s = map[status] || { cls: 'bg-muted text-muted-foreground border-border', label: 'Chưa rõ' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.cls}`}>{s.label}</span>;
  };

  // Trả về màu Badge trạng thái Ticket
  const getTicketStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      open: { cls: 'bg-rose-500/10 text-rose-600 border-rose-500/20', label: 'Mới nhận' },
      in_progress: { cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Đang xử lý' },
      resolved: { cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Đã giải quyết' }
    };
    const s = map[status] || { cls: 'bg-muted text-muted-foreground', label: status };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${s.cls}`}>{s.label}</span>;
  };

  // Tính toán doanh số Dashboard
  const calculateStats = () => {
    const successfulOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'pending');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');
    
    const totalRevenue = successfulOrders.reduce((acc, cur) => acc + Number(cur.total), 0);
    const lostRevenue = cancelledOrders.reduce((acc, cur) => acc + Number(cur.total), 0);
    const aov = successfulOrders.length > 0 ? Math.round(totalRevenue / successfulOrders.length) : 0;
    const cancelledRate = orders.length > 0 ? Math.round((cancelledOrders.length / orders.length) * 100) : 0;
    
    const lowStockProducts = products.filter(p => p.stock <= 5);
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    // 1. Thống kê theo tuần (Thứ 2 -> Chủ Nhật dựa trên getDay)
    const weeklyData = [0, 0, 0, 0, 0, 0, 0];
    successfulOrders.forEach(o => {
      const day = new Date(o.created_at).getDay();
      weeklyData[day] += Number(o.total);
    });
    const weeklyRevenue = [
      { label: 'Thứ 2', value: weeklyData[1] },
      { label: 'Thứ 3', value: weeklyData[2] },
      { label: 'Thứ 4', value: weeklyData[3] },
      { label: 'Thứ 5', value: weeklyData[4] },
      { label: 'Thứ 6', value: weeklyData[5] },
      { label: 'Thứ 7', value: weeklyData[6] },
      { label: 'Chủ Nhật', value: weeklyData[0] },
    ];

    // 2. Thống kê theo 6 tháng gần nhất
    const monthlyData: Record<string, number> = {};
    const last6Months: { label: string; key: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `Tháng ${d.getMonth() + 1}`;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      last6Months.push({ label, key });
      monthlyData[key] = 0;
    }

    successfulOrders.forEach(o => {
      const date = new Date(o.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += Number(o.total);
      }
    });

    const monthlyRevenue = last6Months.map(m => ({
      label: m.label,
      value: monthlyData[m.key]
    }));

    // 3. Phân bổ doanh số theo danh mục sản phẩm (Tỷ lệ bán được)
    const categorySales: Record<string, { qty: number; revenue: number }> = {
      laptop: { qty: 0, revenue: 0 },
      phone: { qty: 0, revenue: 0 },
      smartwatch: { qty: 0, revenue: 0 },
      earphone: { qty: 0, revenue: 0 },
      accessory: { qty: 0, revenue: 0 },
    };

    let totalQtySold = 0;
    successfulOrders.forEach(o => {
      o.items?.forEach((item: any) => {
        const matchedProduct = products.find(p => 
          p.id === item.id || 
          p.id === item.product_id || 
          item.name === p.name ||
          item.name.startsWith(p.name) ||
          item.name.includes(p.name)
        );
        const cat = matchedProduct?.category || 'accessory';
        if (categorySales[cat]) {
          const qty = Number(item.quantity || 1);
          categorySales[cat].qty += qty;
          categorySales[cat].revenue += Number(item.price || 0) * qty;
          totalQtySold += qty;
        }
      });
    });

    // Mảng màu sắc cho từng danh mục
    const CAT_COLORS: Record<string, string> = {
      laptop: 'bg-primary',
      phone: 'bg-indigo-500',
      smartwatch: 'bg-emerald-500',
      earphone: 'bg-amber-500',
      accessory: 'bg-purple-500'
    };

    const categoryRates = CATEGORIES.map(c => {
      const salesInfo = categorySales[c.value] || { qty: 0, revenue: 0 };
      const percentage = totalQtySold > 0 ? Math.round((salesInfo.qty / totalQtySold) * 100) : 0;
      return {
        category: c.value,
        label: c.label,
        qty: salesInfo.qty,
        revenue: salesInfo.revenue,
        percentage,
        colorClass: CAT_COLORS[c.value] || 'bg-muted'
      };
    });

    return {
      revenue: totalRevenue,
      lostRevenue,
      aov,
      cancelledRate,
      orderCount: orders.length,
      productCount: products.length,
      userCount: users.length || 1,
      lowStock: lowStockProducts,
      outOfStockCount,
      weeklyRevenue,
      monthlyRevenue,
      categoryRates,
      totalQtySold
    };
  };

  const stats = calculateStats();

  // Lọc sản phẩm
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.brand.toLowerCase().includes(prodSearch.toLowerCase());
    const matchesCategory = prodFilterCategory ? p.category === prodFilterCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Lọc đơn hàng
  const filteredOrders = orders.filter(o => {
    return o.id.toLowerCase().includes(orderSearch.toLowerCase()) || o.shipping_address.toLowerCase().includes(orderSearch.toLowerCase());
  });

  // Lọc tickets
  const filteredTickets = tickets.filter(t => {
    return ticketFilterStatus ? t.status === ticketFilterStatus : true;
  });

  // Loading xác thực quyền
  if (isAdmin === null) {
    return (
      <div className="container mx-auto px-4 py-32 text-center flex-1 flex flex-col items-center justify-center gap-3 transition-colors duration-200">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground">Đang xác thực quyền truy cập Admin...</span>
      </div>
    );
  }

  // Chặn truy cập trái phép
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
    <div className="flex flex-1 min-h-[calc(100vh-140px)] bg-background text-foreground transition-colors duration-200">
      
      {/* 1. SIDEBAR ĐIỀU HƯỚNG */}
      <aside className="w-64 border-r border-border bg-card/35 hidden md:flex flex-col p-6 space-y-6 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 pb-4 border-b border-border">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <span className="font-extrabold text-base tracking-wide uppercase text-foreground">Admin Panel</span>
        </div>
        
        <nav className="flex-1 space-y-1.5 text-sm">
          <button
            onClick={() => setPanel('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium cursor-pointer ${
              panel === 'dashboard' ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/15' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setPanel('products')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium cursor-pointer ${
              panel === 'products' ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/15' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Sản phẩm ({products.length})</span>
          </button>
          
          <button
            onClick={() => setPanel('orders')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium cursor-pointer ${
              panel === 'orders' ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/15' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đơn hàng ({orders.length})</span>
          </button>
          
          <button
            onClick={() => setPanel('users')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium cursor-pointer ${
              panel === 'users' ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/15' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Nhân viên & Khách</span>
          </button>
          
          <button
            onClick={() => setPanel('tickets')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium cursor-pointer ${
              panel === 'tickets' ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/15' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Hỗ trợ khách hàng ({tickets.filter(t=>t.status!=='resolved').length})</span>
          </button>
        </nav>

        <div className="pt-4 border-t border-border text-center">
          <Link href="/" className="text-xs text-primary hover:underline font-semibold">
            ← Quay lại trang chủ mua sắm
          </Link>
        </div>
      </aside>

      {/* 2. NỘI DUNG CHÍNH (MAIN CONTENT) */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-hidden">
        
        {/* Mobile Navigation bar */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-3 border-b border-border no-scrollbar text-xs">
          <button onClick={() => setPanel('dashboard')} className={`px-3.5 py-2 rounded-xl whitespace-nowrap ${panel === 'dashboard' ? 'bg-primary text-primary-foreground font-bold' : 'bg-card border border-border text-muted-foreground'}`}>Dashboard</button>
          <button onClick={() => setPanel('products')} className={`px-3.5 py-2 rounded-xl whitespace-nowrap ${panel === 'products' ? 'bg-primary text-primary-foreground font-bold' : 'bg-card border border-border text-muted-foreground'}`}>Sản phẩm</button>
          <button onClick={() => setPanel('orders')} className={`px-3.5 py-2 rounded-xl whitespace-nowrap ${panel === 'orders' ? 'bg-primary text-primary-foreground font-bold' : 'bg-card border border-border text-muted-foreground'}`}>Đơn hàng</button>
          <button onClick={() => setPanel('users')} className={`px-3.5 py-2 rounded-xl whitespace-nowrap ${panel === 'users' ? 'bg-primary text-primary-foreground font-bold' : 'bg-card border border-border text-muted-foreground'}`}>Thành viên</button>
          <button onClick={() => setPanel('tickets')} className={`px-3.5 py-2 rounded-xl whitespace-nowrap ${panel === 'tickets' ? 'bg-primary text-primary-foreground font-bold' : 'bg-card border border-border text-muted-foreground'}`}>Hỗ trợ</button>
        </div>

        {/* ========================================== */}
        {/* PANEL: DASHBOARD (TỔNG QUAN THỐNG KÊ) */}
        {/* ========================================== */}
        {panel === 'dashboard' && (
          <div className="space-y-6">
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">Tổng quan doanh số</h1>
              <p className="text-xs text-muted-foreground">Theo dõi kết quả bán hàng, phân tích doanh thu theo chu kỳ thời gian và tỷ lệ bán ra</p>
            </div>

            {/* Thẻ KPI Chính */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border bg-card/45 p-4 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Doanh thu thực tế</span>
                  <span className="text-base sm:text-lg font-black text-foreground block">{formatPrice(stats.revenue)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-success/10 text-success">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/45 p-4 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Đơn đặt hàng</span>
                  <span className="text-base sm:text-lg font-black text-foreground block">{stats.orderCount} đơn</span>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/45 p-4 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Sản phẩm tồn kho</span>
                  <span className="text-base sm:text-lg font-black text-foreground block">{stats.productCount} mẫu</span>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/45 p-4 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Đã bán ra (Sản phẩm)</span>
                  <span className="text-base sm:text-lg font-black text-foreground block">{stats.totalQtySold} chiếc</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Thẻ KPI Phụ (Phần chưa nghĩ ra - Insights nâng cao) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border bg-card/25 p-3.5 flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground block">Giá trị đơn trung bình (AOV)</span>
                  <span className="text-sm font-bold text-foreground block">{formatPrice(stats.aov)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/25 p-3.5 flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground block">Doanh thu bị hủy đơn</span>
                  <span className="text-sm font-bold text-rose-500 block">{formatPrice(stats.lostRevenue)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/25 p-3.5 flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground block">Tỷ lệ hủy đơn hàng</span>
                  <span className="text-sm font-bold text-rose-500 block">{stats.cancelledRate}%</span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/25 p-3.5 flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground block">Người dùng đăng ký</span>
                  <span className="text-sm font-bold text-foreground block">{stats.userCount} thành viên</span>
                </div>
              </div>
            </div>

            {/* Thống kê chi tiết & Biểu đồ phân tích */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Cột trái: Biểu đồ doanh thu tuần/tháng */}
              <div className="lg:col-span-2 rounded-2xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Phân tích doanh thu</h3>
                    <p className="text-[10px] text-muted-foreground">Nhấp để chuyển đổi chu kỳ thống kê</p>
                  </div>
                  <div className="flex rounded-lg border border-border bg-background p-0.5 text-xs">
                    <button
                      onClick={() => setChartTab('month')}
                      className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        chartTab === 'month' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Theo Tháng (6 tháng)
                    </button>
                    <button
                      onClick={() => setChartTab('week')}
                      className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        chartTab === 'week' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Theo Tuần (Thứ)
                    </button>
                  </div>
                </div>
                
                {/* Vẽ Biểu đồ Đường SVG chuyên nghiệp với lưới phân tích (Grid Lines) */}
                {(() => {
                  const activeData = chartTab === 'month' ? stats.monthlyRevenue : stats.weeklyRevenue;
                  const maxVal = Math.max(...activeData.map(d => d.value), 1000000);
                  
                  // Thiết lập thông số tọa độ biểu đồ
                  const svgWidth = 600;
                  const svgHeight = 220;
                  const paddingLeft = 75;
                  const paddingRight = 30;
                  const paddingTop = 20;
                  const paddingBottom = 30;
                  
                  const chartWidth = svgWidth - paddingLeft - paddingRight;
                  const chartHeight = svgHeight - paddingTop - paddingBottom;
                  
                  const points = activeData.map((item, idx) => {
                    const x = paddingLeft + (idx * (chartWidth / (activeData.length - 1)));
                    const y = svgHeight - paddingBottom - (item.value / maxVal) * chartHeight;
                    return { x, y, label: item.label, value: item.value };
                  });
                  
                  // Tạo chuỗi đường dẫn d cho thẻ path (đường line)
                  const linePath = points.reduce((acc, p, idx) => {
                    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                  }, '');
                  
                  // Tạo chuỗi đường dẫn khép kín để đổ màu gradient (Area chart)
                  const areaPath = points.length > 0 
                    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
                    : '';

                  // Các mốc lưới ngang (Grid lines) Y: 0%, 25%, 50%, 75%, 100%
                  const gridTicks = [0, 0.25, 0.5, 0.75, 1];
                  
                  return (
                    <div className="relative w-full overflow-hidden bg-background/25 rounded-2xl p-2">
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
                        {/* Định nghĩa Gradient cho vùng đổ bóng dưới đường */}
                        <defs>
                          <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {/* 1. Vẽ các đường lưới ngang (Grid Lines) & Nhãn trục Y */}
                        {gridTicks.map((tick, i) => {
                          const y = svgHeight - paddingBottom - tick * chartHeight;
                          const val = Math.round(tick * maxVal);
                          return (
                            <g key={i} className="opacity-40">
                              {/* Đường lưới đứt nét */}
                              <line 
                                x1={paddingLeft} 
                                y1={y} 
                                x2={svgWidth - paddingRight} 
                                y2={y} 
                                stroke="currentColor" 
                                strokeWidth="1" 
                                strokeDasharray="3 3" 
                                className="text-border/80"
                              />
                              {/* Nhãn trục Y */}
                              <text 
                                x={paddingLeft - 10} 
                                y={y + 3.5} 
                                textAnchor="end" 
                                className="fill-muted-foreground text-[9px] font-bold"
                              >
                                {tick === 0 ? '0' : formatPrice(val)}
                              </text>
                            </g>
                          );
                        })}
                        
                        {/* 2. Đổ vùng màu Gradient phía dưới đường dẫn (Area fill) */}
                        {areaPath && (
                          <path d={areaPath} fill="url(#chartAreaGrad)" />
                        )}
                        
                        {/* 3. Vẽ đường Line chính */}
                        {linePath && (
                          <path 
                            d={linePath} 
                            fill="none" 
                            stroke="var(--primary)" 
                            strokeWidth="3" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-[0_2px_4px_rgba(var(--primary-rgb),0.15)]"
                          />
                        )}
                        
                        {/* 4. Vẽ các chấm tròn toạ độ tương tác + Nhãn trục X */}
                        {points.map((p, idx) => (
                          <g key={idx} className="group/point">
                            {/* Nhãn trục X bên dưới biểu đồ */}
                            <text 
                              x={p.x} 
                              y={svgHeight - 6} 
                              textAnchor="middle" 
                              className="fill-muted-foreground text-[10px] font-extrabold"
                            >
                              {p.label}
                            </text>
                            
                            {/* Chấm tròn chính */}
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="4.5" 
                              className="fill-background stroke-primary stroke-[2.5px] group-hover/point:r-6 group-hover/point:stroke-[3.5px] cursor-pointer transition-all duration-150"
                            />
                            
                            {/* Tooltip vùng nhạy cảm lớn hơn để dễ hover */}
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="12" 
                              className="fill-transparent cursor-pointer"
                            />
                            
                            {/* Tooltip hiển thị số tiền khi hover */}
                            <g className="opacity-0 group-hover/point:opacity-100 pointer-events-none transition-opacity duration-150">
                              <rect 
                                x={p.x - 55} 
                                y={p.y - 30} 
                                width="110" 
                                height="20" 
                                rx="5" 
                                className="fill-foreground dark:fill-background stroke-border stroke shadow-lg"
                              />
                              <text 
                                x={p.x} 
                                y={p.y - 17} 
                                textAnchor="middle" 
                                className="fill-background dark:fill-foreground text-[9px] font-extrabold"
                              >
                                {formatPrice(p.value)}
                              </text>
                            </g>
                          </g>
                        ))}
                      </svg>
                    </div>
                  );
                })()}
                
                <div className="text-[10px] text-muted-foreground text-center italic flex items-center justify-center gap-1.5 pt-1">
                  <Info className="w-3.5 h-3.5 text-primary" />
                  <span>Dữ liệu doanh thu thực tế được tổng hợp từ các đơn hàng đã đặt (không tính đơn bị hủy)</span>
                </div>
              </div>

              {/* Cột phải: Tỷ lệ bán được theo danh mục (Sales rates) */}
              <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="border-b border-border pb-2.5">
                    <h3 className="text-sm font-bold text-foreground">Tỷ lệ bán được theo loại</h3>
                    <p className="text-[10px] text-muted-foreground">Phần trăm số lượng đã bán ra theo danh mục</p>
                  </div>

                  <div className="space-y-4 pr-1">
                    {stats.categoryRates.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground capitalize">{item.label}</span>
                          <span className="text-muted-foreground">{item.qty} chiếc ({item.percentage}%)</span>
                        </div>
                        {/* Thanh Progress bar */}
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ease-out ${item.colorClass}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-muted-foreground/80">
                          <span>Doanh thu:</span>
                          <span className="font-bold text-foreground">{formatPrice(item.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/40 p-3 rounded-xl border border-border text-[10px] text-muted-foreground mt-4 leading-relaxed">
                  Thiết bị **Điện thoại** và **Laptop** đang là các mặt hàng dẫn đầu về số lượng bán ra và tổng giá trị đơn hàng trong hệ thống.
                </div>
              </div>

            </div>

            {/* Khối Tồn kho thấp & Đơn hàng mới nhất ở chân Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Đơn hàng mới nhất */}
              <div className="lg:col-span-2 rounded-2xl border border-border bg-card/40 p-5 space-y-3.5 shadow-sm">
                <div className="border-b border-border pb-2 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-foreground">Đơn đặt hàng mới nhận</h3>
                  <button onClick={() => setPanel('orders')} className="text-xs text-primary hover:underline font-bold">Xem tất cả</button>
                </div>
                
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {orders.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-8 text-center">Chưa có đơn hàng nào trong hệ thống.</p>
                  ) : (
                    orders.slice(0, 3).map(o => (
                      <div key={o.id} className="flex justify-between items-center text-xs border-b border-border/40 pb-2.5 last:border-b-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">Đơn #{o.id.substring(0, 8)}...</p>
                          <span className="text-[10px] text-muted-foreground block">{formatDate(o.created_at)}</span>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="font-bold block">{formatPrice(o.total)}</span>
                          {getOrderStatusBadge(o.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cảnh báo tồn kho */}
              <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-3.5 shadow-sm flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span>Cảnh báo tồn kho</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-[10px] font-bold">Tồn &lt; 5 chiếc</span>
                  </div>

                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {stats.lowStock.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-6 text-center">Tồn kho của tất cả sản phẩm đều ở mức an toàn.</p>
                    ) : (
                      stats.lowStock.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-xs border-b border-border/40 pb-2">
                          <span className="font-medium text-foreground line-clamp-1 flex-1 pr-3">{p.name}</span>
                          <span className={`font-bold px-2 py-0.5 rounded border ${p.stock === 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                            {p.stock === 0 ? 'Hết hàng' : `Còn ${p.stock}`}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-muted/40 p-3 rounded-xl border border-border text-[10px] text-muted-foreground mt-3">
                  Tổng cộng có <strong className="text-foreground">{stats.outOfStockCount}</strong> sản phẩm hiện đang hết sạch hàng trong kho.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PANEL: SẢN PHẨM (PRODUCTS) */}
        {/* ========================================== */}
        {panel === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black text-foreground">Danh sách sản phẩm ({products.length})</h1>
                <p className="text-xs text-muted-foreground">Thêm mới, sửa đổi thông tin kỹ thuật (Specs) và quản lý số lượng tồn kho</p>
              </div>
              <button
                onClick={openCreateProduct}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground text-sm font-bold shadow-md shadow-primary/15 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm sản phẩm</span>
              </button>
            </div>

            {/* Tìm kiếm & Bộ lọc */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Tìm tên hoặc thương hiệu..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:border-primary"
                />
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
              <select
                value={prodFilterCategory}
                onChange={(e) => setProdFilterCategory(e.target.value)}
                className="h-10 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="">-- Tất cả danh mục --</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Bảng sản phẩm */}
            <div className="rounded-2xl border border-border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Sản phẩm</th>
                    <th className="text-left font-semibold px-4 py-3">Danh mục</th>
                    <th className="text-right font-semibold px-4 py-3">Giá</th>
                    <th className="text-right font-semibold px-4 py-3">Tồn kho</th>
                    <th className="text-right font-semibold px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((p) => (
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
                        <span className={`font-semibold ${p.stock > 0 ? 'text-foreground' : 'text-destructive font-bold'}`}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditProduct(p)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer" title="Sửa">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(p)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">Không có sản phẩm nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PANEL: ĐƠN HÀNG (ORDERS) */}
        {/* ========================================== */}
        {panel === 'orders' && (
          <div className="space-y-4">
            <div className="border-b border-border pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">Quản lý đơn hàng ({orders.length})</h1>
              <p className="text-xs text-muted-foreground">Theo dõi đơn hàng, địa chỉ giao hàng và trực tiếp chuyển trạng thái vận chuyển</p>
            </div>

            {/* Tìm kiếm */}
            <div className="relative max-w-sm">
              <input
                type="text"
                placeholder="Tìm mã đơn hoặc địa chỉ..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-sm focus:outline-none focus:border-primary"
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
            </div>

            {/* Bảng đơn hàng */}
            <div className="rounded-2xl border border-border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Mã đơn</th>
                    <th className="text-left font-semibold px-4 py-3">Đặt lúc</th>
                    <th className="text-left font-semibold px-4 py-3">Địa chỉ giao</th>
                    <th className="text-left font-semibold px-4 py-3">Trạng thái</th>
                    <th className="text-right font-semibold px-4 py-3">Tổng tiền</th>
                    <th className="text-right font-semibold px-4 py-3">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">#{o.id.substring(0, 8)}...</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[240px] truncate">{o.shipping_address}</td>
                      <td className="px-4 py-3">{getOrderStatusBadge(o.status)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-bold text-foreground cursor-pointer transition-colors"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">Không tìm thấy đơn hàng nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PANEL: NHÂN VIÊN & NGƯỜI DÙNG (USERS) */}
        {/* ========================================== */}
        {panel === 'users' && (
          <div className="space-y-4">
            <div className="border-b border-border pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground">Nhân viên & Khách hàng</h1>
                <p className="text-xs text-muted-foreground">Danh sách tài khoản đã đăng ký và phân loại vai trò (Role)</p>
              </div>
              <button 
                onClick={fetchUsersList}
                disabled={isUsersLoading}
                className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 transition-all cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 ${isUsersLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isUsersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">Người dùng</th>
                      <th className="text-left font-semibold px-4 py-3">Email</th>
                      <th className="text-left font-semibold px-4 py-3">Đăng ký ngày</th>
                      <th className="text-left font-semibold px-4 py-3">Quyền hạn (Role)</th>
                      <th className="text-right font-semibold px-4 py-3">Gán Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => {
                      const role = u.user_metadata?.role || 'customer';
                      return (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {u.user_metadata?.avatar_url ? (
                                <img src={u.user_metadata.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                                  {u.email?.substring(0, 2)}
                                </div>
                              )}
                              <span className="font-semibold text-foreground">{u.user_metadata?.full_name || 'Khách hàng'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : ''}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase ${
                              role === 'admin' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : role === 'staff' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-muted text-muted-foreground border-border'
                            }`}>
                              {role === 'admin' ? 'Quản trị' : role === 'staff' ? 'Nhân viên' : 'Khách hàng'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <select
                              value={role}
                              disabled={updatingUserRole === u.id}
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                              className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                            >
                              <option value="customer">Khách hàng</option>
                              <option value="staff">Nhân viên</option>
                              <option value="admin">Quản trị viên</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">Không tải được thông tin thành viên.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* PANEL: HỖ TRỢ KHÁCH HÀNG (TICKETS) */}
        {/* ========================================== */}
        {panel === 'tickets' && (
          <div className="space-y-4">
            <div className="border-b border-border pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground">Ticket hỗ trợ ({tickets.length})</h1>
                <p className="text-xs text-muted-foreground">Đồng bộ các yêu cầu đàm phán giá, kỹ thuật do AI Chatbot phát hiện hoặc khách hàng tự gửi</p>
              </div>
              <select
                value={ticketFilterStatus}
                onChange={(e) => setTicketFilterStatus(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="open">Mới nhận (Open)</option>
                <option value="in_progress">Đang xử lý (In Progress)</option>
                <option value="resolved">Đã giải quyết (Resolved)</option>
              </select>
            </div>

            {/* Grid 2 cột: Bảng danh sách & Khung Live Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Cột bên trái: Danh sách Tickets */}
              <div className="lg:col-span-2 rounded-2xl border border-border overflow-hidden overflow-x-auto bg-card/10">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">Khách hàng</th>
                      <th className="text-left font-semibold px-4 py-3">Danh mục</th>
                      <th className="text-left font-semibold px-4 py-3">Rủi ro (Risk)</th>
                      <th className="text-left font-semibold px-4 py-3">Trạng thái</th>
                      <th className="text-right font-semibold px-4 py-3">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTickets.map((t) => (
                      <tr 
                        key={t.id} 
                        onClick={() => setSelectedTicket(t)}
                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedTicket?.id === t.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="space-y-1 text-left">
                            <span className="font-semibold text-foreground block truncate max-w-[160px]">
                              {(() => {
                                const matched = users.find(u => u.id === t.customer_id);
                                return matched ? matched.email : 'Khách ẩn danh';
                              })()}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{formatDate(t.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted border border-border capitalize">
                            {t.category === 'advisory' ? 'Tư vấn' : t.category === 'negotiation' ? 'Đàm phán giá' : t.category === 'technical' ? 'Kỹ thuật' : t.category === 'attack_flagged' ? 'Cảnh báo' : t.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            t.risk_level === 'high' ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'
                          }`}>
                            {t.risk_level}
                          </span>
                        </td>
                        <td className="px-4 py-3">{getTicketStatusBadge(t.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(t);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold transition-all cursor-pointer"
                          >
                            Xử lý
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">Chưa có ticket hỗ trợ nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cột bên phải: KHUNG CHAT TO TRỰC TIẾP (Ticket Chat Panel) */}
              <div className="lg:col-span-1 rounded-2xl border border-border bg-card/40 p-4 shadow-sm flex flex-col h-[520px] overflow-hidden">
                {selectedTicket ? (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Header Chat Panel */}
                    <div className="border-b border-border pb-3 mb-3 flex items-center justify-between flex-shrink-0">
                      <div className="text-left">
                        <h4 className="font-extrabold text-sm text-foreground line-clamp-1">Mã: #{selectedTicket.id.substring(0, 8)}...</h4>
                        <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]">
                          {(() => {
                            const matched = users.find(u => u.id === selectedTicket.customer_id);
                            return matched ? matched.email : 'Khách ẩn danh';
                          })()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {getTicketStatusBadge(selectedTicket.status)}
                      </div>
                    </div>

                    {/* Khung tin nhắn chat cuộn */}
                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin flex flex-col p-1">
                      {(() => {
                        let ticketMessages = [];
                        try {
                          const parsed = JSON.parse(selectedTicket.note);
                          if (Array.isArray(parsed)) ticketMessages = parsed;
                        } catch (e) {
                          ticketMessages = [{ role: 'customer', message: selectedTicket.note, created_at: selectedTicket.created_at }];
                        }

                        return ticketMessages.map((msg: any, idx: number) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === 'staff' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="flex flex-col space-y-0.5 max-w-[85%]">
                              <span className={`text-[8px] text-muted-foreground block ${msg.role === 'staff' ? 'text-right' : 'text-left'}`}>
                                {msg.role === 'staff' ? 'Nhân viên (Bạn)' : 'Khách hàng'}
                              </span>
                              
                              <div
                                className={`rounded-xl p-2.5 leading-relaxed text-xs shadow-sm ${
                                  msg.role === 'staff'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-card border border-border text-foreground rounded-tl-none'
                                }`}
                              >
                                {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                                
                                {/* HIỂN THỊ ẢNH ĐÍNH KÈM NẾU CÓ */}
                                {msg.image_url && (
                                  <div className="mt-1.5 max-w-[200px] overflow-hidden rounded-lg border border-border">
                                    <img 
                                      src={msg.image_url} 
                                      alt="đính kèm" 
                                      className="w-full h-auto object-cover cursor-pointer hover:scale-105 transition-all"
                                      onClick={() => window.open(msg.image_url, '_blank')}
                                    />
                                  </div>
                                )}
                              </div>
                              <span className={`text-[7px] text-muted-foreground/80 block ${msg.role === 'staff' ? 'text-right' : 'text-left'}`}>
                                {formatDate(msg.created_at)}
                              </span>
                            </div>
                          </div>
                        ));
                      })()}
                      <div ref={adminChatEndRef} />
                    </div>

                    {/* Ô nhập chat kèm đính kèm ảnh */}
                    {selectedTicket.status !== 'resolved' ? (
                      <form onSubmit={handleSendTicketReply} className="pt-3 border-t border-border/60 flex flex-col gap-2 flex-shrink-0">
                        {/* Ảnh preview trước khi gửi */}
                        {pendingImage && (
                          <div className="relative w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted self-start flex-shrink-0 group">
                            <img src={pendingImage} alt="preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setPendingImage(null)}
                              className="absolute top-0 right-0 p-0.5 bg-black/60 rounded-bl-lg text-white hover:text-destructive transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex gap-1.5 items-center">
                          {/* Nút upload ảnh */}
                          <label className="p-2.5 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all flex-shrink-0">
                            <Plus className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>

                          <input
                            type="text"
                            value={ticketReplyNote}
                            onChange={(e) => setTicketReplyNote(e.target.value)}
                            placeholder="Gõ phản hồi gửi trực tiếp cho khách..."
                            className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                          />
                          <button
                            type="submit"
                            disabled={(!ticketReplyNote.trim() && !pendingImage) || updatingTicket}
                            className="px-3.5 h-9 rounded-xl bg-primary hover:opacity-90 disabled:opacity-40 text-primary-foreground text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
                          >
                            Gửi
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={updatingTicket}
                          onClick={() => handleUpdateTicket(selectedTicket.id, 'resolved')}
                          className="w-full py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-500/20 cursor-pointer transition-all text-center mt-1"
                        >
                          Giải quyết xong & Đóng Ticket
                        </button>
                      </form>
                    ) : (
                      <div className="p-2.5 bg-emerald-500/5 text-emerald-600 rounded-xl border border-emerald-500/15 text-[10px] font-bold text-center mt-2 flex-shrink-0">
                        ✓ Ticket này đã hoàn thành giải quyết và đóng lại.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                    <MessageSquare className="w-10 h-10 opacity-30 text-primary animate-pulse" />
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-xs text-foreground">Chưa chọn Ticket xử lý</h5>
                      <p className="text-[10px] max-w-[180px] leading-relaxed">Chọn bất kỳ yêu cầu nào ở bảng bên trái để bắt đầu chat Live trực tiếp với khách hàng.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* MODAL 1: XEM CHI TIẾT ĐƠN HÀNG (ADMIN XỬ LÝ TRẠNG THÁI) */}
      {/* ========================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
              <h2 className="text-lg font-bold text-foreground">Chi tiết đơn hàng #{selectedOrder.id.substring(0, 8)}...</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm">
              {/* Thông tin vận chuyển */}
              <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Thông tin giao hàng</span>
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedOrder.shipping_address}</p>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">Đặt lúc: {formatDate(selectedOrder.created_at)}</span>
                </div>
              </div>

              {/* Thay đổi trạng thái đơn */}
              <div className="space-y-2 border-t border-border pt-4">
                <label className="text-xs font-bold text-muted-foreground block">Thay đổi trạng thái giao hàng:</label>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'processing', 'shipping', 'delivered', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      disabled={updatingOrderStatus}
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        selectedOrder.status === st 
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20' 
                          : 'bg-background hover:bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {st === 'pending' && 'Chờ xử lý'}
                      {st === 'processing' && 'Duyệt / Chuẩn bị'}
                      {st === 'shipping' && 'Bắt đầu giao'}
                      {st === 'delivered' && 'Hoàn thành'}
                      {st === 'cancelled' && 'Hủy đơn'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div className="space-y-3 border-t border-border pt-4">
                <h3 className="font-bold text-foreground text-sm">Sản phẩm đã mua</h3>
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-lg border border-border p-1 bg-background flex-shrink-0 flex items-center justify-center">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground line-clamp-1 text-xs">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">Giá bán: {formatPrice(item.price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                        <p className="text-xs font-bold text-foreground">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng thanh toán */}
              <div className="flex justify-between items-center border-t border-border pt-4 text-sm font-bold bg-muted/10 p-3 rounded-xl">
                <span className="text-muted-foreground">Tổng cộng toàn bộ đơn hàng:</span>
                <span className="text-base text-primary font-black">{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================= */}
      {/* MODAL 3: THÊM / SỬA SẢN PHẨM (DÙNG SPECS EDITOR KEY-VALUE) */}
      {/* ========================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-lg font-bold text-foreground">{editingProduct ? 'Sửa thông tin sản phẩm' : 'Thêm sản phẩm mới'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Tên sản phẩm</label>
                <input
                  required
                  value={formProduct.name}
                  onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
                  placeholder="Ví dụ: iPhone 15 Pro Max 256GB"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Thương hiệu</label>
                  <input
                    required
                    value={formProduct.brand}
                    onChange={(e) => setFormProduct({ ...formProduct, brand: e.target.value })}
                    placeholder="Ví dụ: Apple, Samsung"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Danh mục</label>
                  <select
                    value={formProduct.category}
                    onChange={(e) => setFormProduct({ ...formProduct, category: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer transition-colors"
                  >
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Giá niêm yết (VNĐ)</label>
                  <input
                    type="number"
                    required
                    value={formProduct.price}
                    onChange={(e) => setFormProduct({ ...formProduct, price: Number(e.target.value) })}
                    placeholder="Nhập giá VNĐ..."
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Tồn kho</label>
                  <input
                    type="number"
                    required
                    value={formProduct.stock}
                    onChange={(e) => setFormProduct({ ...formProduct, stock: Number(e.target.value) })}
                    placeholder="Nhập số lượng..."
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Địa chỉ URL ảnh</label>
                <input
                  required
                  value={formProduct.images?.[0] || ''}
                  onChange={(e) => setFormProduct({ ...formProduct, images: [e.target.value] })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  value={formProduct.description}
                  onChange={(e) => setFormProduct({ ...formProduct, description: e.target.value })}
                  placeholder="Nhập mô tả sản phẩm..."
                  className="w-full p-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary resize-none transition-colors"
                />
              </div>

              {/* TRƯỜNG DỮ LIỆU BỔ SUNG: LINK AMAZON & SỐ LƯỢT ĐÁNH GIÁ */}
              <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <span>🌐 Đường dẫn Amazon gốc</span>
                    <span className="text-[10px] font-normal text-muted-foreground">(original_link)</span>
                  </label>
                  <input
                    value={amazonLink}
                    onChange={(e) => setAmazonLink(e.target.value)}
                    placeholder="https://www.amazon.in/dp/..."
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <span>⭐ Lượt đánh giá Amazon</span>
                    <span className="text-[10px] font-normal text-muted-foreground">(ratings_count)</span>
                  </label>
                  <input
                    type="number"
                    value={ratingsCount}
                    onChange={(e) => setRatingsCount(e.target.value)}
                    placeholder="Ví dụ: 15480"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* SECTION: QUẢN LÝ CẤU HÌNH BIẾN THỂ (VARIANTS) */}
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground">⚙️ Cấu hình / Phiên bản (Variants)</label>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm cấu hình</span>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Ví dụ: 6GB RAM / 128GB — giá tương ứng sẽ hiển thị khi khách chọn cấu hình đó.</p>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {variantRows.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 italic text-center">Chưa có cấu hình nào. Bấm thêm để điền.</p>
                  ) : (
                    variantRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-1.5 items-center">
                        <input
                          type="text"
                          placeholder="Nhãn (vd: 6GB+128GB)"
                          value={row.label}
                          onChange={(e) => updateVariantRow(idx, 'label', e.target.value)}
                          className="col-span-2 h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                        <input
                          type="number"
                          placeholder="Giá (VNĐ)"
                          value={row.price}
                          onChange={(e) => updateVariantRow(idx, 'price', e.target.value)}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="RAM (vd: 6GB)"
                          value={row.ram}
                          onChange={(e) => updateVariantRow(idx, 'ram', e.target.value)}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="Storage"
                            value={row.storage}
                            onChange={(e) => updateVariantRow(idx, 'storage', e.target.value)}
                            className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantRow(idx)}
                            className="p-2 rounded-lg border border-border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION: QUẢN LÝ MÀU SẮC */}
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground">🎨 Màu sắc sản phẩm</label>
                  <button
                    type="button"
                    onClick={addColorRow}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm màu</span>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Mỗi màu sắc có thể có ảnh riêng. Khi khách chọn màu, ảnh chính sẽ đổi sang ảnh màu đó.</p>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {colorRows.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 italic text-center">Chưa có màu sắc nào. Bấm thêm để điền.</p>
                  ) : (
                    colorRows.map((row, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Tên màu (vd: Đen, Đỏ Cuồng Nhiệt)"
                          value={row.name}
                          onChange={(e) => updateColorRow(idx, 'name', e.target.value)}
                          className="w-36 h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="URL ảnh của màu này..."
                          value={row.image}
                          onChange={(e) => updateColorRow(idx, 'image', e.target.value)}
                          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => removeColorRow(idx)}
                          className="p-2 rounded-lg border border-border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SPECS EDITOR (KEY-VALUE ĐỘNG) */}
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground">Thông số kỹ thuật (Specs)</label>
                  <button
                    type="button"
                    onClick={addSpecRow}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm thông số</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {specRows.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 italic text-center">Chưa có thông số kỹ thuật nào. Bấm thêm để điền (ví dụ: CPU, RAM...)</p>
                  ) : (
                    specRows.map((row, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Tên thông số (ví dụ: RAM)"
                          value={row.key}
                          onChange={(e) => updateSpecRow(idx, 'key', e.target.value)}
                          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Giá trị (ví dụ: 16GB)"
                          value={row.value}
                          onChange={(e) => updateSpecRow(idx, 'value', e.target.value)}
                          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => removeSpecRow(idx)}
                          className="p-2 rounded-lg border border-border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border z-10 sticky bottom-0 bg-card">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-sm font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground text-sm font-bold shadow-md shadow-primary/15 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {savingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
