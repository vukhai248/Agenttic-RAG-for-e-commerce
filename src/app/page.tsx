'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Laptop, Smartphone, Watch, Headphones, Layers, ArrowRight, Star, ShoppingCart } from 'lucide-react';
import { useCart } from '@/store/useCart';

// Dữ liệu fallback tĩnh giống hệt seed data trong setup.sql để website hoạt động khi chưa có DB
const FALLBACK_PRODUCTS = [
  {
    id: 'prod-air-m3',
    category: 'laptop',
    brand: 'Apple',
    name: 'MacBook Air M3 13 inch',
    price: 27990000,
    stock: 15,
    description: 'MacBook Air M3 phiên bản 2024 siêu mỏng nhẹ, hiệu năng cực đỉnh nhờ chip Apple M3 thế hệ mới.',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
    rating_avg: 4.8
  },
  {
    id: 'prod-iphone15-pm',
    category: 'phone',
    brand: 'Apple',
    name: 'iPhone 15 Pro Max 256GB',
    price: 29990000,
    stock: 25,
    description: 'Siêu phẩm iPhone 15 Pro Max với khung viền Titanium siêu nhẹ và bền bỉ. Camera zoom quang học 5x cực đại.',
    images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600'],
    rating_avg: 4.8
  },
  {
    id: 'prod-s24-ultra',
    category: 'phone',
    brand: 'Samsung',
    name: 'Samsung Galaxy S24 Ultra 256GB',
    price: 26990000,
    stock: 20,
    description: 'Galaxy S24 Ultra tích hợp trí tuệ nhân tạo Galaxy AI vượt trội và bút S Pen đi kèm tiện dụng.',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'],
    rating_avg: 4.7
  },
  {
    id: 'prod-watch-ultra2',
    category: 'smartwatch',
    brand: 'Apple',
    name: 'Apple Watch Ultra 2 Titanium',
    price: 21490000,
    stock: 10,
    description: 'Đồng hồ thể thao chuyên nghiệp bền bỉ nhất của Apple với vỏ Titanium hàng không và mặt kính Sapphire.',
    images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'],
    rating_avg: 4.8
  },
  {
    id: 'prod-airpods-pro2',
    category: 'earphone',
    brand: 'Apple',
    name: 'Apple AirPods Pro Gen 2 USB-C',
    price: 5690000,
    stock: 30,
    description: 'Tai nghe True Wireless tốt nhất dành cho người dùng hệ sinh thái Apple. Khả năng chống ồn chủ động ANC đỉnh cao.',
    images: ['https://images.unsplash.com/photo-1588449668338-d134ae7f3639?w=600'],
    rating_avg: 4.8
  },
  {
    id: 'prod-wf-1000xm5',
    category: 'earphone',
    brand: 'Sony',
    name: 'Sony WF-1000XM5',
    price: 5990000,
    stock: 15,
    description: 'Đỉnh cao chống ồn chủ động của thế giới tai nghe In-ear. Hỗ trợ giải mã âm thanh chất lượng cao Hi-Res Audio LDAC.',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'],
    rating_avg: 4.7
  },
  {
    id: 'prod-sarc-gan-67w',
    category: 'accessory',
    brand: 'Anker',
    name: 'Sạc Anker Prime GaN 67W 3 Cổng',
    price: 990000,
    stock: 50,
    description: 'Củ sạc siêu nhỏ gọn sử dụng vật liệu GaN thế hệ mới giúp tản nhiệt mát mẻ và tối ưu công suất.',
    images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'],
    rating_avg: 4.7
  },
  {
    id: 'prod-chuot-mx3s',
    category: 'accessory',
    brand: 'Logitech',
    name: 'Chuột không dây Logitech MX Master 3S',
    price: 2490000,
    stock: 20,
    description: 'Chuột công thái học hàng đầu dành cho lập trình viên và dân văn phòng chuyên nghiệp. Cảm biến 8000 DPI siêu nhạy.',
    images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600'],
    rating_avg: 4.9
  }
];

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useCart((state) => state.addItem);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setIsLoading(true);
      try {
        // Query ngẫu nhiên 8 sản phẩm từ bảng products
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(8);

        if (error || !data || data.length === 0) {
          throw new Error('Supabase trống hoặc chưa cấu hình');
        }
        setProducts(data);
      } catch (err) {
        console.warn('Lỗi kết nối CSDL, sử dụng dữ liệu tĩnh fallback:', err);
        setProducts(FALLBACK_PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleAddToCart = (e: React.MouseEvent, prod: any) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.images[0],
      category: prod.category,
      brand: prod.brand,
    });
    alert(`Đã thêm "${prod.name}" vào giỏ hàng!`);
  };

  return (
    <div className="flex flex-col gap-16 pb-16 transition-colors duration-200">
      {/* 1. HERO BANNER */}
      <section className="relative w-full h-[450px] md:h-[550px] bg-gradient-to-tr from-card via-background to-primary/5 flex items-center border-b border-border">
        {/* Glow Effects */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full bg-primary/10 blur-[120px]" />

        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 items-center gap-8 relative z-10">
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Công Nghệ Đột Phá - Trải Nghiệm Premium
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight">
              Khởi nguồn của <br />
              <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Kỷ Nguyên Công Nghệ
              </span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md leading-relaxed">
              Trang bị các thiết bị Laptop cấu hình khủng, Điện thoại flagship đỉnh cao, Đồng hồ thông minh dã ngoại và Tai nghe chống ồn tốt nhất hiện nay.
            </p>
            <div className="flex gap-4">
              <Link
                href="/products"
                className="flex items-center gap-2 px-6 py-3 font-semibold rounded-full bg-primary hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/15 active:scale-95 transition-all text-sm cursor-pointer"
              >
                <span>Mua sắm ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/policy/warranty"
                className="flex items-center gap-2 px-6 py-3 font-semibold rounded-full border border-border hover:border-muted-foreground/35 bg-card text-muted-foreground hover:text-foreground transition-all text-sm"
              >
                Chính sách bảo hành
              </Link>
            </div>
          </div>

          <div className="hidden md:flex justify-center relative">
            {/* Ảnh mockup trừu tượng */}
            <div className="w-[380px] h-[380px] rounded-3xl bg-card border border-border flex items-center justify-center p-8 relative overflow-hidden shadow-2xl group hover:border-primary/30 transition-all duration-500">
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors" />
              <img
                src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500"
                alt="MacBook Pro"
                className="w-full h-auto object-contain rounded-xl shadow-lg transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. DANH MỤC SẢN PHẨM NỔI BẬT */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">Tìm kiếm theo danh mục</h2>
          <p className="text-muted-foreground text-xs md:text-sm">Khám phá các thiết bị công nghệ được tuyển chọn kỹ lưỡng</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: 'Laptop', slug: 'laptop', icon: Laptop, color: 'hover:border-primary/40' },
            { name: 'Điện thoại', slug: 'phone', icon: Smartphone, color: 'hover:border-primary/40' },
            { name: 'Đồng hồ', slug: 'smartwatch', icon: Watch, color: 'hover:border-primary/40' },
            { name: 'Tai nghe', slug: 'earphone', icon: Headphones, color: 'hover:border-primary/40' },
            { name: 'Phụ kiện', slug: 'accessory', icon: Layers, color: 'hover:border-primary/40' },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className={`p-6 rounded-2xl bg-card border border-border hover:-translate-y-1 active:translate-y-0 text-center flex flex-col items-center gap-4 transition-all duration-300 group ${cat.color}`}
              >
                <div className="p-4 rounded-xl bg-background text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-muted-foreground text-sm group-hover:text-foreground transition-colors">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. SẢN PHẨM NỔI BẬT */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Sản phẩm bán chạy nhất</h2>
            <p className="text-xs text-muted-foreground">Các mặt hàng có lượt mua cao và đánh giá xuất sắc</p>
          </div>
          <Link href="/products" className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-all">
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-card/60 animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((prod) => (
              <Link
                key={prod.id}
                href={`/products/${prod.id}`}
                className="group rounded-2xl border border-border bg-card/30 hover:bg-card/70 hover:border-muted-foreground/35 p-4 flex flex-col justify-between transition-all duration-300 relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Ảnh sản phẩm */}
                  <div className="w-full aspect-square rounded-xl bg-background flex items-center justify-center overflow-hidden relative border border-border/40">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-[85%] h-[85%] object-contain transform group-hover:scale-105 transition-transform duration-300"
                    />
                    {prod.rating_avg && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/90 border border-border text-[10px] text-yellow-500 font-bold">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span>{prod.rating_avg}</span>
                      </span>
                    )}
                  </div>
                  {/* Thông tin */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                      {prod.brand}
                    </span>
                    <h3 className="font-bold text-foreground text-sm md:text-base line-clamp-1 group-hover:text-primary transition-colors mt-0.5">
                      {prod.name}
                    </h3>
                    <p className="text-muted-foreground text-xs line-clamp-2 mt-1.5 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 border-t border-border/50 pt-3">
                  <span className="font-extrabold text-primary text-sm md:text-base whitespace-nowrap">
                    {formatPrice(prod.price)}
                  </span>
                  <button
                    onClick={(e) => handleAddToCart(e, prod)}
                    className="p-2 rounded-xl bg-primary hover:opacity-90 text-primary-foreground shadow-md shadow-primary/10 active:scale-95 transition-all cursor-pointer"
                    title="Thêm vào giỏ"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
