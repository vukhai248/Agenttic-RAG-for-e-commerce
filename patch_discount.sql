-- =====================================================
-- patch_discount.sql
-- CHẠY FILE NÀY TRONG SUPABASE SQL EDITOR ĐỂ THÊM CỘT CÒN THIẾU
-- =====================================================

-- 1. Thêm cột original_price (nếu chưa có)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS original_price NUMERIC(12, 2) DEFAULT 0;

-- 2. Thêm cột discount (nếu chưa có)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount NUMERIC(5, 2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100);

-- 3. Reload cache của Supabase PostgREST để cập nhật API ngay lập tức
NOTIFY pgrst, 'reload schema';
