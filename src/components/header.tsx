'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/store/useCart';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, User, Search, Laptop, Smartphone, Watch, Headphones, Layers, Sun, Moon } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const totalItems = useCart((state) => state.getTotalItems());
  useEffect(() => {
    // Lấy thông tin user hiện tại từ Supabase Auth
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getUser();

    // Lắng nghe thay đổi trạng thái đăng nhập
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    // Phát hiện theme hiện tại
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('mock_user_logged');
    router.push('/');
    router.refresh();
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md transition-colors duration-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="bg-primary p-2 rounded-lg text-primary-foreground font-bold shadow-md shadow-primary/20 transition-all">
            AG
          </span>
          <span className="text-xl font-extrabold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent group-hover:text-primary transition-all">
            Antigravity E-Shop
          </span>
        </Link>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearch} className="hidden md:flex relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm, thương hiệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-4 pr-10 rounded-full border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all"
          />
          <button type="submit" className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </form>

        {/* NAVIGATION & ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          {/* NÚT TOGGLE THEME */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={theme === 'light' ? 'Chuyển sang Dark Mode' : 'Chuyển sang Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5 text-primary" />
            )}
          </button>

          {/* GIỎ HÀNG */}
          <Link href="/cart" className="relative p-2.5 text-muted-foreground hover:text-foreground transition-colors">
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-md shadow-primary/35 animate-bounce">
                {totalItems}
              </span>
            )}
          </Link>

          {/* HỒ SƠ CÁ NHÂN / ĐĂNG NHẬP */}
          {user ? (
            <Link
              href="/account"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border hover:border-muted-foreground/35 transition-colors cursor-pointer"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground uppercase">
                  {user.email?.substring(0, 2)}
                </div>
              )}
              <span className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground max-w-[120px] truncate font-medium">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-primary/45 transition-all"
            >
              <User className="w-4 h-4" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {/* DANH MỤC SẢN PHẨM Ở DƯỚI */}
      <div className="border-t border-border bg-card">
        <div className="container mx-auto px-4 flex items-center justify-start overflow-x-auto gap-6 h-10 text-xs no-scrollbar">
          <Link href="/products" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors py-1.5 whitespace-nowrap">
            Tất cả sản phẩm
          </Link>
          <Link href="/products?category=laptop" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors py-1.5 whitespace-nowrap">
            <Laptop className="w-3.5 h-3.5" />
            Laptop
          </Link>
          <Link href="/products?category=phone" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors py-1.5 whitespace-nowrap">
            <Smartphone className="w-3.5 h-3.5" />
            Điện thoại
          </Link>
          <Link href="/products?category=smartwatch" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors py-1.5 whitespace-nowrap">
            <Watch className="w-3.5 h-3.5" />
            Đồng hồ
          </Link>
          <Link href="/products?category=earphone" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors py-1.5 whitespace-nowrap">
            <Headphones className="w-3.5 h-3.5" />
            Tai nghe
          </Link>
          <Link href="/products?category=accessory" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors py-1.5 whitespace-nowrap">
            <Layers className="w-3.5 h-3.5" />
            Phụ kiện
          </Link>
        </div>
      </div>
    </header>
  );
}

