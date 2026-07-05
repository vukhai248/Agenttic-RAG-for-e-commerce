# scripts/import_icecat_products.py
import os
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import random
from dotenv import load_dotenv
from supabase import create_client

# Load env từ .env.local ở thư mục gốc
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
load_dotenv(dotenv_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Thieu NEXT_PUBLIC_SUPABASE_URL hoac SUPABASE_SERVICE_ROLE_KEY trong .env.local")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================================
# 1. THƯ VIỆN ẢNH SẢN PHẨM UNSPLASH THỰC TẾ
# ============================================================
def get_unsplash_image(category, brand, name):
    norm = name.lower()
    if category == 'phone':
        if '16' in norm: return 'https://images.unsplash.com/photo-1727375052926-d9487c6f0ca9?w=600'
        if '15' in norm: return 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600'
        if '14' in norm: return 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600'
        if '13' in norm: return 'https://images.unsplash.com/photo-1632661676897-6df02930415a?w=600'
        if 's24' in norm or 's23' in norm: return 'https://images.unsplash.com/photo-1678911820864-b2c75188e605?w=600'
        if 'fold' in norm: return 'https://images.unsplash.com/photo-1574755393849-623942496936?w=600'
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'
    elif category == 'laptop':
        if 'macbook' in norm:
            if 'pro' in norm: return 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600'
            return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'
        if 'xps' in norm: return 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600'
        if 'rog' in norm or 'gaming' in norm: return 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600'
        return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'
    elif category == 'smartwatch':
        if 'ultra' in norm: return 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'
        return 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600'
    elif category == 'earphone':
        if 'airpods' in norm: return 'https://images.unsplash.com/photo-1588449668338-d134ae7f3639?w=600'
        if 'sony' in norm: return 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'
        return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'
    else: # accessory
        if 'chuột' in norm or 'mouse' in norm: return 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600'
        if 'bàn phím' in norm or 'keyboard' in norm: return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'
        return 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'

# ============================================================
# 2. HÀM SINH DỮ LIỆU ĐỘC LẬP TỔNG CỘNG 800+ SẢN PHẨM (~160 SP MỖI DANH MỤC)
# ============================================================
def generate_all_products():
    products = []
    
    # --- A. ĐIỆN THOẠI (~170 model chính) ---
    phone_configs = [
        {"brand": "Apple", "series": ["iPhone 16", "iPhone 15", "iPhone 14", "iPhone 13", "iPhone 12", "iPhone 11"], "suffixes": ["Pro Max", "Pro", "Plus", "tiêu chuẩn", "mini"], "base_price": 20000000},
        {"brand": "Samsung", "series": ["Galaxy S24", "Galaxy S23", "Galaxy S22", "Galaxy S21", "Galaxy Note 20", "Galaxy Note 10"], "suffixes": ["Ultra", "Plus", "tiêu chuẩn", "FE"], "base_price": 16000000},
        {"brand": "Xiaomi", "series": ["Xiaomi 14", "Xiaomi 13", "Xiaomi 12", "Redmi Note 13", "Redmi Note 12", "Poco F6"], "suffixes": ["Ultra", "Pro", "tiêu chuẩn", "Lite"], "base_price": 8000000},
        {"brand": "Oppo", "series": ["Find X7", "Find X6", "Reno12", "Reno11", "Reno10", "Oppo A98"], "suffixes": ["Ultra", "Pro", "tiêu chuẩn"], "base_price": 9000000},
        {"brand": "Vivo", "series": ["Vivo X100", "Vivo X90", "Vivo V30", "Vivo V29", "Vivo Y36"], "suffixes": ["Pro", "Plus", "tiêu chuẩn"], "base_price": 8500000},
        {"brand": "Realme", "series": ["Realme GT5", "Realme GT3", "Realme 12 Pro", "Realme 11 Pro", "Realme C67"], "suffixes": ["Pro", "Plus", "tiêu chuẩn"], "base_price": 6000000},
        {"brand": "Google", "series": ["Pixel 9", "Pixel 8", "Pixel 7", "Pixel 6", "Pixel 5"], "suffixes": ["Pro", "tiêu chuẩn", "a"], "base_price": 12000000},
        {"brand": "OnePlus", "series": ["OnePlus 12", "OnePlus 11", "OnePlus 10 Pro", "OnePlus Nord 3", "OnePlus Nord CE 3"], "suffixes": ["Pro", "tiêu chuẩn", "Lite"], "base_price": 10000000},
        {"brand": "Huawei", "series": ["Pura 70", "Mate 60", "P60", "Nova 11"], "suffixes": ["Ultra", "Pro", "tiêu chuẩn"], "base_price": 14000000},
        {"brand": "Sony", "series": ["Xperia 1 V", "Xperia 1 IV", "Xperia 5 V", "Xperia 10 V"], "suffixes": ["Pro", "tiêu chuẩn"], "base_price": 15000000}
    ]

    for cfg in phone_configs:
        brand = cfg["brand"]
        for ser in cfg["series"]:
            for suf in cfg["suffixes"]:
                if brand == "Apple":
                    if "11" in ser and suf == "Plus": continue
                    if "12" in ser and suf == "Plus": continue
                    if "13" in ser and suf == "Plus": continue
                    if "14" in ser and suf == "mini": continue
                    if "15" in ser and suf == "mini": continue
                    if "16" in ser and suf == "mini": continue
                elif brand == "Samsung":
                    if "Note" in ser and suf == "FE": continue
                    if "Note 10" in ser and suf == "Ultra": continue
                
                model_name = ser if suf == "tiêu chuẩn" else f"{ser} {suf}"
                name = model_name if brand == "Apple" else f"{brand} {model_name}"
                
                price_offset = 0
                if suf in ["Pro Max", "Ultra"]: price_offset = 8000000
                elif suf in ["Pro", "Plus"]: price_offset = 4000000
                elif suf in ["mini", "Lite", "a"]: price_offset = -2000000
                
                base_price = max(3000000, cfg["base_price"] + price_offset)
                
                chip = "Apple A-Series" if brand == "Apple" else ("Google Tensor" if brand == "Google" else "Snapdragon / Dimensity")
                screen = "6.7 inch Super Retina XDR OLED" if brand == "Apple" else "6.7 inch Dynamic AMOLED 2X 120Hz"
                specs = {
                    "chip": chip,
                    "screen": screen,
                    "camera": "50MP (Chính) + 12MP (Góc rộng)",
                    "battery": "4500mAh sạc nhanh"
                }
                
                colors = ["Đen Huyền Bí", "Trắng Ngọc Trai", "Titan Sa Mạc", "Xanh Tinh Vân"]
                desc = f"Điện thoại thông minh {name} sở hữu cấu hình mạnh mẽ với chip {chip}, màn hình {screen} sắc nét mượt mà và camera đỉnh cao."
                
                products.append({
                    "category": "phone",
                    "brand": brand,
                    "name": name,
                    "base_price": base_price,
                    "specs": specs,
                    "desc": desc,
                    "colors": colors
                })

    # --- B. LAPTOPS (~170 model chính) ---
    laptop_configs = [
        {"brand": "Apple", "series": ["MacBook Air M3", "MacBook Air M2", "MacBook Air M1", "MacBook Pro M3", "MacBook Pro M2"], "suffixes": ["13 inch", "14 inch", "15 inch", "16 inch"], "base_price": 25000000},
        {"brand": "Dell", "series": ["Dell XPS 13", "Dell XPS 15", "Dell Inspiron 15", "Dell Inspiron 14", "Dell Latitude 14"], "suffixes": ["Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7"], "base_price": 16000000},
        {"brand": "Asus", "series": ["Asus ROG Zephyrus", "Asus ZenBook 14", "Asus VivoBook 15", "Asus TUF Gaming", "Asus ExpertBook"], "suffixes": ["Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7"], "base_price": 18000000},
        {"brand": "Lenovo", "series": ["ThinkPad X1 Carbon", "ThinkPad T14", "IdeaPad Slim 5", "Legion 5 Pro", "Yoga Book 9i"], "suffixes": ["Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7"], "base_price": 20000000},
        {"brand": "HP", "series": ["HP Spectre x360", "HP Envy 16", "HP Pavilion 15", "HP Victus 16", "HP ProBook 440"], "suffixes": ["Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7"], "base_price": 17000000},
        {"brand": "Acer", "series": ["Acer Swift Go", "Acer Aspire 5", "Acer Nitro V 15", "Acer Predator Helios", "Acer Spin 5"], "suffixes": ["Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7"], "base_price": 14000000},
        {"brand": "MSI", "series": ["MSI Modern 14", "MSI Prestige 16", "MSI Katana 15", "MSI Cyborg 15", "MSI Stealth 16"], "suffixes": ["Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7"], "base_price": 15000000}
    ]

    for cfg in laptop_configs:
        brand = cfg["brand"]
        for ser in cfg["series"]:
            for suf in cfg["suffixes"]:
                if brand == "Apple":
                    if "Air" in ser and suf in ["14 inch", "16 inch"]: continue
                    if "Pro" in ser and suf in ["13 inch", "15 inch"] and "M3" in ser: continue
                
                name = f"{brand} {ser} ({suf})" if brand != "Apple" else f"{ser} {suf}"
                price_offset = 0
                if "i7" in suf or "Ryzen 7" in suf: price_offset = 3000000
                elif "i9" in suf: price_offset = 8000000
                elif "16 inch" in suf or "15 inch" in suf: price_offset = 2500005
                
                base_price = max(10000000, cfg["base_price"] + price_offset)
                
                specs = {
                    "cpu": suf,
                    "ram": "16GB DDR5",
                    "storage": "512GB SSD",
                    "screen": "14 inch WQXGA IPS"
                }
                colors = ["Xám Không Gian", "Bạc Ánh Kim", "Đen Nhám"]
                desc = f"Máy tính xách tay {name} thiết kế tinh xảo, mỏng nhẹ thời trang, hiệu năng cao giúp đáp ứng mượt mà công việc và giải trí."
                
                products.append({
                    "category": "laptop",
                    "brand": brand,
                    "name": name,
                    "base_price": base_price,
                    "specs": specs,
                    "desc": desc,
                    "colors": colors
                })

    # --- C. SMARTWATCHES (~160 model chính) ---
    watch_brands = [
        {"brand": "Apple", "series": ["Watch Ultra 2", "Watch Series 9 GPS", "Watch Series 8", "Watch SE Gen 2", "Watch Series 7"], "straps": ["Dây Cao Su", "Dây Vải Trail Loop", "Dây Thép Không Gỉ", "Dây Silicone Mềm", "Dây Da Bò", "Dây Sport Loop"], "base_price": 9000000},
        {"brand": "Samsung", "series": ["Watch Ultra Titan", "Watch7 LTE", "Watch6 Classic", "Watch6 Active", "Watch5 Pro"], "straps": ["Dây Cao Su", "Dây Da Lai", "Dây Thép", "Dây Silicone", "Dây Fabric", "Dây Dux"], "base_price": 6500000},
        {"brand": "Garmin", "series": ["Fenix 7X Pro", "Forerunner 965", "Venu 3S", "Instinct 2X", "Forerunner 265"], "straps": ["Dây Silicon Sport", "Dây Nylon Dệt", "Dây Da Lộn", "Dây Thép Titanium", "Dây QuickFit", "Dây Hybrid"], "base_price": 12000000},
        {"brand": "Huawei", "series": ["Watch GT 4 Pro", "Watch GT 3 Pro", "Watch Fit 3", "Watch Ultimate", "Watch GT 4 Active"], "straps": ["Dây Da Cao Cấp", "Dây Thép", "Dây Cao Su", "Dây Silicone", "Dây Vải Dệt", "Dây Ceramic"], "base_price": 4500000},
        {"brand": "Amazfit", "series": ["Amazfit GTR 4", "Amazfit GTS 4", "Amazfit T-Rex 2", "Amazfit Bip 5", "Amazfit Active"], "straps": ["Dây Cao Su Thể Thao", "Dây Da", "Dây Nylon", "Dây Silicone", "Dây Thép", "Dây Dệt Mềm"], "base_price": 3000000},
        {"brand": "Xiaomi", "series": ["Watch S3", "Watch 2 Pro"], "straps": ["Dây Da", "Dây Silicon", "Dây Thép", "Dây Nylon", "Dây Cao Su"], "base_price": 4000000}
    ]

    for cfg in watch_brands:
        brand = cfg["brand"]
        for ser in cfg["series"]:
            for strap in cfg["straps"]:
                name = f"{brand} {ser} - {strap}" if brand != "Apple" else f"{ser} - {strap}"
                price_offset = 0
                if "Ultra" in ser or "Fenix" in ser or "Ultimate" in ser: price_offset = 8000000
                if "Thép" in strap or "Titan" in strap or "Ceramic" in strap: price_offset += 1500000
                
                base_price = max(2000000, cfg["base_price"] + price_offset)
                specs = {
                    "display": "AMOLED Always-on Display",
                    "battery_life": "14 ngày sử dụng tiêu chuẩn" if brand in ["Huawei", "Amazfit"] else "2 ngày sử dụng",
                    "waterproof": "5ATM / IP68 chống nước đi bơi"
                }
                desc = f"Đồng hồ thông minh {name} sang trọng, hỗ trợ đo nhịp tim, đo SpO2, theo dõi giấc ngủ và hỗ trợ luyện tập thể thao chuyên nghiệp."
                
                products.append({
                    "category": "smartwatch",
                    "brand": brand,
                    "name": name,
                    "base_price": base_price,
                    "specs": specs,
                    "desc": desc,
                    "colors": ["Màu Đen", "Màu Xám", "Màu Vàng Đồng"]
                })

    # --- D. TAI NGHE (~160 model chính) ---
    ear_brands = [
        {"brand": "Apple", "series": ["AirPods Pro", "AirPods Max", "AirPods Gen 4", "AirPods Gen 3", "AirPods Gen 2"], "types": ["Bản ANC", "Bản Thường", "Bản Sạc Không Dây", "Bản Hộp Sạc Lightning"], "base_price": 4500000},
        {"brand": "Sony", "series": ["WF-1000XM5", "WH-1000XM5", "LinkBuds S", "WH-CH720N", "WH-CH520", "WF-C700N"], "types": ["Bản Chống Ồn Cao Cấp", "Bản Thể Thao", "Bản Tiêu Chuẩn", "Bản Giới Hạn"], "base_price": 3500000},
        {"brand": "JBL", "series": ["Tour Pro 3", "Tune Beam 2", "Live 670NC", "Wave Beam", "Live Pro 2", "Tune 770NC"], "types": ["Bản Bass Bùng Nổ", "Bản Chống Ồn ANC", "Bản Thể Thao", "Bản Tiêu Chuẩn"], "base_price": 2500000},
        {"brand": "Bose", "series": ["QuietComfort Ultra", "QuietComfort 45", "QuietComfort Earbuds II", "QuietComfort II", "Bose Ultra Open"], "types": ["Bản Ultra ANC", "Bản Tiêu Chuẩn", "Bản Thể Thao", "Bản Giới Hạn"], "base_price": 6000000},
        {"brand": "Sennheiser", "series": ["Momentum 4", "Momentum TW 4", "Accentum Wireless", "IE 200 Hi-Fi", "HD 450BT"], "types": ["Bản Chất Âm Audiophile", "Bản ANC", "Bản Bluetooth", "Bản Tiêu Chuẩn"], "base_price": 4500000},
        {"brand": "Marshall", "series": ["Motif II ANC", "Minor IV", "Major IV", "Monitor II ANC", "Motif ANC"], "types": ["Bản Classic Black", "Bản Brown Edition", "Bản Sạc Không Dây", "Bản Tiêu Chuẩn"], "base_price": 4000000},
        {"brand": "Beats", "series": ["Beats Fit Pro", "Beats Studio Buds +", "Beats Studio Pro", "Beats Solo 4"], "types": ["Bản Sport ANC", "Bản Bass Boosted", "Bản Thời Trang", "Bản Tiêu Chuẩn"], "base_price": 5000000},
        {"brand": "Jabra", "series": ["Jabra Elite 10", "Jabra Elite 8 Active", "Jabra Elite 4 Active", "Jabra Evolve2 65"], "types": ["Bản Đàm Thoại Văn Phòng", "Bản Siêu Chống Nước Active", "Bản ANC", "Bản Tiêu Chuẩn"], "base_price": 4000000}
    ]

    for cfg in ear_brands:
        brand = cfg["brand"]
        for ser in cfg["series"]:
            for t in cfg["types"]:
                if "AirPods Max" in ser and t in ["Bản Sạc Không Dây", "Bản Hộp Sạc Lightning"]: continue
                
                name = f"{brand} {ser} - {t}" if brand != "Apple" else f"{ser} - {t}"
                price_offset = 0
                if "Ultra" in ser or "Max" in ser or "1000X" in ser or "Momentum 4" in ser: price_offset = 3500000
                if "ANC" in t or "Chống Ồn" in t: price_offset += 800000
                
                base_price = max(1500000, cfg["base_price"] + price_offset)
                specs = {
                    "anc": "Chống ồn chủ động ANC thông minh" if "ANC" in t or "Chống Ồn" in t or "1000X" in ser or "Ultra" in ser else "Không tích hợp ANC",
                    "battery_life": "Lên đến 30 giờ nghe nhạc liên tục",
                    "connection": "Bluetooth 5.3 kết nối nhanh"
                }
                desc = f"Tai nghe không dây {name} mang lại trải nghiệm âm thanh sống động, chân thực, dải bass uy lực cùng khả năng đàm thoại cuộc gọi vô cùng rõ nét."
                
                products.append({
                    "category": "earphone",
                    "brand": brand,
                    "name": name,
                    "base_price": base_price,
                    "specs": specs,
                    "desc": desc,
                    "colors": ["Đen", "Trắng Pearl", "Xanh Navy"]
                })

    # --- E. PHỤ KIỆN (~170 model chính) ---
    acc_brands = [
        {"brand": "Anker", "series": ["Prime GaN 100W", "737 GaN 120W", "Nano 30W", "PowerCore 10000mAh", "PowerBank 20000mAh 65W", "PowerLine+ USB-C"], "types": ["Bản Siêu Bền bọc dù", "Bản Tiêu Chuẩn", "Bản Premium sạc nhanh", "Bản Kèm bao da chống sốc", "Bản Sạc Không Dây", "Bản Đa Năng 3-in-1"], "base_price": 500000},
        {"brand": "Logitech", "series": ["MX Master 3S", "MX Keys S", "MX Anywhere 3S", "G Pro X Superlight 2", "StreamCam Full HD", "MX Brio 4K"], "types": ["Bản Office Silent", "Bản Gaming Led RGB", "Bản Công Thái Học", "Bản Màu Trắng Sữa", "Bản Giới Hạn", "Bản Tiêu Chuẩn"], "base_price": 1800000},
        {"brand": "Ugreen", "series": ["Nexode 100W GaN", "Hub 7-in-1 USB-C", "Đầu đọc thẻ SD TF", "Đế tản nhiệt Laptop", "Cáp sạc nhanh 240W"], "types": ["Bản Vỏ Nhôm Space Gray", "Bản Bọc Dù Siêu Bền", "Bản Tiêu Chuẩn", "Bản Premium Cổng Đồng Vàng", "Bản Thiết Kế Dẹt", "Bản Kèm Đèn Led"], "base_price": 400000},
        {"brand": "Baseus", "series": ["Đèn treo màn hình i-Wok", "Sạc dự phòng Bipow 30W", "Củ sạc GaN5 Pro 65W", "Tẩu sạc ô tô 160W", "Bộ chia cổng Hub 5-in-1"], "types": ["Bản Bản Led Bảo Vệ Mắt", "Bản Dung Lượng Cao 30000mAh", "Bản Sạc Siêu Tốc", "Bản Tiêu Chuẩn", "Bản Thân Hợp Kim", "Bản Dây Dẹt Tiện Lợi"], "base_price": 450000},
        {"brand": "Spigen", "series": ["Ốp lưng Tough Armor", "Ốp lưng Ultra Hybrid Clear", "Kính cường lực GLAS.tR", "Ốp lưng Rugged Armor"], "types": ["Bản iPhone 16 Series", "Bản iPhone 15 Series", "Bản Galaxy S24 Series", "Bản Google Pixel Series", "Bản Nhám Mờ", "Bản Trong Suốt chống ố"], "base_price": 350000},
        {"brand": "Belkin", "series": ["Củ sạc nhanh 2 Cổng 65W", "Đế sạc MagSafe 3-in-1", "Cáp sạc DuraTek Kevlar", "Tấm dán bảo vệ màn hình"], "types": ["Bản Cao Cấp Đạt Chuẩn Apple", "Bản Tiêu Chuẩn", "Bản Siêu Bền Sợi Kevlar", "Bản Hộp Giấy Tái Chế"], "base_price": 800000}
    ]

    for cfg in acc_brands:
        brand = cfg["brand"]
        for ser in cfg["series"]:
            for t in cfg["types"]:
                name = f"{brand} {ser} - {t}"
                price_offset = 0
                if "100W" in ser or "120W" in ser or "MX" in ser or "G Pro" in ser or "MagSafe" in ser: price_offset = 1200000
                if "Premium" in t or "Vàng" in t or "Kevlar" in t: price_offset += 250000
                
                base_price = max(250000, cfg["base_price"] + price_offset)
                specs = {
                    "type": "Phụ kiện cao cấp",
                    "compatible_with": "Hỗ trợ đa thiết bị iOS, Android, Laptop, Windows, macOS",
                    "material": "Hợp kim nhôm / Sợi Nylon / Nhựa PC cao cấp"
                }
                desc = f"Phụ kiện chính hãng {name} hỗ trợ tối đa cho trải nghiệm làm việc và giải trí cùng thiết bị công nghệ của bạn hàng ngày."
                
                products.append({
                    "category": "accessory",
                    "brand": brand,
                    "name": name,
                    "base_price": base_price,
                    "specs": specs,
                    "desc": desc,
                    "colors": ["Đen Graphite", "Trắng Sữa", "Xanh Mint"]
                })

    return products

# ============================================================
# 3. HÀM TẠO SẢN PHẨM PHONG PHÚ & GỘP BIẾN THỂ EDITIONS
# ============================================================
def build_final_products():
    templates = generate_all_products()
    final_list = []
    
    EDITIONS_CONFIG = [
        {"name": "Chính hãng (VN/A)", "condition": "Mới 100% nguyên seal", "factor": 1.0},
        {"name": "Nhập khẩu (Mã LL/A)", "condition": "Mới 100% (Nhập khẩu)", "factor": 0.95},
        {"name": "Cũ 99% (Likenew)", "condition": "Đã qua sử dụng (Đẹp 99%)", "factor": 0.85},
        {"name": "Cũ 95%", "condition": "Đã qua sử dụng (Xước nhẹ 95%)", "factor": 0.75},
        {"name": "Trôi bảo hành", "condition": "Mới trôi bảo hành", "factor": 0.90}
    ]

    for temp in templates:
        cat = temp["category"]
        brand = temp["brand"]
        name = temp["name"]
        base_price = temp["base_price"]
        colors = temp.get("colors", ["Màu Đen Graphite", "Màu Bạc Ánh Kim"])
        img = get_unsplash_image(cat, brand, name)
        
        editions = []
        retail_editions = EDITIONS_CONFIG.copy()
        if cat == 'accessory':
            retail_editions = EDITIONS_CONFIG[:2]
            
        for re_ed in retail_editions:
            ed_price = max(100000, int(base_price * re_ed["factor"]))
            
            if cat == 'phone':
                storage_opts = ['128GB', '256GB', '512GB', '1TB']
                if base_price < 8000000:
                    storage_opts = ['64GB', '128GB', '256GB']
                elif base_price < 15000000:
                    storage_opts = ['128GB', '256GB', '512GB']
                
                variants = []
                for v_idx, storage in enumerate(storage_opts):
                    v_price = int((ed_price + v_idx * 2000000 * re_ed["factor"]) / 10000) * 10000
                    variants.append({"label": storage, "price": v_price})
                    
            elif cat == 'laptop':
                ram_ssd_opts = [
                    {"ram": "8GB", "ssd": "256GB", "offset": 0},
                    {"ram": "16GB", "ssd": "512GB", "offset": 3000000},
                    {"ram": "16GB", "ssd": "1TB", "offset": 5500000}
                ]
                if base_price > 35000000:
                    ram_ssd_opts = [
                        {"ram": "16GB", "ssd": "512GB", "offset": 0},
                        {"ram": "32GB", "ssd": "1TB", "offset": 6000000},
                        {"ram": "64GB", "ssd": "2TB", "offset": 12000000}
                    ]
                variants = []
                for c in ram_ssd_opts:
                    v_price = int((ed_price + c["offset"] * re_ed["factor"]) / 10000) * 10000
                    variants.append({"label": f"{c['ram']} RAM / {c['ssd']} SSD", "price": v_price})
                    
            elif cat == 'smartwatch':
                sizes = ['41mm', '45mm']
                if 'ultra' in name.lower() or 'fenix' in name.lower() or 'ultimate' in name.lower():
                    sizes = ['49mm Titan']
                variants = []
                for v_idx, size in enumerate(sizes):
                    v_price = int((ed_price + v_idx * 1200000 * re_ed["factor"]) / 10000) * 10000
                    variants.append({"label": size, "price": v_price})
                    
            elif cat == 'earphone':
                variants = [
                    {"label": "Bản Tiêu Chuẩn", "price": ed_price},
                    {"label": "Bản Có Hộp Sạc Không Dây", "price": int((ed_price + 600000 * re_ed["factor"]) / 10000) * 10000}
                ]
            else: # accessory
                variants = [
                    {"label": "Bản Tiêu Chuẩn", "price": ed_price},
                    {"label": "Bản Fullbox Kèm Đồ Chơi", "price": int((ed_price + 150000 * re_ed["factor"]) / 10000) * 10000}
                ]
                
            editions.append({
                "name": re_ed["name"],
                "condition": re_ed["condition"],
                "variants": variants
            })
            
        repr_price = editions[0]["variants"][0]["price"]
        discount = random.choice([5, 8, 10, 12, 15, 0, 0, 0])
        original_price = repr_price
        if discount > 0:
            original_price = int((repr_price / (1 - discount/100)) / 10000) * 10000
            
        specs_data = temp["specs"].copy()
        specs_data["color_options"] = colors
        specs_data["color_images"] = [img] * len(colors)
        specs_data["editions"] = editions

        specs_desc_parts = [f"Thương hiệu: {brand}.", f"Dòng máy: {name}."]
        for k, v in temp["specs"].items():
            specs_desc_parts.append(f"{k.upper()}: {v}.")
        
        full_description = temp["desc"] + " " + " ".join(specs_desc_parts)

        final_list.append({
            "category": cat,
            "brand": brand,
            "name": name,
            "price": repr_price,
            "original_price": original_price,
            "discount": discount,
            "stock": random.randint(15, 60),
            "description": full_description,
            "specs": specs_data,
            "images": [img],
            "rating_avg": round(random.uniform(4.2, 4.9), 1)
        })
        
    return final_list

# ============================================================
# 4. THỰC THI SEED DỮ LIỆU VÀO SUPABASE (KHÔNG CÓ EMBEDDING)
# ============================================================
async def main():
    print("[START] Bat dau nap du lieu sach cho san pham, gop Editions (Bo qua RAG/Embedding)...")
    
    # 1. Sinh danh sách sản phẩm
    products = build_final_products()
    
    counts = {}
    for p in products:
        counts[p["category"]] = counts.get(p["category"], 0) + 1
    print(f"[INFO] So luong san pham moi danh muc: {counts}")
    print(f"[INFO] Tong so san pham chinh doc nhat: {len(products)} dong may.")
    
    # 2. Xóa sản phẩm cũ trong bảng products
    print("[DELETE] Dang xoa du lieu san pham cu trong bang products...")
    try:
        supabase.table("products").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("[OK] Xoa san pham cu thanh cong.")
    except Exception as e:
        try:
            supabase.table("products").delete().not_("id", "is", "null").execute()
            print("[OK] Xoa san pham cu thanh cong (fallback).")
        except Exception as e2:
            print("[ERROR] Loi xoa san pham cu:", e2)

    # 3. Chèn sản phẩm vào database
    print("\n[INFO] Dang tien hanh chen san pham vao Supabase...")
    success_products = 0
    BATCH_SIZE = 50
    for i in range(0, len(products), BATCH_SIZE):
        batch = products[i:i+BATCH_SIZE]
        
        # Đảm bảo cột embedding nhận giá trị NULL để bạn tự xử lý RAG sau
        for p in batch:
            p["embedding"] = None
            
        try:
            supabase.table("products").insert(batch).execute()
            success_products += len(batch)
            print(f"  [OK] Da naped thanh cong batch {i//BATCH_SIZE + 1} ({success_products}/{len(products)} san pham)")
        except Exception as e:
            print(f"  [WARNING] Loi batch {i//BATCH_SIZE + 1}, chuyen sang che do fallback insert tung dong...")
            for p in batch:
                try:
                    p["embedding"] = None
                    supabase.table("products").insert(p).execute()
                    success_products += 1
                except Exception as ex:
                    print(f"    [ERROR] Loi dong may '{p['name']}': {ex}")
            
    print(f"\n[FINISHED] HOAN TAT SEED DU LIEU SAN PHAM SACH! Thanh cong: {success_products}/{len(products)}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
