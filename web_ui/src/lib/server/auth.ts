import { NextResponse } from 'next/server';
import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type AllowedRole = 'admin' | 'staff' | 'customer';

export interface AuthSuccess {
  user: User;
  role: AllowedRole;
  errorResponse?: null;
}

export interface AuthFailure {
  user?: null;
  role?: null;
  errorResponse: NextResponse;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Xác thực token và kiểm tra quyền dựa trên bảng `user_roles` (nguồn quyền server-side duy nhất).
 * Tuyệt đối không dùng `user_metadata.role` vì client có thể tự sửa đổi.
 */
export async function requireRole(
  request: Request,
  allowedRoles: AllowedRole[] = ['admin', 'staff']
): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      errorResponse: NextResponse.json(
        {
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Không tìm thấy mã xác thực Authorization Header (Bearer token)',
          },
        },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return {
      errorResponse: NextResponse.json(
        {
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Token xác thực không được để trống',
          },
        },
        { status: 401 }
      ),
    };
  }

  // 1. Xác thực token với Supabase Auth
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    return {
      errorResponse: NextResponse.json(
        {
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Token xác thực không hợp lệ hoặc phiên đăng nhập đã hết hạn',
          },
        },
        { status: 401 }
      ),
    };
  }

  // 2. Truy vấn role từ bảng `public.user_roles` bằng Service Role Client (RLS deny-all đối với client)
  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleError) {
    console.error('[auth] Lỗi khi truy vấn user_roles:', roleError);
    return {
      errorResponse: NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Không thể xác thực quyền hạn người dùng',
          },
        },
        { status: 500 }
      ),
    };
  }

  const userRole = (roleRow?.role as AllowedRole) || 'customer';

  // 3. Kiểm tra xem role của user có nằm trong allowedRoles không
  if (!allowedRoles.includes(userRole)) {
    return {
      errorResponse: NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: `Quyền truy cập bị từ chối: yêu cầu vai trò [${allowedRoles.join(', ')}]`,
          },
        },
        { status: 403 }
      ),
    };
  }

  return { user, role: userRole };
}
