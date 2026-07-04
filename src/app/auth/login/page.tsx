'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Chrome } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Nếu user đã đăng nhập sẵn, chuyển hướng trực tiếp về trang cá nhân
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.push('/account');
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu!');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        router.push('/account');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err);
      // Fallback cho chế độ test offline nếu chưa cấu hình Supabase Auth thực tế
      if (err.message && err.message.includes('fetch')) {
        setErrorMsg('Lỗi kết nối Supabase CSDL. Đang chuyển hướng chế độ Mock Test...');
        // Mock Login: lưu trạng thái đăng nhập giả định vào localStorage
        localStorage.setItem('mock_user_logged', 'true');
        setTimeout(() => {
          router.push('/account');
        }, 1500);
      } else {
        setErrorMsg(err.message || 'Email hoặc Mật khẩu không chính xác.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Lỗi đăng nhập Google OAuth:', err);
      setErrorMsg(err.message || 'Không thể kết nối dịch vụ Google OAuth.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 bg-gradient-to-b from-slate-950 to-slate-900 relative">
      {/* Background blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-blue-500/5 blur-[100px] z-0" />

      <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-6 sm:p-8 space-y-6 relative z-10 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-white">Đăng nhập tài khoản</h1>
          <p className="text-xs text-slate-500">Khám phá các thiết bị công nghệ đỉnh cao và dịch vụ hỗ trợ AI</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Địa chỉ Email</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-800 bg-slate-900/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500"
              />
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-400">Mật khẩu</label>
              <span className="text-[10px] text-blue-500 hover:underline cursor-pointer">Quên mật khẩu?</span>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-800 bg-slate-900/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500"
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-850 text-white text-sm font-bold shadow-lg shadow-blue-500/15 hover:shadow-blue-500/35 active:scale-[0.98] disabled:scale-100 transition-all pt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Dấu phân cách */}
        <div className="relative flex items-center justify-center text-[10px] uppercase font-bold text-slate-600 tracking-wider">
          <div className="border-t border-slate-900 flex-1"></div>
          <span className="px-3 bg-slate-950 relative z-10">Hoặc tiếp tục với</span>
          <div className="border-t border-slate-900 flex-1"></div>
        </div>

        {/* Đăng nhập OAuth Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 text-slate-200 text-xs sm:text-sm font-semibold hover:border-slate-700 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          ) : (
            <Chrome className="w-4 h-4 text-red-500" />
          )}
          <span>Đăng nhập Google</span>
        </button>

        {/* Đăng ký */}
        <p className="text-center text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link href="/auth/register" className="text-blue-500 hover:underline font-semibold">
            Đăng ký miễn phí
          </Link>
        </p>
      </div>
    </div>
  );
}
