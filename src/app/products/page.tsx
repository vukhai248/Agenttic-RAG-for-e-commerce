'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useCart } from '@/store/useCart';
import { Search, SlidersHorizontal, Star, ShoppingCart, ArrowUpDown, X, ChevronDown, Check, Filter } from 'lucide-react';

const FALLBACK_ALL_PRODUCTS = [
  // Laptops
  { id: 'prod-1', category: 'laptop', brand: 'Apple', name: 'MacBook Air M3 13 inch', price: 27990000, stock: 15, description: 'MacBook Air M3 phiên bản 2024 siêu mỏng nhẹ, hiệu năng cực đỉnh nhờ chip Apple M3 thế mới. Pin 18 tiếng.', specs: { cpu: 'Apple M3 8-Core', ram: '8GB', storage: '256GB' }, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'], rating_avg: 4.8 },
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

const MAX_PRICE_LIMIT = 60000000;

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Đọc các bộ lọc từ URL
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States bộ lọc ở UI chính thức
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: MAX_PRICE_LIMIT });
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchTerm, setSearchTerm] = useState(queryParam);

  // States quản lý dropdown & trạng thái tạm thời
  const [activeDropdown, setActiveDropdown] = useState<'brand' | 'price' | 'sort' | null>(null);
  const [tempSelectedBrands, setTempSelectedBrands] = useState<string[]>([]);
  const [tempPriceRange, setTempPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: MAX_PRICE_LIMIT });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const addItem = useCart((state) => state.addItem);

  // 1. Tải danh sách sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      if (!isSupabaseConfigured) {
        setProducts(FALLBACK_ALL_PRODUCTS);
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.warn('Lỗi kết nối CSDL:', err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. Đồng bộ hóa ô tìm kiếm khi URL thay đổi
  useEffect(() => {
    setSearchTerm(queryParam);
  }, [queryParam]);

  // 3. Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 4. Áp dụng tìm kiếm, lọc và sắp xếp chính thức
  useEffect(() => {
    let result = [...products];

    // Lọc theo từ khóa tìm kiếm (q hoặc searchTerm) - Sử dụng thuật toán Prefix Matching
    if (queryParam) {
      const removeVietnameseTones = (str: string) => {
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .toLowerCase();
      };

      const qClean = removeVietnameseTones(queryParam.trim());
      if (qClean) {
        const queryWords = qClean.split(/\s+/).filter(Boolean);
        result = result.filter((p) => {
          const nameClean = removeVietnameseTones(p.name || '');
          const brandClean = removeVietnameseTones(p.brand || '');
          const descClean = removeVietnameseTones(p.description || '');
          const productWords = `${nameClean} ${brandClean} ${descClean}`.split(/[\s\-\/\,\.\(\)]+/).filter(Boolean);
          
          return queryWords.every(qw => 
            productWords.some(pw => pw.startsWith(qw))
          );
        });
      }
    }

    // Lọc theo danh mục (category)
    if (categoryParam) {
      result = result.filter((p) => p.category === categoryParam);
    }

    // Lọc theo thương hiệu (brand)
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // Lọc theo khoảng giá tuỳ chỉnh
    result = result.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max);

    // Sắp xếp
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    }

    setFilteredProducts(result);
  }, [products, queryParam, categoryParam, selectedBrands, priceRange, sortBy]);

  // Đồng bộ hoá trạng thái tạm thời khi mở Dropdown
  const openDropdown = (type: 'brand' | 'price' | 'sort') => {
    if (activeDropdown === type) {
      setActiveDropdown(null);
      return;
    }
    setActiveDropdown(type);
    if (type === 'brand') {
      setTempSelectedBrands([...selectedBrands]);
    } else if (type === 'price') {
      setTempPriceRange({ ...priceRange });
    }
  };

  const handleBrandTempChange = (brand: string) => {
    if (tempSelectedBrands.includes(brand)) {
      setTempSelectedBrands(tempSelectedBrands.filter((b) => b !== brand));
    } else {
      setTempSelectedBrands([...tempSelectedBrands, brand]);
    }
  };

  // Xác nhận lưu bộ lọc hãng
  const applyBrandFilter = () => {
    setSelectedBrands([...tempSelectedBrands]);
    setActiveDropdown(null);
  };

  // Xác nhận lưu bộ lọc khoảng giá
  const applyPriceFilter = () => {
    setPriceRange({ ...tempPriceRange });
    setActiveDropdown(null);
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
    setPriceRange({ min: 0, max: MAX_PRICE_LIMIT });
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

  // Lấy danh sách thương hiệu độc nhất từ sản phẩm
  const availableBrands = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8 flex-1 flex flex-col gap-6 transition-colors duration-200">
      
      {/* TIÊU ĐỀ & RESET BỘ LỌC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Filter className="w-5 h-5 text-red-600 dark:text-red-500" />
            <span>DANH SÁCH SẢN PHẨM</span>
          </h1>
          {categoryParam && (
            <p className="text-xs text-muted-foreground mt-1">
              Đang xem danh mục: <span className="text-foreground font-bold uppercase">{categoryParam}</span>
            </p>
          )}
        </div>
        {(selectedBrands.length > 0 || priceRange.min > 0 || priceRange.max < MAX_PRICE_LIMIT || queryParam) && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold flex items-center gap-1.5 cursor-pointer bg-red-600/10 hover:bg-red-600/15 px-3 py-1.5 rounded-xl transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>Xóa tất cả bộ lọc</span>
          </button>
        )}
      </div>

      {/* THANH BỘ LỌC NGANG CHUYÊN NGHIỆP (Dropdown Popovers) */}
      <div ref={dropdownRef} className="flex flex-wrap items-center gap-3 relative z-30">
        
        {/* Nút Bộ Lọc nhanh */}
        <div className="flex items-center gap-2 px-3 py-2 bg-red-600/10 border border-red-600/20 text-red-600 dark:text-red-500 rounded-xl text-xs font-black select-none">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Bộ lọc</span>
        </div>

        {/* 1. DROP DOWN THƯƠNG HIỆU */}
        <div className="relative">
          <button
            onClick={() => openDropdown('brand')}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
              activeDropdown === 'brand' || selectedBrands.length > 0
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/35'
            }`}
          >
            <span>Thương hiệu {selectedBrands.length > 0 && `(${selectedBrands.length})`}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'brand' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'brand' && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-4 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-3 select-none">Chọn thương hiệu</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {availableBrands.map((brand) => (
                  <div
                    key={brand}
                    onClick={() => handleBrandTempChange(brand)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted/60 cursor-pointer transition-colors group select-none border border-transparent"
                  >
                    {/* Custom Checkbox */}
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      tempSelectedBrands.includes(brand)
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-muted-foreground/35 bg-background group-hover:border-foreground/50'
                    }`}>
                      {tempSelectedBrands.includes(brand) && (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </div>
                    <span className={`text-xs font-semibold transition-colors ${
                      tempSelectedBrands.includes(brand) ? 'text-foreground font-bold' : 'text-muted-foreground group-hover:text-foreground'
                    }`}>
                      {brand}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-border mt-3 pt-3">
                <button
                  onClick={() => setActiveDropdown(null)}
                  className="flex-1 py-2 text-xs font-extrabold border border-border hover:bg-muted/50 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={applyBrandFilter}
                  className="flex-1 py-2 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer shadow-md shadow-red-600/10"
                >
                  Xem kết quả
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. DROP DOWN KHOẢNG GIÁ */}
        <div className="relative">
          <button
            onClick={() => openDropdown('price')}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
              activeDropdown === 'price' || priceRange.min > 0 || priceRange.max < MAX_PRICE_LIMIT
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/35'
            }`}
          >
            <span>
              {priceRange.min === 0 && priceRange.max === MAX_PRICE_LIMIT
                ? 'Chọn mức giá'
                : `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'price' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'price' && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-5 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-4 select-none">Lọc khoảng giá</h4>
              
              {/* Hai ô nhập giá trực tiếp */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={tempPriceRange.min}
                    onChange={(e) => setTempPriceRange({ ...tempPriceRange, min: Math.min(Number(e.target.value), tempPriceRange.max - 500000) })}
                    className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-red-600 font-extrabold transition-all"
                  />
                  <span className="absolute right-3 top-3 text-[10px] text-muted-foreground font-black">đ</span>
                </div>
                <span className="text-muted-foreground font-bold">-</span>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={tempPriceRange.max}
                    onChange={(e) => setTempPriceRange({ ...tempPriceRange, max: Math.max(Number(e.target.value), tempPriceRange.min + 500000) })}
                    className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-red-600 font-extrabold transition-all"
                  />
                  <span className="absolute right-3 top-3 text-[10px] text-muted-foreground font-black">đ</span>
                </div>
              </div>

              {/* Slider kéo kép (Double Range Slider) */}
              <div className="my-6 px-1.5">
                <div className="relative w-full h-1.5 bg-muted rounded-full">
                  <div
                    className="absolute h-1.5 bg-red-600 dark:bg-red-500 rounded-full"
                    style={{
                      left: `${(tempPriceRange.min / MAX_PRICE_LIMIT) * 100}%`,
                      right: `${100 - (tempPriceRange.max / MAX_PRICE_LIMIT) * 100}%`
                    }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={MAX_PRICE_LIMIT}
                    step={500000}
                    value={tempPriceRange.min}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), tempPriceRange.max - 1000000);
                      setTempPriceRange({ ...tempPriceRange, min: val });
                    }}
                    className="absolute w-full h-1.5 top-0 left-0 appearance-none bg-transparent pointer-events-none focus:outline-none"
                    style={{
                      zIndex: tempPriceRange.min > MAX_PRICE_LIMIT / 2 ? 5 : 3
                    }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={MAX_PRICE_LIMIT}
                    step={500000}
                    value={tempPriceRange.max}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), tempPriceRange.min + 1000000);
                      setTempPriceRange({ ...tempPriceRange, max: val });
                    }}
                    className="absolute w-full h-1.5 top-0 left-0 appearance-none bg-transparent pointer-events-none focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-border mt-3 pt-3">
                <button
                  onClick={() => setActiveDropdown(null)}
                  className="flex-1 py-2 text-xs font-extrabold border border-border hover:bg-muted/50 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={applyPriceFilter}
                  className="flex-1 py-2 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer shadow-md shadow-red-600/10"
                >
                  Xem kết quả
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. DROP DOWN SẮP XẾP */}
        <div className="relative ml-auto">
          <button
            onClick={() => openDropdown('sort')}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
              sortBy !== 'featured'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/35'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>
              Sắp xếp:{' '}
              {sortBy === 'featured' && 'Nổi bật'}
              {sortBy === 'price-asc' && 'Giá tăng dần'}
              {sortBy === 'price-desc' && 'Giá giảm dần'}
              {sortBy === 'rating' && 'Đánh giá'}
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {activeDropdown === 'sort' && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
              {[
                { id: 'featured', label: 'Nổi bật' },
                { id: 'price-asc', label: 'Giá tăng dần' },
                { id: 'price-desc', label: 'Giá giảm dần' },
                { id: 'rating', label: 'Đánh giá cao nhất' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    setSortBy(opt.id);
                    setActiveDropdown(null);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                    sortBy === opt.id
                      ? 'bg-primary/10 text-primary font-black'
                      : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TÌM KIẾM TRONG DANH SÁCH & SỐ LƯỢNG */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-card/45 border border-border rounded-2xl p-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Tìm kiếm trong danh sách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-4 pr-10 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-xs sm:text-sm font-semibold"
          />
          <button type="submit" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <Search className="w-4.5 h-4.5" />
          </button>
        </form>

        <p className="text-xs sm:text-sm text-muted-foreground font-medium self-center">
          Tìm thấy <strong className="text-foreground font-black">{filteredProducts.length}</strong> sản phẩm phù hợp.
        </p>
      </div>

      {/* DANH SÁCH SẢN PHẨM */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Đang tải danh sách sản phẩm...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-card/35 rounded-3xl border border-border border-dashed">
          <SlidersHorizontal className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-black text-foreground uppercase mb-1">Không tìm thấy sản phẩm nào</h3>
          <p className="text-xs text-muted-foreground">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm khác.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <Link
              key={prod.id}
              href={`/products/${prod.id}`}
              className="group bg-card hover:bg-card/75 border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
            >
              {/* Ảnh */}
              <div className="relative aspect-square w-full overflow-hidden bg-muted/35 border-b border-border/60">
                <img
                  src={prod.images?.[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'}
                  alt={prod.name}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm border border-border text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md text-muted-foreground">
                  {prod.brand}
                </span>
                {prod.rating_avg && (
                  <div className="absolute top-3 right-3 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded-md text-[10px] font-black text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{prod.rating_avg.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Chi tiết */}
              <div className="p-4 flex flex-col flex-1 gap-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                  {prod.category}
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[40px]">
                  {prod.name}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-2 flex-1">
                  {prod.description}
                </p>
                <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-1">
                  <span className="text-xs sm:text-sm font-black text-foreground">
                    {formatPrice(prod.price)}
                  </span>
                  <button
                    onClick={(e) => handleAddToCart(e, prod)}
                    className="flex items-center justify-center p-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer shadow-md shadow-primary/10 hover:shadow-primary/25"
                    title="Thêm vào giỏ hàng"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Đang chuẩn bị danh sách...</p>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
