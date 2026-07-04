'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/store/useCart';
import { Search, SlidersHorizontal, Star, ShoppingCart, ArrowUpDown, X } from 'lucide-react';

// Danh sách tất cả sản phẩm fallback để chạy offline/mock khi chưa có DB
const FALLBACK_ALL_PRODUCTS = [
  // Laptops
  { id: 'prod-1', category: 'laptop', brand: 'Apple', name: 'MacBook Air M3 13 inch', price: 27990000, stock: 15, description: 'MacBook Air M3 phiên bản 2024 siêu mỏng nhẹ, hiệu năng cực đỉnh nhờ chip Apple M3 thế hệ mới. Pin 18 tiếng.', specs: { cpu: 'Apple M3 8-Core', ram: '8GB', storage: '256GB' }, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'], rating_avg: 4.8 },
  { id: 'prod-2', category: 'laptop', brand: 'Apple', name: 'MacBook Pro M3 Pro 14 inch', price: 54990000, stock: 8, description: 'MacBook Pro 14 inch trang bị chip M3 Pro mạnh mẽ dành cho lập trình viên, designer chuyên nghiệp.', specs: { cpu: 'Apple M3 Pro 11-Core', ram: '18GB', storage: '512GB' }, images: ['https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600'], rating_avg: 4.9 },
  { id: 'prod-3', category: 'laptop', brand: 'Dell', name: 'Dell XPS 13 Plus 9320', price: 42500000, stock: 5, description: 'Dell XPS 13 Plus sở hữu thiết kế đột phá với thanh Touch Bar ẩn và bàn phím vô cực siêu mỏng nhẹ.', specs: { cpu: 'Intel Core i7-1360P', ram: '16GB', storage: '512GB' }, images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600'], rating_avg: 4.5 },
  { id: 'prod-4', category: 'laptop', brand: 'Asus', name: 'Asus ROG Zephyrus G14 OLED', price: 45990000, stock: 6, description: 'Laptop gaming mỏng nhẹ màn hình OLED ROG Nebula 120Hz, GPU NVIDIA RTX 4060 chiến game AAA cực mượt.', specs: { cpu: 'AMD Ryzen 7 8845HS', ram: '16GB', storage: '1TB' }, images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600'], rating_avg: 4.7 },
  { id: 'prod-5', category: 'laptop', brand: 'Lenovo', name: 'Lenovo ThinkPad X1 Carbon Gen 11', price: 48990000, stock: 10, description: 'Dòng laptop doanh nhân siêu nhẹ 1.12kg làm từ sợi carbon, bàn phím gõ êm ái hàng đầu thế giới.', specs: { cpu: 'Intel Core i7-1355U', ram: '32GB', storage: '1TB' }, images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'], rating_avg: 4.6 },
  // Phones
  { id: 'prod-6', category: 'phone', brand: 'Apple', name: 'iPhone 15 Pro Max 256GB', price: 29990000, stock: 25, description: 'Flapship Titanium siêu nhẹ, camera zoom 5x, A17 Pro 3nm mạnh mẽ.', specs: { chip: 'Apple A17 Pro', ram: '8GB', storage: '256GB' }, images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600'], rating_avg: 4.8 },
  { id: 'prod-7', category: 'phone', brand: 'Samsung', name: 'Samsung Galaxy S24 Ultra 256GB', price: 26990000, stock: 20, description: 'Galaxy AI thông minh, bút S Pen đi kèm và camera độ phân giải khủng 200MP.', specs: { chip: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '256GB' }, images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'], rating_avg: 4.7 },
  { id: 'prod-8', category: 'phone', brand: 'Xiaomi', name: 'Xiaomi 14 Ultra 512GB', price: 28990000, stock: 6, description: 'Ống kính Leica cảm biến 1 inch siêu chụp đêm đỉnh cao.', specs: { chip: 'Snapdragon 8 Gen 3', ram: '16GB', storage: '512GB' }, images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'], rating_avg: 4.7 },
  { id: 'prod-9', category: 'phone', brand: 'Google', name: 'Google Pixel 8 Pro 128GB', price: 19500000, stock: 8, description: 'Hệ điều hành Android thuần túy siêu mượt, xử lý hình ảnh AI độc quyền từ Google.', specs: { chip: 'Google Tensor G3', ram: '12GB', storage: '128GB' }, images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'], rating_avg: 4.5 },
  // Smartwatches
  { id: 'prod-10', category: 'smartwatch', brand: 'Apple', name: 'Apple Watch Ultra 2 Titanium', price: 21490000, stock: 10, description: 'Thiết kế Titanium bền bỉ, màn hình 3000 nits siêu sáng, pin 36 tiếng dã ngoại chuyên nghiệp.', specs: { battery_life: '36 giờ', waterproof: '100m' }, images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'], rating_avg: 4.8 },
  { id: 'prod-11', category: 'smartwatch', brand: 'Garmin', name: 'Garmin Fenix 7 Pro Solar', price: 22490000, stock: 5, description: 'Kính sạc năng lượng mặt trời Power Glass, GPS đa băng tần chính xác nhất.', specs: { battery_life: '18 ngày', waterproof: '100m' }, images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'], rating_avg: 4.9 },
  { id: 'prod-12', category: 'smartwatch', brand: 'Huawei', name: 'Huawei Watch GT 4 46mm', price: 4990000, stock: 20, description: 'Kiểu dáng bát giác lịch lãm cổ điển, theo dõi sức khỏe và thời lượng pin 14 ngày.', specs: { battery_life: '14 ngày', waterproof: '5ATM' }, images: ['https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600'], rating_avg: 4.5 },
  // Earphones
  { id: 'prod-13', category: 'earphone', brand: 'Apple', name: 'AirPods Pro Gen 2 USB-C', price: 5690000, stock: 30, description: 'Chống ồn chủ động ANC mạnh gấp hai lần, âm thanh không gian cá nhân hóa.', specs: { connection: 'Bluetooth 5.3', anc: 'Có' }, images: ['https://images.unsplash.com/photo-1588449668338-d134ae7f3639?w=600'], rating_avg: 4.8 },
  { id: 'prod-14', category: 'earphone', brand: 'Sony', name: 'Sony WF-1000XM5', price: 5990000, stock: 15, description: 'Công nghệ chống ồn đỉnh cao, đàm thoại siêu rõ ràng và nghe nhạc chất lượng Hi-Res.', specs: { connection: 'Bluetooth 5.3', anc: 'Có' }, images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'], rating_avg: 4.7 },
  { id: 'prod-15', category: 'earphone', brand: 'Sony', name: 'Sony WH-1000XM5 Over-ear', price: 7490000, stock: 10, description: 'Tai nghe chụp tai chống ồn tốt nhất hiện nay, đệm tai da êm ái không gây đau tai.', specs: { connection: 'Bluetooth 5.2', anc: 'Có' }, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'], rating_avg: 4.9 },
  // Accessories
  { id: 'prod-16', category: 'accessory', brand: 'Anker', name: 'Sạc Anker Prime GaN 67W 3 Cổng', price: 990000, stock: 50, description: 'Củ sạc GaN siêu nhỏ gọn, sạc nhanh cùng lúc cho Laptop và 2 điện thoại tiện lợi.', specs: { type: 'Củ sạc GaN', color: 'Xám đen' }, images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'], rating_avg: 4.7 },
  { id: 'prod-17', category: 'accessory', brand: 'Logitech', name: 'Chuột Logitech MX Master 3S', price: 2490000, stock: 20, description: 'Chuột không dây công thái học, cuộn từ tính MagSpeed và cảm biến di chuyển trên mọi bề mặt.', specs: { type: 'Chuột không dây', color: 'Đen' }, images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600'], rating_avg: 4.9 }
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Đọc các bộ lọc từ URL
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States bộ lọc ở UI
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchTerm, setSearchTerm] = useState(queryParam);

  const addItem = useCart((state) => state.addItem);

  // 1. Tải danh sách sản phẩm từ Supabase hoặc dùng fallback
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (error || !data || data.length === 0) {
          throw new Error('CSDL rỗng hoặc chưa cấu hình');
        }
        setProducts(data);
      } catch (err) {
        console.warn('Lỗi kết nối CSDL, dùng danh sách fallback:', err);
        setProducts(FALLBACK_ALL_PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 2. Đồng bộ hóa thanh tìm kiếm khi URL thay đổi
  useEffect(() => {
    setSearchTerm(queryParam);
  }, [queryParam]);

  // 3. Áp dụng tìm kiếm, lọc và sắp xếp
  useEffect(() => {
    let result = [...products];

    // Lọc theo từ khóa tìm kiếm (q hoặc searchTerm)
    if (queryParam) {
      const q = queryParam.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Lọc theo danh mục (category)
    if (categoryParam) {
      result = result.filter((p) => p.category === categoryParam);
    }

    // Lọc theo hãng (brand)
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // Lọc theo khoảng giá
    if (selectedPriceRange !== 'all') {
      if (selectedPriceRange === 'under-5m') {
        result = result.filter((p) => p.price < 5000000);
      } else if (selectedPriceRange === '5m-10m') {
        result = result.filter((p) => p.price >= 5000000 && p.price <= 10000000);
      } else if (selectedPriceRange === '10m-20m') {
        result = result.filter((p) => p.price >= 10000000 && p.price <= 20000000);
      } else if (selectedPriceRange === 'over-20m') {
        result = result.filter((p) => p.price > 20000000);
      }
    }

    // Sắp xếp
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    }

    setFilteredProducts(result);
  }, [products, queryParam, categoryParam, selectedBrands, selectedPriceRange, sortBy]);

  // Các hàm xử lý tương tác bộ lọc
  const handleBrandChange = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      params.set('q', searchTerm.trim());
    } else {
      params.delete('q');
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSelectedBrands([]);
    setSelectedPriceRange('all');
    setSortBy('featured');
    const params = new URLSearchParams();
    if (categoryParam) params.set('category', categoryParam);
    router.push(`/products?${params.toString()}`);
  };

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

  // Trích xuất danh sách các thương hiệu độc nhất của các sản phẩm hiển thị để làm bộ lọc
  const availableBrands = Array.from(new Set(products.map((p) => p.brand)));

  return (
    <div className="container mx-auto px-4 py-8 flex-1 flex flex-col md:flex-row gap-8 transition-colors duration-200">
      {/* 1. SIDEBAR BỘ LỌC (Trái) */}
      <aside className="w-full md:w-64 space-y-6 flex-shrink-0">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>Bộ lọc tìm kiếm</span>
          </h2>
          {(selectedBrands.length > 0 || selectedPriceRange !== 'all' || queryParam) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Lọc danh mục hiện tại (chỉ hiển thị nhãn) */}
        {categoryParam && (
          <div className="p-3 rounded-xl bg-card border border-border text-xs flex justify-between items-center text-muted-foreground">
            <span>Danh mục: <strong className="text-foreground uppercase">{categoryParam}</strong></span>
            <Link href="/products" className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Lọc theo Hãng */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Thương hiệu</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
            {availableBrands.map((brand) => (
              <label key={brand} className="flex items-center gap-2.5 text-muted-foreground text-sm cursor-pointer hover:text-foreground select-none">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandChange(brand)}
                  className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background w-4 h-4 cursor-pointer"
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Lọc theo Giá */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Khoảng giá</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            {[
              { id: 'all', label: 'Tất cả mức giá' },
              { id: 'under-5m', label: 'Dưới 5,000,000đ' },
              { id: '5m-10m', label: '5,000,000đ - 10,000,000đ' },
              { id: '10m-20m', label: '10,000,000đ - 20,000,000đ' },
              { id: 'over-20m', label: 'Trên 20,000,000đ' },
            ].map((range) => (
              <label key={range.id} className="flex items-center gap-2.5 cursor-pointer hover:text-foreground select-none">
                <input
                  type="radio"
                  name="price-range"
                  checked={selectedPriceRange === range.id}
                  onChange={() => setSelectedPriceRange(range.id)}
                  className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background w-4 h-4 cursor-pointer"
                />
                <span>{range.label}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* 2. KHU VỰC SẢN PHẨM (Phải) */}
      <div className="flex-1 space-y-6">
        {/* Tìm kiếm & Sắp xếp Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-card/40 border border-border rounded-2xl p-4">
          {/* Ô nhập tìm kiếm trong trang */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Tìm kiếm trong danh sách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-4 pr-10 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-xs sm:text-sm"
            />
            <button type="submit" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Sắp xếp */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <ArrowUpDown className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="whitespace-nowrap">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-background border border-border rounded-xl h-10 px-3 text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="featured">Nổi bật</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>
        </div>

        {/* Kết quả tìm kiếm */}
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tìm thấy <strong className="text-foreground">{filteredProducts.length}</strong> sản phẩm phù hợp.
          </p>
        </div>

        {/* Danh sách lưới sản phẩm */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-card/60 animate-pulse border border-border" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <p className="text-muted-foreground mb-2">Không tìm thấy sản phẩm nào khớp với bộ lọc của bạn.</p>
            <button
              onClick={handleClearFilters}
              className="text-xs px-4 py-2 bg-primary hover:opacity-90 text-primary-foreground rounded-full font-bold mt-2 cursor-pointer"
            >
              Làm mới bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => (
              <Link
                key={prod.id}
                href={`/products/${prod.id}`}
                className="group rounded-2xl border border-border bg-card/30 hover:bg-card/70 hover:border-muted-foreground/35 p-4 flex flex-col justify-between transition-all duration-300 relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Ảnh */}
                  <div className="w-full aspect-square rounded-xl bg-background flex items-center justify-center overflow-hidden relative border border-border/40">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-[85%] h-[85%] object-contain transform group-hover:scale-105 transition-transform duration-300"
                    />
                    {prod.rating_avg && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/90 border border-border text-[10px] text-yellow-550 font-bold">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span>{prod.rating_avg}</span>
                      </span>
                    )}
                  </div>
                  {/* Info */}
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
      </div>
    </div>
  );
}

