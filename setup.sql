-- setup.sql
-- Script khởi tạo cơ sở dữ liệu cho dự án Web TMĐT Điện tử & Agentic RAG

-- Xóa bảng cũ nếu tồn tại để tránh xung đột
DROP TABLE IF EXISTS chat_logs CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 1. Bảng products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('laptop', 'phone', 'smartwatch', 'earphone', 'accessory', 'tv')),
    brand VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(5, 2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    description TEXT NOT NULL,
    specs JSONB NOT NULL,
    images TEXT[] NOT NULL,
    rating_avg NUMERIC(3, 2) DEFAULT 0.0 CHECK (rating_avg >= 0.0 AND rating_avg <= 5.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bảng orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Liên kết với auth.users của Supabase Auth
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipping', 'delivered', 'cancelled')),
    items JSONB NOT NULL, -- Chứa mảng [{product_id, name, price, quantity, image}]
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bảng reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Liên kết với auth.users
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Bảng support_tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL, -- Liên kết với auth.users
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('advisory', 'negotiation', 'technical', 'attack_flagged', 'other')),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    created_by VARCHAR(20) NOT NULL CHECK (created_by IN ('agent', 'staff', 'customer')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    assigned_staff_id UUID, -- NULL nếu chưa có nhân viên nhận
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Bảng chat_logs
CREATE TABLE chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL,
    user_id UUID, -- Nullable (nếu chưa đăng nhập)
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'agent', 'tool', 'system')),
    message TEXT NOT NULL,
    tool_used VARCHAR(100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SEED DATA CHO BẢNG PRODUCTS (35+ SẢN PHẨM)

-- =========================================================================
-- LAPTOPS (7 sản phẩm)
-- =========================================================================
INSERT INTO products (category, brand, name, price, stock, description, specs, images, rating_avg) VALUES
(
    'laptop', 'Apple', 'MacBook Air M3 13 inch', 27990000, 15,
    'MacBook Air M3 phiên bản 2024 siêu mỏng nhẹ, hiệu năng cực đỉnh nhờ chip Apple M3 thế hệ mới. Thời lượng pin cực trâu lên tới 18 giờ liên tục, phù hợp cho học sinh, sinh viên và dân văn phòng cần di động cao.',
    '{"cpu": "Apple M3 8-Core", "ram": "8GB Unified Memory", "storage": "256GB SSD", "screen": "13.6 inch Liquid Retina (2560x1664)", "gpu": "8-Core GPU", "battery": "52.6Wh (lên đến 18 giờ)", "weight": "1.24kg"}',
    ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'], 4.8
),
(
    'laptop', 'Apple', 'MacBook Pro M3 Pro 14 inch', 54990000, 8,
    'MacBook Pro 14 inch trang bị chip M3 Pro mạnh mẽ dành cho lập trình viên, designer chuyên nghiệp. Màn hình Liquid Retina XDR 120Hz sắc nét siêu sáng và đầy đủ các cổng kết nối HDMI, khe thẻ SDXC.',
    '{"cpu": "Apple M3 Pro 11-Core", "ram": "18GB Unified Memory", "storage": "512GB SSD", "screen": "14.2 inch Liquid Retina XDR (3024x1964)", "gpu": "14-Core GPU", "battery": "72.4Wh (lên đến 18 giờ)", "weight": "1.61kg"}',
    ARRAY['https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600'], 4.9
),
(
    'laptop', 'Dell', 'Dell XPS 13 Plus 9320', 42500000, 5,
    'Dell XPS 13 Plus sở hữu thiết kế đột phá với thanh Touch Bar ẩn, bàn phím tràn viền vô cực và touchpad tàng hình. CPU Intel Core i7 thế hệ 13 mạnh mẽ đáp ứng mượt mà mọi tác vụ văn phòng và đồ họa bán chuyên nghiệp.',
    '{"cpu": "Intel Core i7-1360P (12 nhân, 16 luồng)", "ram": "16GB LPDDR5 6000MHz", "storage": "512GB SSD PCIe Gen4", "screen": "13.4 inch FHD+ IPS (1920x1200) Touch", "gpu": "Intel Iris Xe Graphics", "battery": "55Wh (khoảng 8-10 giờ)", "weight": "1.26kg"}',
    ARRAY['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600'], 4.5
),
(
    'laptop', 'Asus', 'Asus ROG Zephyrus G14 OLED 2024', 45990000, 6,
    'Laptop gaming mỏng nhẹ đẹp nhất thế giới hiện nay. Vỏ nhôm nguyên khối, trang bị màn hình OLED ROG Nebula sắc nét tần số quét 120Hz, card đồ họa mạnh mẽ NVIDIA RTX 4060 cân mọi game AAA hiện nay.',
    '{"cpu": "AMD Ryzen 7 8845HS", "ram": "16GB LPDDR5X 6400MHz", "storage": "1TB SSD PCIe 4.0", "screen": "14 inch 3K OLED 120Hz (2880x1800)", "gpu": "NVIDIA GeForce RTX 4060 8GB GDDR6", "battery": "73Wh (khoảng 7-8 giờ)", "weight": "1.50kg"}',
    ARRAY['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600'], 4.7
),
(
    'laptop', 'Lenovo', 'Lenovo ThinkPad X1 Carbon Gen 11', 48990000, 10,
    'Dòng laptop huyền thoại dành cho doanh nhân với độ bền đạt chuẩn quân đội, bàn phím gõ êm nhất thế giới. Trọng lượng siêu nhẹ chỉ 1.12kg nhờ chế tạo từ sợi carbon cao cấp.',
    '{"cpu": "Intel Core i7-1355U", "ram": "32GB LPDDR5", "storage": "1TB SSD PCIe 4.0", "screen": "14 inch 2.8K OLED (2880x1800) Anti-Glare", "gpu": "Intel Iris Xe Graphics", "battery": "57Wh (khoảng 10-12 giờ)", "weight": "1.12kg"}',
    ARRAY['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'], 4.6
),
(
    'laptop', 'Acer', 'Acer Predator Helios Neo 16', 32490000, 12,
    'Quái thú gaming tầm trung với hệ thống tản nhiệt kim loại lỏng Predator độc quyền. CPU Intel Core i7 dòng HX hiệu năng cao kết hợp RTX 4060 đáp ứng xuất sắc nhu cầu chơi game nặng và render video 4K.',
    '{"cpu": "Intel Core i7-13700HX (16 nhân, 24 luồng)", "ram": "16GB DDR5 4800MHz", "storage": "512GB SSD PCIe Gen4", "screen": "16 inch WQXGA (2560x1600) IPS 165Hz", "gpu": "NVIDIA GeForce RTX 4060 8GB GDDR6", "battery": "90Wh (khoảng 4-5 giờ)", "weight": "2.60kg"}',
    ARRAY['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600'], 4.4
),
(
    'laptop', 'HP', 'HP Pavilion 14 X360 2023', 16290000, 20,
    'Laptop văn phòng lai 2-trong-1 có thể xoay gập 360 độ sử dụng như máy tính bảng. Màn hình cảm ứng đa điểm, tặng kèm bút stylus tiện lợi cho vẽ phác thảo và ghi chú nhanh.',
    '{"cpu": "Intel Core i5-1335U", "ram": "8GB DDR4 3200MHz", "storage": "512GB SSD PCIe", "screen": "14 inch FHD IPS Touch (1920x1080)", "gpu": "Intel Iris Xe Graphics", "battery": "43Wh (khoảng 6-7 giờ)", "weight": "1.51kg"}',
    ARRAY['https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600'], 4.2
);

-- =========================================================================
-- PHONES (7 sản phẩm)
-- =========================================================================
INSERT INTO products (category, brand, name, price, stock, description, specs, images, rating_avg) VALUES
(
    'phone', 'Apple', 'iPhone 15 Pro Max 256GB', 29990000, 25,
    'Siêu phẩm iPhone 15 Pro Max với khung viền Titanium siêu nhẹ và bền bỉ. Nút Action mới thay thế nút gạt rung truyền thống. Hệ thống camera zoom quang học 5x cực đại và vi xử lý Apple A17 Pro 3nm đỉnh cao.',
    '{"chip": "Apple A17 Pro (3nm)", "ram": "8GB", "storage": "256GB", "screen": "6.7 inch Super Retina XDR OLED 120Hz", "battery": "4441mAh (lên đến 29 giờ xem video)", "camera": "48MP (Chính) + 12MP (Góc rộng) + 12MP (Tele 5x)"}',
    ARRAY['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600'], 4.8
),
(
    'phone', 'Samsung', 'Samsung Galaxy S24 Ultra 256GB', 26990000, 20,
    'Galaxy S24 Ultra tích hợp trí tuệ nhân tạo Galaxy AI vượt trội (dịch trực tiếp cuộc gọi, khoanh tròn tìm kiếm thông minh). Bút S Pen đi kèm tiện dụng và thiết kế phẳng viền Titanium sang trọng.',
    '{"chip": "Snapdragon 8 Gen 3 for Galaxy", "ram": "12GB", "storage": "256GB", "screen": "6.8 inch Dynamic AMOLED 2X 120Hz (3120x1440)", "battery": "5000mAh (Sạc nhanh 45W)", "camera": "200MP (Chính) + 50MP (Tele 5x) + 10MP (Tele 3x) + 12MP (Góc rộng)"}',
    ARRAY['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'], 4.7
),
(
    'phone', 'Samsung', 'Samsung Galaxy Z Fold6 256GB', 41990000, 10,
    'Smartphone màn hình gập thế hệ thứ 6 mỏng nhất và nhẹ nhất từ trước đến nay của Samsung. Mở ra không gian làm việc rộng lớn 7.6 inch, tối ưu hóa các tác vụ đa nhiệm và giải trí đỉnh cao.',
    '{"chip": "Snapdragon 8 Gen 3 for Galaxy", "ram": "12GB", "storage": "256GB", "screen": "Màn hình chính: 7.6 inch QXGA+ Dynamic AMOLED 2X, Màn hình phụ: 6.3 inch", "battery": "4400mAh (Sạc nhanh 25W)", "camera": "50MP (Chính) + 12MP (Góc siêu rộng) + 10MP (Tele 3x)"}',
    ARRAY['https://images.unsplash.com/photo-1574755393849-623942496936?w=600'], 4.6
),
(
    'phone', 'Xiaomi', 'Xiaomi 14 Ultra 16GB/512GB', 28990000, 6,
    'Đỉnh cao nhiếp ảnh di động nhờ sự hợp tác cùng hãng Leica huyền thoại. Cảm biến 1 inch khẩu độ kép thay đổi linh hoạt giúp bạn ghi lại những bức ảnh chuẩn studio nghệ thuật nhất.',
    '{"chip": "Snapdragon 8 Gen 3 (4nm)", "ram": "16GB LPDDR5X", "storage": "512GB UFS 4.0", "screen": "6.73 inch AMOLED 120Hz 2K WQHD+ (3200x1440)", "battery": "5000mAh (Sạc nhanh có dây 90W, sạc không dây 80W)", "camera": "4 camera 50MP (Camera chính cảm biến Sony LYT-900 1 inch + Tele 3.2x Leica + Tele 5x Leica + Góc siêu rộng Leica)"}',
    ARRAY['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'], 4.7
),
(
    'phone', 'Google', 'Google Pixel 8 Pro 128GB', 19500000, 8,
    'Điện thoại Android mượt mà nhất do chính Google tối ưu. Camera Pixel trứ danh với các tính năng chỉnh sửa ảnh AI độc quyền như Magic Eraser và Best Take. Hỗ trợ cập nhật phần mềm lên đến 7 năm.',
    '{"chip": "Google Tensor G3 (4nm)", "ram": "12GB LPDDR5X", "storage": "128GB", "screen": "6.7 inch LTPO OLED Super Actua 120Hz (2992x1344)", "battery": "5050mAh (Sạc nhanh 30W)", "camera": "50MP (Chính) + 48MP (Góc siêu rộng) + 48MP (Tele 5x)"}',
    ARRAY['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'], 4.5
),
(
    'phone', 'Oppo', 'Oppo Reno11 Pro 5G', 12490000, 15,
    'Chuyên gia chân dung với thiết kế mặt lưng ánh sáng 3D cuốn hút. Khả năng sạc siêu nhanh SuperVOOC 80W đầy pin chỉ trong 30 phút, phù hợp với các bạn trẻ năng động.',
    '{"chip": "MediaTek Dimensity 8200 (4nm)", "ram": "12GB", "storage": "512GB", "screen": "6.7 inch AMOLED 120Hz cong (2412x1080)", "battery": "4600mAh (Sạc nhanh SuperVOOC 80W)", "camera": "50MP (Chính OIS) + 32MP (Chân dung) + 8MP (Góc siêu rộng)"}',
    ARRAY['https://images.unsplash.com/photo-1565630916779-e303be97b6f5?w=600'], 4.3
),
(
    'phone', 'Apple', 'iPhone 13 128GB', 13490000, 30,
    'Chiếc iPhone quốc dân có mức giá cực tốt ở thời điểm hiện tại. Màn hình Super Retina XDR sắc nét, chip A15 Bionic vẫn mượt mà cân tốt mọi tựa game phổ biến và camera kép chéo chống rung OIS.',
    '{"chip": "Apple A15 Bionic (5nm)", "ram": "4GB", "storage": "128GB", "screen": "6.1 inch Super Retina XDR OLED (2532x1170)", "battery": "3240mAh (sạc nhanh 20W)", "camera": "12MP (Chính) + 12MP (Góc rộng)"}',
    ARRAY['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600'], 4.6
);

-- =========================================================================
-- SMARTWATCHES (7 sản phẩm)
-- =========================================================================
INSERT INTO products (category, brand, name, price, stock, description, specs, images, rating_avg) VALUES
(
    'smartwatch', 'Apple', 'Apple Watch Ultra 2 Titanium GPS + Cellular', 21490000, 10,
    'Đồng hồ thể thao chuyên nghiệp bền bỉ nhất của Apple với vỏ Titanium hàng không và mặt kính Sapphire. GPS tần số kép độ chính xác cực cao, thời lượng pin sử dụng lên đến 36 giờ.',
    '{"battery_life": "36 giờ (tiêu chuẩn) hoặc 72 giờ (chế độ tiết kiệm pin)", "display": "Retina LTPO OLED 1.92 inch (3000 nits)", "waterproof": "Chống nước 100m, đạt chuẩn lặn WR100", "compatible": "Chỉ tương thích iOS (iPhone)"}',
    ARRAY['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'], 4.8
),
(
    'smartwatch', 'Apple', 'Apple Watch Series 9 GPS 41mm viền nhôm', 9690000, 18,
    'Apple Watch Series 9 trang bị chip S9 SiP tiên tiến hỗ trợ tính năng Double Tap (chạm hai ngón tay) không cần chạm màn hình độc đáo. Cảm biến sức khỏe đa năng (đo điện tâm đồ ECG, nồng độ oxy SpO2).',
    '{"battery_life": "18 giờ (tiêu chuẩn)", "display": "Retina LTPO OLED 1.69 inch Always-on (2000 nits)", "waterproof": "Chống nước 50m (WR50)", "compatible": "Chỉ tương thích iOS (iPhone)"}',
    ARRAY['https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600'], 4.6
),
(
    'smartwatch', 'Samsung', 'Samsung Galaxy Watch Ultra LTE 47mm', 16990000, 8,
    'Phiên bản đồng hồ dã ngoại cao cấp nhất của Samsung. Khung viền Titanium cấp 4 bền bỉ chịu nhiệt tốt, pin dung lượng cực khủng và hỗ trợ theo dõi chỉ số cơ thể sinh học BioActive thế hệ mới.',
    '{"battery_life": "Lên đến 100 giờ (chế độ tiết kiệm pin) hoặc 48 giờ (GPS liên tục)", "display": "Super AMOLED 1.5 inch Always-on Sapphire Crystal", "waterproof": "10ATM (WR100m), đạt tiêu chuẩn quân đội MIL-STD-810H", "compatible": "Android 11.0 trở lên (tối ưu nhất trên Samsung)"}',
    ARRAY['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600'], 4.7
),
(
    'smartwatch', 'Garmin', 'Garmin Fenix 7 Pro Solar', 22490000, 5,
    'Đồng hồ thể thao ngoài trời chuyên nghiệp tích hợp mặt kính sạc năng lượng mặt trời Power Glass độc quyền. Bản đồ TOPO đa lục địa chi tiết và đèn pin LED siêu sáng tích hợp sẵn trên thân vỏ.',
    '{"battery_life": "Lên đến 18 ngày ở chế độ đồng hồ thông minh (thêm 4 ngày sạc mặt trời)", "display": "Màn hình MIP chống chói 1.3 inch transreflective", "waterproof": "10ATM (WR100m)", "compatible": "iOS và Android"}',
    ARRAY['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'], 4.9
),
(
    'smartwatch', 'Garmin', 'Garmin Forerunner 265 Music', 11690000, 12,
    'Dòng đồng hồ chạy bộ chuyên sâu kết hợp màn hình AMOLED rực rỡ và thời lượng pin xuất sắc. Các chỉ số đo lường nâng cao như Readiness Score (độ sẵn sàng tập luyện) và động lực học chạy bộ.',
    '{"battery_life": "Khoảng 13 ngày ở chế độ đồng hồ thông minh hoặc 20 giờ ở chế độ GPS", "display": "AMOLED 1.3 inch (màu sắc sống động)", "waterproof": "5ATM (WR50m)", "compatible": "iOS và Android"}',
    ARRAY['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600'], 4.7
),
(
    'smartwatch', 'Huawei', 'Huawei Watch GT 4 46mm dây da', 4990000, 20,
    'Sự kết hợp hoàn hảo giữa thiết kế đồng hồ cơ cổ điển hình bát giác độc đáo và các tính năng thông minh. Thời lượng pin cực khủng lên tới 14 ngày vượt trội so với đối thủ.',
    '{"battery_life": "Lên đến 14 ngày (sử dụng thông thường) hoặc 8 ngày (sử dụng nhiều)", "display": "AMOLED 1.43 inch (466x466)", "waterproof": "5ATM, IP68", "compatible": "iOS 9.0+ và Android 6.0+"}',
    ARRAY['https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600'], 4.5
),
(
    'smartwatch', 'Xiaomi', 'Xiaomi Redmi Watch 4', 2190000, 35,
    'Đồng hồ thông minh giá rẻ cấu hình mạnh mẽ nhất phân khúc. Khung hợp kim nhôm sang trọng, màn hình lớn 1.97 inch LTPS hiển thị mượt mà và thời lượng pin sạc dài tới 20 ngày.',
    '{"battery_life": "Lên đến 20 ngày (ở chế độ sử dụng cơ bản)", "display": "AMOLED 1.97 inch (tần số quét 60Hz)", "waterproof": "5ATM (chống nước đi bơi)", "compatible": "Android 8.0+ hoặc iOS 12.0+"}',
    ARRAY['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'], 4.3
);

-- =========================================================================
-- EARPHONES (7 sản phẩm)
-- =========================================================================
INSERT INTO products (category, brand, name, price, stock, description, specs, images, rating_avg) VALUES
(
    'earphone', 'Apple', 'Apple AirPods Pro Gen 2 USB-C', 5690000, 30,
    'Tai nghe True Wireless tốt nhất dành cho người dùng hệ sinh thái Apple. Khả năng chống ồn chủ động ANC thế hệ mới mạnh gấp đôi đời trước. Hộp sạc tích hợp loa tìm kiếm và cổng sạc USB-C hiện đại.',
    '{"battery_life": "Lên đến 6 giờ nghe nhạc (kèm hộp sạc tổng 30 giờ)", "anc": true, "connection": "Bluetooth 5.3 (Chip Apple H2)", "waterproof": "IP54 chống bụi và nước nhẹ cho cả tai nghe và hộp"}',
    ARRAY['https://images.unsplash.com/photo-1588449668338-d134ae7f3639?w=600'], 4.8
),
(
    'earphone', 'Sony', 'Sony WF-1000XM5', 5990000, 15,
    'Đỉnh cao chống ồn chủ động của thế giới tai nghe In-ear. Hỗ trợ giải mã âm thanh chất lượng cao Hi-Res Audio LDAC cùng màng loa Dynamic Driver X tái tạo âm thanh trung thực và chi tiết.',
    '{"battery_life": "8 giờ nghe nhạc liên tục (kèm hộp sạc lên đến 24 giờ)", "anc": true, "connection": "Bluetooth 5.3 (Hỗ trợ kết nối đa điểm đồng thời)", "waterproof": "IPX4 chống mồ hôi và nước mưa"}',
    ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'], 4.7
),
(
    'earphone', 'Sony', 'Sony WH-1000XM5 Over-ear', 7490000, 10,
    'Tai nghe chụp tai chống ồn hàng đầu thế giới. Thiết kế đệm tai êm ái chống ồn thụ động tốt cùng bộ xử lý kép chống ồn tối ưu tự động dựa trên môi trường của bạn.',
    '{"battery_life": "Lên đến 30 giờ liên tục khi bật ANC (38 giờ khi tắt ANC)", "anc": true, "connection": "Bluetooth 5.2 (Hỗ trợ LDAC, Fast Pair)", "waterproof": "Không hỗ trợ kháng nước"}',
    ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'], 4.9
),
(
    'earphone', 'Marshall', 'Marshall Motif II ANC', 4990000, 12,
    'Tai nghe mang đậm phong cách thiết kế Rock n Roll cổ điển đặc trưng của Marshall. Âm thanh mộc mạc mạnh mẽ cùng thời lượng pin cải tiến ấn tượng và hỗ trợ công nghệ kết nối LE Audio thế hệ mới.',
    '{"battery_life": "6 giờ bật ANC (kèm hộp sạc lên đến 30 giờ)", "anc": true, "connection": "Bluetooth 5.3 LE Audio", "waterproof": "Tai nghe đạt chuẩn IPX5, hộp sạc đạt chuẩn IPX4"}',
    ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'], 4.5
),
(
    'earphone', 'JBL', 'JBL Live Pro 2 TWS', 2990000, 25,
    'Tai nghe tầm trung sở hữu chất âm Signature Bass mạnh mẽ bùng nổ của JBL. Hệ thống 6 micro lọc tiếng ồn xung quanh hoàn hảo phục vụ đàm thoại cuộc gọi sắc nét nhất.',
    '{"battery_life": "Lên đến 10 giờ nghe (kèm hộp sạc tổng cộng 40 giờ)", "anc": true, "connection": "Bluetooth 5.2", "waterproof": "IPX5 kháng nước tốt phù hợp tập thể thao"}',
    ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'], 4.4
),
(
    'earphone', 'Bose', 'Bose QuietComfort Ultra Earbuds', 6990000, 8,
    'Công nghệ âm thanh Bose Immersive Audio (âm thanh vòm không gian) mang lại cảm giác nghe nhạc tự nhiên rộng mở như loa sân khấu ngoài trời kết hợp chống ồn cực tốt.',
    '{"battery_life": "6 giờ nghe nhạc (kèm hộp sạc tổng 24 giờ)", "anc": true, "connection": "Bluetooth 5.3 (Snapdragon Sound)", "waterproof": "IPX4 chống nước bắn tóe"}',
    ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'], 4.8
),
(
    'earphone', 'Marshall', 'Marshall Minor IV', 3690000, 20,
    'Dạng tai nghe Earbuds gài tai không gây đau tai khi đeo lâu, mặt sần giả da phong cách Marshall độc lạ. Chất âm sáng thanh thoát phù hợp các dòng nhạc Acoustic, Ballad.',
    '{"battery_life": "Lên đến 7 giờ nghe nhạc (hộp sạc hỗ trợ thêm 30 giờ)", "anc": false, "connection": "Bluetooth 5.3 LE Audio", "waterproof": "Tai nghe đạt chuẩn IPX4"}',
    ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'], 4.3
);

-- =========================================================================
-- ACCESSORIES (7 sản phẩm)
-- =========================================================================
INSERT INTO products (category, brand, name, price, stock, description, specs, images, rating_avg) VALUES
(
    'accessory', 'Anker', 'Sạc Anker Prime GaN 67W 3 Cổng (2C1A)', 990000, 50,
    'Củ sạc siêu nhỏ gọn sử dụng vật liệu GaN thế hệ mới giúp tản nhiệt mát mẻ và tối ưu công suất. Hỗ trợ sạc nhanh đồng thời 3 thiết bị Laptop, Điện thoại, Máy tính bảng với công suất tối đa 67W.',
    '{"type": "Củ sạc nhanh GaN", "compatible": "Laptop, iPhone, Android, MacBook, Nintendo Switch", "color": "Đen xám, chất liệu nhôm mờ"}',
    ARRAY['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'], 4.7
),
(
    'accessory', 'Apple', 'Sạc không dây Apple MagSafe Charger', 1090000, 30,
    'Sạc không dây MagSafe chính hãng Apple tự động căn chỉnh nam châm hít chặt mặt lưng iPhone 12 trở lên. Hỗ trợ sạc nhanh không dây chuẩn Qi an toàn tuyệt đối lên đến 15W.',
    '{"type": "Sạc không dây nam châm MagSafe", "compatible": "iPhone 12/13/14/15 series và các dòng AirPods hỗ trợ sạc MagSafe", "color": "Bạc trắng"}',
    ARRAY['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'], 4.5
),
(
    'accessory', 'Anker', 'Pin sạc dự phòng Anker 3-in-1 Power Bank 30W 10.000mAh', 1200000, 40,
    'Pin sạc dự phòng đa năng tích hợp sẵn cáp sạc USB-C siêu bền làm quai xách và chân cắm tường xoay gập tiện lợi. Có thể sạc trực tiếp từ ổ điện hoặc sử dụng như pin sạc di động 30W.',
    '{"type": "Pin sạc dự phòng kiêm củ sạc gắn tường", "compatible": "Điện thoại, Máy tính bảng, Tai nghe, Smartwatch", "color": "Đen, Xanh dương, Trắng, Hồng"}',
    ARRAY['https://images.unsplash.com/photo-1609592424085-f67a216b3492?w=600'], 4.6
),
(
    'accessory', 'Apple', 'Bút cảm ứng Apple Pencil Pro', 3490000, 15,
    'Apple Pencil Pro với các tính năng bóp ngón tay (Squeeze) để mở palette công cụ, xoay thân bút để thay đổi nét cọ và phản hồi rung xúc giác chân thực. Phục vụ đắc lực cho vẽ mỹ thuật trên iPad.',
    '{"type": "Bút stylus cảm ứng lực", "compatible": "iPad Pro M4 và iPad Air M2 2024", "color": "Trắng"}',
    ARRAY['https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600'], 4.8
),
(
    'accessory', 'Samsung', 'Thẻ định vị thông minh Samsung Galaxy SmartTag2', 650000, 45,
    'Thiết bị định vị theo dõi đồ vật cá nhân thông minh giúp tìm chìa khóa, xe cộ, thú cưng dễ dàng qua kết nối Bluetooth và UWB băng thông rộng. Thời lượng pin cực bền bỉ lên đến 500 ngày.',
    '{"type": "Thẻ định vị Bluetooth định vị khoảng cách", "compatible": "Thiết bị Android Samsung Galaxy chạy Android 9.0 trở lên", "color": "Đen, Trắng"}',
    ARRAY['https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600'], 4.4
),
(
    'accessory', 'Logitech', 'Chuột không dây Logitech MX Master 3S', 2490000, 20,
    'Chuột công thái học hàng đầu dành cho lập trình viên và dân văn phòng chuyên nghiệp. Nút cuộn từ tính MagSpeed siêu nhanh cực êm, cảm biến 8000 DPI có thể di trên mọi bề mặt kể cả mặt kính.',
    '{"type": "Chuột không dây công thái học đa kết nối", "compatible": "Windows, macOS, iPadOS, Linux, ChromeOS", "color": "Đen Graphite, Xám nhạt"}',
    ARRAY['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600'], 4.9
),
(
    'accessory', 'Logitech', 'Bàn phím cơ không dây Logitech MX Keys Mini', 2290000, 15,
    'Bàn phím không dây layout rút gọn phím bấm lõm ôm đầu ngón tay tạo cảm giác gõ cực kỳ êm ái, nhạy bén. Đèn nền thông minh tự động bật sáng khi tay bạn vừa di chuyển tới gần.',
    '{"type": "Bàn phím không dây mỏng nhẹ thông minh", "compatible": "macOS, Windows, iOS, iPadOS, Android", "color": "Xám Pale Grey, Đen Graphite"}',
    ARRAY['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'], 4.8
);

-- TẠO CHỈ MỤC ĐỂ TỐI ƯU HÓA TRUY VẤN CHO VECTOR DB VÀ WEB
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_chat_logs_session_id ON chat_logs(session_id);
CREATE INDEX idx_support_tickets_customer_id ON support_tickets(customer_id);
