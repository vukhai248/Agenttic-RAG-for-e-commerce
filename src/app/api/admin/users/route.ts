import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase Admin Client bằng Service Role Key (quyền tối cao bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Hàm hỗ trợ kiểm tra quyền Admin của request dựa trên Token gửi lên từ client
async function verifyAdminRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Không tìm thấy mã xác thực Authorization Header' };
  }

  const token = authHeader.split(' ')[1];
  
  // Khởi tạo client tạm bằng token của người dùng để xác thực thông tin
  const tempClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: {
      persistSession: false
    }
  });

  const { data: { user }, error } = await tempClient.auth.getUser(token);

  if (error || !user) {
    return { error: 'Token không hợp lệ hoặc phiên đăng nhập đã hết hạn!' };
  }

  // Phân quyền admin dựa trên metadata hoặc email
  const userRole = user.user_metadata?.role;
  const isUserAdmin = userRole === 'admin' || user.email === 'admin@gmail.com' || user.email === 'vugiakhai2004@gmail.com' || user.email?.toLowerCase().includes('admin');

  if (!isUserAdmin) {
    return { error: 'Bạn không có quyền quản trị để thực hiện hành động này!' };
  }

  return { user };
}

// 1. GET API: Lấy danh sách toàn bộ người dùng trong hệ thống
export async function GET(request: Request) {
  try {
    const { error: authError } = await verifyAdminRequest(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    // Lấy danh sách users từ Supabase Auth Admin API
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách users:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống khi tải danh sách người dùng' },
      { status: 500 }
    );
  }
}

// 2. PUT API: Cập nhật Role cho một người dùng
export async function PUT(request: Request) {
  try {
    const { error: authError } = await verifyAdminRequest(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Thiếu userId hoặc role cần cập nhật' }, { status: 400 });
    }

    // Lấy thông tin user hiện tại để giữ lại các metadata cũ (tránh ghi đè mất name, avatar...)
    const { data: { user }, error: getError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getError || !user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng cần cập nhật' }, { status: 404 });
    }

    const currentMetadata = user.user_metadata || {};
    const updatedMetadata = { ...currentMetadata, role };

    // Cập nhật metadata mới của user chứa role
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: updatedMetadata }
    );

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, user: updatedUser.user });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật role user:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống khi cập nhật vai trò người dùng' },
      { status: 500 }
    );
  }
}
