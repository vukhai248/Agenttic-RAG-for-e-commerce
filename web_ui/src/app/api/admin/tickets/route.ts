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
    return { error: 'Bạn không có quyền truy cập dữ liệu hỗ trợ khách hàng!' };
  }

  return { user };
}

// 1. GET API: Lấy danh sách toàn bộ support tickets
export async function GET(request: Request) {
  try {
    const { error: authError } = await verifyAdminOrStaffRequest(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { data: tickets, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ tickets: tickets || [] });
  } catch (error: any) {
    console.error('Lỗi khi tải danh sách support tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống khi tải danh sách ticket' },
      { status: 500 }
    );
  }
}

// 2. PUT API: Cập nhật thông tin / trạng thái / phản hồi của ticket
export async function PUT(request: Request) {
  try {
    const { error: authError } = await verifyAdminOrStaffRequest(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const body = await request.json();
    const { ticketId, status, note, assigned_staff_id } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Thiếu ticketId cần cập nhật' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (status !== undefined) updatePayload.status = status;
    if (note !== undefined) updatePayload.note = note;
    if (assigned_staff_id !== undefined) updatePayload.assigned_staff_id = assigned_staff_id;

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, ticket: data });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống khi cập nhật ticket' },
      { status: 500 }
    );
  }
}
