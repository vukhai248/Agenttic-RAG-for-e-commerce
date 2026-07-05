-- =====================================================
-- alter_v3.sql
-- CHẠY FILE NÀY TRONG SUPABASE SQL EDITOR ĐỂ NÂNG CẤP SCHEMA
-- CHÚ Ý: CHỈ NÂNG CẤP SCHEMA PHẦN SẢN PHẨM VÀ RAG, 
-- KHÔNG LÀM ẢNH HƯỞNG ĐẾN TÀI KHOẢN NGƯỜI DÙNG HOẶC ĐƠN HÀNG!
-- =====================================================

-- 1. Kích hoạt extension vector (pgvector) phục vụ cho RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Thêm cột embedding vào bảng products (nếu chưa có)
-- Model intfloat/multilingual-e5-large sinh ra vector 1024 chiều
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- 3. Tạo bảng policy_chunks lưu trữ tài liệu chính sách của RAG
CREATE TABLE IF NOT EXISTS policy_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_doc VARCHAR(255) NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tạo các chỉ mục HNSW tối ưu hóa tìm kiếm vector khoảng cách cosine
CREATE INDEX IF NOT EXISTS products_embedding_hnsw_idx 
ON products USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS policy_chunks_embedding_hnsw_idx 
ON policy_chunks USING hnsw (embedding vector_cosine_ops);

-- 5. Làm sạch dữ liệu sản phẩm cũ (Không DROP bảng, giữ nguyên foreign key và orders/users)
DELETE FROM products;

-- Xác nhận schema bảng products sau nâng cấp
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
