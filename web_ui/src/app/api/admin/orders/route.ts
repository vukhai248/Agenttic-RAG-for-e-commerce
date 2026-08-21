import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase Admin Client bằng Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Hàm kiểm tra quyền Admin hoặc Staff của request dựa trên Authorization Token (Phân quyền role động, không hardcode email)
async function verifyAdminOrStaffRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Không tìm thấy mã xác thực Authorization Header' };
  }

  const token = authHeader.split(' ')[1];
  
  const tempClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: {
      persistSession: false
    }
  });

  const { data: { user }, error } = await tempClient.auth.getUser(token);

  if (error || !user) {
    return { error: 'Token không hợp lệ hoặc phiên đăng nhập đã hết hạn!' };
  }

  const userRole = user.user_metadata?.role;
  const isAuthorized = userRole === 'admin' || userRole === 'staff';

  if (!isAuthorized) {
    return { error: 'Bạn không có quyền truy cập dữ liệu quản trị đơn hàng!' };
  }

  return { user };
}

// 1. GET API: Lấy danh sách toàn bộ đơn hàng (hoặc lọc theo userId)
export async function GET(request: Request) {
  try {
    const { error: authError } = await verifyAdminOrStaffRequest(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error: any) {
    console.error('Lỗi khi tải danh sách đơn hàng:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống khi tải danh sách đơn hàng' },
      { status: 500 }
    );
  }
}

// 2. PUT API: Cập nhật trạng thái đơn hàng
export async function PUT(request: Request) {
  try {
    const { error: authError } = await verifyAdminOrStaffRequest(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Thiếu orderId hoặc status cần cập nhật' }, { status: 400 });
    }

    const validStatuses = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Trạng thái đơn hàng không hợp lệ' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống khi cập nhật đơn hàng' },
      { status: 500 }
    );
  }
}
