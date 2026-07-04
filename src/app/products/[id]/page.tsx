'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/store/useCart';
import { Star, ShoppingCart, ShieldCheck, Truck, RefreshCw, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

// Danh sách sản phẩm mock giống hệt để phục vụ chạy offline
const FALLBACK_ALL_PRODUCTS = [
  { id: 'prod-1', category: 'laptop', brand: 'Apple', name: 'MacBook Air M3 13 inch', price: 27990000, stock: 15, description: 'MacBook Air M3 phiên bản 2024 siêu mỏng nhẹ, hiệu năng cực đỉnh nhờ chip Apple M3 thế hệ mới. Thời lượng pin cực trâu lên tới 18 giờ liên tục, phù hợp cho học sinh, sinh viên và dân văn phòng cần di động cao.', specs: { "cpu": "Apple M3 8-Core", "ram": "8GB Unified Memory", "storage": "256GB SSD", "screen": "13.6 inch Liquid Retina (2560x1664)", "gpu": "8-Core GPU", "battery": "52.6Wh (lên đến 18 giờ)", "weight": "1.24kg" }, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600'], rating_avg: 4.8 },
  { id: 'prod-2', category: 'laptop', brand: 'Apple', name: 'MacBook Pro M3 Pro 14 inch', price: 54990000, stock: 8, description: 'MacBook Pro 14 inch trang bị chip M3 Pro mạnh mẽ dành cho lập trình viên, designer chuyên nghiệp. Màn hình Liquid Retina XDR 120Hz sắc nét siêu sáng và đầy đủ các cổng kết nối HDMI, khe thẻ SDXC.', specs: { "cpu": "Apple M3 Pro 11-Core", "ram": "18GB Unified Memory", "storage": "512GB SSD", "screen": "14.2 inch Liquid Retina XDR (3024x1964)", "gpu": "14-Core GPU", "battery": "72.4Wh (lên đến 18 giờ)", "weight": "1.61kg" }, images: ['https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'], rating_avg: 4.9 },
  { id: 'prod-3', category: 'laptop', brand: 'Dell', name: 'Dell XPS 13 Plus 9320', price: 42500000, stock: 5, description: 'Dell XPS 13 Plus sở hữu thiết kế đột phá với thanh Touch Bar ẩn, bàn phím tràn viền vô cực và touchpad tàng hình. CPU Intel Core i7 thế hệ 13 mạnh mẽ đáp ứng mượt mà mọi tác vụ văn phòng và đồ họa bán chuyên nghiệp.', specs: { "cpu": "Intel Core i7-1360P (12 nhân, 16 luồng)", "ram": "16GB LPDDR5 6000MHz", "storage": "512GB SSD PCIe Gen4", "screen": "13.4 inch FHD+ IPS (1920x1200) Touch", "gpu": "Intel Iris Xe Graphics", "battery": "55Wh (khoảng 8-10 giờ)", "weight": "1.26kg" }, images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600'], rating_avg: 4.5 },
  { id: 'prod-6', category: 'phone', brand: 'Apple', name: 'iPhone 15 Pro Max 256GB', price: 29990000, stock: 25, description: 'Siêu phẩm iPhone 15 Pro Max với khung viền Titanium siêu nhẹ và bền bỉ. Nút Action mới thay thế nút gạt rung truyền thống. Hệ thống camera zoom quang học 5x cực đại và vi xử lý Apple A17 Pro 3nm đỉnh cao.', specs: { "chip": "Apple A17 Pro (3nm)", "ram": "8GB", "storage": "256GB", "screen": "6.7 inch Super Retina XDR OLED 120Hz", "battery": "4441mAh (lên đến 29 giờ xem video)", "camera": "48MP (Chính) + 12MP (Góc rộng) + 12MP (Tele 5x)" }, images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600'], rating_avg: 4.8 },
  { id: 'prod-7', category: 'phone', brand: 'Samsung', name: 'Samsung Galaxy S24 Ultra 256GB', price: 26990000, stock: 20, description: 'Galaxy S24 Ultra tích hợp trí tuệ nhân tạo Galaxy AI vượt trội (dịch trực tiếp cuộc gọi, khoanh tròn tìm kiếm thông minh). Bút S Pen đi kèm tiện dụng và thiết kế phẳng viền Titanium sang trọng.', specs: { "chip": "Snapdragon 8 Gen 3 for Galaxy", "ram": "12GB", "storage": "256GB", "screen": "6.8 inch Dynamic AMOLED 2X 120Hz (3120x1440)", "battery": "5000mAh (Sạc nhanh 45W)", "camera": "200MP (Chính) + 50MP (Tele 5x) + 10MP (Tele 3x) + 12MP (Góc rộng)" }, images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'], rating_avg: 4.7 }
];

const MOCK_REVIEWS = [
  { id: 'r1', user_name: 'Nguyễn Văn A', rating: 5, comment: 'Sản phẩm dùng cực kỳ mượt mà, màn hình siêu nét. Giao hàng rất nhanh chỉ trong 2 tiếng hỏa tốc.', created_at: '2026-06-25' },
  { id: 'r2', user_name: 'Trần Thị B', rating: 4, comment: 'Đóng gói chắc chắn, thiết kế rất sang trọng và nhẹ. Tuy nhiên máy chạy tác vụ nặng hơi ấm một chút.', created_at: '2026-06-28' }
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const addItem = useCart((state) => state.addItem);

  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        // 1. Tải chi tiết sản phẩm
        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (prodError || !prodData) {
          throw new Error('Không tìm thấy sản phẩm trên Supabase');
        }

        setProduct(prodData);
        setActiveImage(prodData.images[0]);

        // 2. Tải reviews sản phẩm
        const { data: revData } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', id);

        if (revData) {
          setReviews(revData);
        }
      } catch (err) {
        console.warn('Lỗi kết nối hoặc ID không khớp uuid, sử dụng dữ liệu fallback:', err);
        const found = FALLBACK_ALL_PRODUCTS.find((p) => p.id === id) || FALLBACK_ALL_PRODUCTS[0];
        setProduct(found);
        setActiveImage(found.images[0]);
        setReviews(MOCK_REVIEWS);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      category: product.category,
      brand: product.brand,
    }, quantity);
    alert(`Đã thêm ${quantity} sản phẩm "${product.name}" vào giỏ hàng!`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      category: product.category,
      brand: product.brand,
    }, quantity);
    router.push('/cart');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">Đang tải thông tin sản phẩm...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center flex-1">
        <p className="text-muted-foreground">Không tìm thấy sản phẩm yêu cầu.</p>
        <Link href="/products" className="text-primary hover:underline mt-4 inline-block">
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex-1 space-y-12 transition-colors duration-200">
      {/* Nút quay lại */}
      <div>
        <Link href="/products" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </Link>
      </div>

      {/* THÔNG TIN CHI TIẾT SẢN PHẨM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Cột trái: Thư viện Ảnh */}
        <div className="space-y-4">
          <div className="w-full aspect-square rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden p-8">
            <img src={activeImage} alt={product.name} className="w-[90%] h-[90%] object-contain" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto py-1">
              {product.images.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl bg-card border overflow-hidden p-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    activeImage === img ? 'border-primary shadow-md shadow-primary/10' : 'border-border hover:border-muted-foreground/35'
                  }`}
                >
                  <img src={img} alt={`${product.name} - ${index}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cột phải: Thông tin & Nút mua */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 uppercase">
              {product.brand}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
              {product.name}
            </h1>
            {product.rating_avg && (
              <div className="flex items-center gap-1 text-sm text-yellow-500">
                <Star className="w-4 h-4 fill-yellow-500" />
                <span className="font-bold text-foreground">{product.rating_avg}</span>
                <span className="text-muted-foreground">({reviews.length} đánh giá)</span>
              </div>
            )}
          </div>

          <div className="text-3xl font-black text-primary animate-pulse">
            {formatPrice(product.price)}
          </div>

          {/* Dịch vụ cam kết */}
          <div className="grid grid-cols-3 gap-4 border-y border-border py-4 text-xs text-muted-foreground">
            <div className="flex flex-col items-center text-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Chính hãng 100%</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <span>Giao nhanh toàn quốc</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              <span>Lỗi 1 đổi 1 nhanh chóng</span>
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {product.description}
          </p>

          {/* Số lượng */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-muted-foreground">Số lượng:</span>
            <div className="flex items-center border border-border rounded-xl overflow-hidden bg-card">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all font-bold cursor-pointer"
              >
                -
              </button>
              <span className="w-12 text-center text-foreground font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all font-bold cursor-pointer"
              >
                +
              </button>
            </div>
            <span className="text-xs text-muted-foreground">({product.stock} sản phẩm còn lại)</span>
          </div>

          {/* Các nút hành động */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-bold transition-all text-sm cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Thêm vào giỏ</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 h-12 rounded-xl bg-primary hover:opacity-95 text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all text-sm cursor-pointer"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>

      {/* THÔNG SỐ KỸ THUẬT & REVIEWS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-8 border-t border-border">
        {/* Cột trái + giữa: Specs (Thông số kỹ thuật) */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Thông số kỹ thuật chi tiết</h2>
          <div className="rounded-2xl border border-border bg-card/20 overflow-hidden">
            {Object.entries(product.specs).map(([key, val]: [string, any], index: number) => (
              <div
                key={key}
                className={`grid grid-cols-3 p-4 text-xs sm:text-sm border-b border-border/50 ${
                  index % 2 === 0 ? 'bg-muted/30' : ''
                }`}
              >
                <span className="font-semibold text-muted-foreground capitalize">{key.replace('_', ' ')}</span>
                <span className="col-span-2 text-foreground font-medium">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cột phải: Đánh giá (Reviews) */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-foreground">Đánh giá từ khách hàng</h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev: any) => (
                <div key={rev.id} className="p-4 rounded-xl bg-card/30 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">{rev.user_name || 'Khách hàng'}</span>
                    <span className="text-[10px] text-muted-foreground">{rev.created_at}</span>
                  </div>
                  <div className="flex text-yellow-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
