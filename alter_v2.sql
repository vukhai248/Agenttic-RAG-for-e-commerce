-- =====================================================
-- alter_v2.sql
-- CHẠY FILE NÀY TRONG SUPABASE SQL EDITOR
-- Bước 1: Thêm cột mới vào bảng products
-- =====================================================

-- 1. Thêm cột discount (%)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount NUMERIC(5,2) DEFAULT 0 
CHECK (discount >= 0 AND discount <= 100);

-- 2. Thêm cột original_price (giá gốc trước giảm)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS original_price NUMERIC(12,2) DEFAULT 0;

-- 3. Nâng cấp constraint category để bao gồm 'tv'
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check 
CHECK (category IN ('laptop', 'phone', 'smartwatch', 'earphone', 'accessory', 'tv'));

-- 4. Xóa toàn bộ sản phẩm cũ (Amazon dataset bị nhiễu loạn)
DELETE FROM products;

-- Xác nhận schema mới
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
