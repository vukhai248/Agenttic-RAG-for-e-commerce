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

// Hàm kiểm tra quyền Admin hoặc Staff của request
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
    return { error: 'Bạn không có quyền truy cập nhật ký hội thoại quản trị!' };
  }

  return { user };
}

// GET API: Lấy danh sách nhật ký hội thoại (chat_logs)
export async function GET(request: Request) {
  try {
    const { error: authError } = await verifyAdminOrStaffRequest(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const riskLevel = searchParams.get('riskLevel');
    const role = searchParams.get('role');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 500);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    let query = supabaseAdmin
      .from('chat_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }
    if (role) {
      query = query.eq('role', role);
    }

    const { data: logs, count, error } = await query;

    if (error) {
      // Nếu cột guard_decision_ids chưa có trong DB cũ, fallback query không fail
      console.error('Lỗi khi truy vấn chat_logs từ DB:', error);
      throw error;
    }

    return NextResponse.json({
      chat_logs: logs || [],
      total: count || (logs ? logs.length : 0),
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Lỗi API GET /api/admin/chat-logs:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống khi tải nhật ký hội thoại' },
      { status: 500 }
    );
  }
}
