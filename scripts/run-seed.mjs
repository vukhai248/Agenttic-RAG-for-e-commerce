// scripts/run-seed.mjs
// Script chạy seed thông minh: tự phát hiện schema và điều chỉnh
// Chạy: node scripts/run-seed.mjs

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Không tìm thấy file .env.local ở thư mục gốc');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.substring(0, idx).trim();
    const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  });
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function detectSchema() {
  // Thử select với cột discount để biết có tồn tại không
  const { error } = await supabase.from('products').select('discount').limit(1);
  return !error; // true = có cột discount
}

async function detectTvConstraint() {
  // Thử insert 1 sản phẩm tv và rollback
  const { error } = await supabase.from('products').insert({
    category: 'tv', brand: 'Test', name: 'Test TV', price: 1000, stock: 1,
    description: 'Test', specs: {}, images: ['https://test.com']
  }).select('id');
  
  if (error && error.message.includes('check')) {
    return false; // constraint chưa cho phép tv
  }
  // Nếu insert thành công, xóa nó đi
  if (!error) {
    await supabase.from('products').delete().eq('name', 'Test TV').eq('brand', 'Test');
  }
  return true;
}

async function clearProducts() {
  console.log('🗑️ Xóa toàn bộ sản phẩm cũ...');
  const { error } = await supabase.from('products').delete().not('id', 'is', null);
  if (error) throw new Error('Lỗi xóa: ' + error.message);
  console.log('✅ Xóa sản phẩm cũ thành công');
}

// ============================================================
// DỮ LIỆU SẢN PHẨM ĐIỆN TỬ CHẤT LƯỢNG CAO
// ============================================================

const IMG = {
  iphone15pm: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
  iphone14: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=600',
  iphone13: 'https://images.unsplash.com/photo-1632633173522-47456de71b76?w=600',
  iphone12: 'https://images.unsplash.com/photo-1607936854279-55e8a4c64888?w=600',
  iphoneSE: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600',
  samsung_s24: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600',
  samsung_s23: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
  samsung_fold: 'https://images.unsplash.com/photo-1574755393849-623942496936?w=600',
  samsung_flip: 'https://images.unsplash.com/photo-1655721528890-4b1b99a01a72?w=600',
  samsung_a: 'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=600',
  xiaomi: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
  google_pixel: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600',
  oppo: 'https://images.unsplash.com/photo-1565630916779-e303be97b6f5?w=600',
  oneplus: 'https://images.unsplash.com/photo-1555680204-55c7996b3f54?w=600',
  vivo: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600',
  motorola: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
  realme: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600',
  nokia: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600',
  macbook_air: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
  macbook_pro: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600',
  macbook_pro14: 'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=600',
  dell_xps: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600',
  dell_inspiron: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600',
  asus_rog: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
  asus_zenbook: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600',
  lenovo_thinkpad: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600',
  lenovo_ideapad: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
  hp_spectre: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600',
  hp_pavilion: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600',
  acer_predator: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
  acer_swift: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600',
  msi_gaming: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600',
  razer: 'https://images.unsplash.com/photo-1612810806563-4cb8265e3b2c?w=600',
  lg_gram: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
  samsung_tv: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4e10a?w=600',
  samsung_qled: 'https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=600',
  lg_oled: 'https://images.unsplash.com/photo-1558888401-3cc1de77652d?w=600',
  lg_nanocell: 'https://images.unsplash.com/photo-1571415060716-baff5f717c37?w=600',
  sony_bravia: 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=600',
  xiaomi_tv: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4e10a?w=600',
  tcl_tv: 'https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=600',
  airpods_pro: 'https://images.unsplash.com/photo-1588449668338-d134ae7f3639?w=600',
  airpods_max: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600',
  airpods_gen3: 'https://images.unsplash.com/photo-1606741965326-cb990ae01bb2?w=600',
  sony_wf: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
  sony_wh: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  samsung_buds: 'https://images.unsplash.com/photo-1606741965326-cb990ae01bb2?w=600',
  jbl_earbuds: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
  jbl_headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  bose_qc: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  bose_earbuds: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
  sennheiser: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  jabra: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
  marshall: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
  beats_studio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  beats_earbuds: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
  anker_earbuds: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
  apple_watch_ultra: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600',
  apple_watch_s9: 'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=600',
  apple_watch_se: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600',
  samsung_watch: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600',
  garmin_fenix: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600',
  garmin_forerunner: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600',
  huawei_watch: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600',
  xiaomi_watch: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600',
  amazfit: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600',
  anker_charger: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600',
  magsafe: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600',
  powerbank: 'https://images.unsplash.com/photo-1609592424085-f67a216b3492?w=600',
  logitech_mouse: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600',
  logitech_keyboard: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
  apple_pencil: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600',
  cable_usbc: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
  hub_usb: 'https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?w=600',
  case_phone: 'https://images.unsplash.com/photo-1592899792095-95e5e15ef562?w=600',
  screen_protector: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600',
  webcam: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600',
  monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600',
  wireless_charger: 'https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?w=600',
  stand_laptop: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600',
  microphone: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600',
};

// Hàm tạo sản phẩm
function p(category, brand, name, price, original_price, discount, stock, rating_avg, image, description, specs) {
  return { category, brand, name, price, original_price, discount, stock, rating_avg, images: [image], description, specs };
}

const ALL_PRODUCTS = [
// ============================
// ĐIỆN THOẠI
// ============================
p('phone','Apple','iPhone 15 Pro Max 256GB Titan Đen',29990000,32990000,9,25,4.8,IMG.iphone15pm,'iPhone 15 Pro Max với khung Titanium siêu nhẹ, chip A17 Pro 3nm và camera 48MP zoom quang học 5x. Action Button tùy chỉnh độc đáo.',{chip:'Apple A17 Pro (3nm)',ram:'8GB',storage:'256GB',screen:'6.7" Super Retina XDR OLED 120Hz ProMotion',camera:'48MP+12MP+12MP Tele 5x',battery:'4441mAh 20W+15W MagSafe',os:'iOS 17',weight:'221g'}),
p('phone','Apple','iPhone 15 Pro 256GB Titan Trắng',25990000,27990000,7,30,4.8,IMG.iphone15pm,'iPhone 15 Pro khung Titanium nhẹ hơn thép 19%, chip A17 Pro, Dynamic Island và màn hình ProMotion 120Hz.',{chip:'Apple A17 Pro (3nm)',ram:'8GB',storage:'256GB',screen:'6.1" Super Retina XDR OLED 120Hz',camera:'48MP+12MP+12MP Tele 3x',battery:'3274mAh',os:'iOS 17',weight:'187g'}),
p('phone','Apple','iPhone 15 Plus 256GB Xanh',22990000,24990000,8,20,4.6,IMG.iphone15pm,'iPhone 15 Plus với pin 4383mAh dùng cả ngày, màn hình 6.7 inch Super Retina XDR và chip A16 Bionic mạnh mẽ.',{chip:'Apple A16 Bionic',ram:'6GB',storage:'256GB',screen:'6.7" Super Retina XDR OLED 60Hz',camera:'48MP+12MP góc siêu rộng',battery:'4383mAh',os:'iOS 17',weight:'201g'}),
p('phone','Apple','iPhone 15 128GB Hồng',19990000,20990000,5,35,4.6,IMG.iphone15pm,'iPhone 15 với camera 48MP lần đầu ở dòng standard, chip A16 Bionic và cổng USB-C hiện đại.',{chip:'Apple A16 Bionic',ram:'6GB',storage:'128GB',screen:'6.1" Super Retina XDR OLED 60Hz',camera:'48MP+12MP',battery:'3349mAh',os:'iOS 17',weight:'171g'}),
p('phone','Apple','iPhone 14 Pro Max 256GB Tím Sâu',24990000,29990000,17,18,4.7,IMG.iphone14,'iPhone 14 Pro Max với Dynamic Island đột phá, ProMotion 120Hz và camera 48MP. Always-On Display lần đầu trên iPhone.',{chip:'Apple A16 Bionic (4nm)',ram:'6GB',storage:'256GB',screen:'6.7" Super Retina XDR OLED 120Hz Always-On',camera:'48MP+12MP+12MP Tele 3x',battery:'4323mAh',os:'iOS 17',weight:'240g'}),
p('phone','Apple','iPhone 14 Pro 128GB Vàng',21990000,26990000,19,22,4.7,IMG.iphone14,'iPhone 14 Pro với Dynamic Island và Always-On Display cùng camera 48MP chụp ảnh cực chi tiết trong mọi ánh sáng.',{chip:'Apple A16 Bionic (4nm)',ram:'6GB',storage:'128GB',screen:'6.1" Super Retina XDR OLED 120Hz Always-On',camera:'48MP+12MP+12MP Tele 3x',battery:'3200mAh',os:'iOS 17',weight:'206g'}),
p('phone','Apple','iPhone 14 256GB Midnight',18490000,22490000,18,28,4.5,IMG.iphone13,'iPhone 14 với chip A15 Bionic mạnh, Emergency SOS vệ tinh và Crash Detection cứu sinh đầu tiên trên iPhone.',{chip:'Apple A15 Bionic (5nm)',ram:'6GB',storage:'256GB',screen:'6.1" Super Retina XDR OLED 60Hz',camera:'12MP+12MP OIS',battery:'3279mAh',os:'iOS 17',weight:'172g'}),
p('phone','Apple','iPhone 13 Pro Max 256GB Sierra Blue',19990000,24990000,20,15,4.7,IMG.iphone13,'iPhone 13 Pro Max pin cực trâu 4352mAh, camera macro độc quyền, ProMotion 120Hz và chip A15 Bionic vẫn mạnh vượt mọi đối thủ.',{chip:'Apple A15 Bionic (5nm)',ram:'6GB',storage:'256GB',screen:'6.7" Super Retina XDR OLED 120Hz',camera:'12MP+12MP+12MP Tele 3x Macro',battery:'4352mAh',os:'iOS 17',weight:'238g'}),
p('phone','Apple','iPhone 13 128GB Starlight',14990000,17990000,17,40,4.6,IMG.iphone13,'iPhone 13 quốc dân giá tốt, chip A15 Bionic mượt mà, màn hình 60Hz sắc nét và camera kép OIS xuất sắc.',{chip:'Apple A15 Bionic (5nm)',ram:'4GB',storage:'128GB',screen:'6.1" Super Retina XDR OLED 60Hz',camera:'12MP+12MP góc siêu rộng',battery:'3227mAh',os:'iOS 17',weight:'174g'}),
p('phone','Apple','iPhone 12 128GB Đỏ',9990000,14990000,33,20,4.4,IMG.iphone12,'iPhone 12 thiết kế vuông vức bền bỉ, 5G đầu tiên trên iPhone và MagSafe sạc không dây nam châm tiện lợi.',{chip:'Apple A14 Bionic (5nm)',ram:'4GB',storage:'128GB',screen:'6.1" Super Retina XDR OLED 60Hz',camera:'12MP+12MP',battery:'2815mAh',os:'iOS 17',weight:'164g'}),
p('phone','Apple','iPhone SE Gen 3 128GB Trắng',11490000,12490000,8,25,4.3,IMG.iphoneSE,'iPhone SE Gen 3 nhỏ gọn 4.7 inch với chip A15 Bionic mạnh mẽ và hỗ trợ 5G. Lựa chọn iPhone ngân sách tiết kiệm.',{chip:'Apple A15 Bionic',ram:'4GB',storage:'128GB',screen:'4.7" Retina IPS 60Hz',camera:'12MP chính OIS',battery:'2018mAh',os:'iOS 17',weight:'144g'}),
p('phone','Samsung','Samsung Galaxy S24 Ultra 256GB Titanium Gray',26990000,29990000,10,20,4.8,IMG.samsung_s24,'Galaxy S24 Ultra với S Pen tích hợp, Galaxy AI thông minh, camera 200MP và zoom quang học 10x. Snapdragon 8 Gen 3 mạnh nhất.',{chip:'Snapdragon 8 Gen 3 for Galaxy',ram:'12GB',storage:'256GB',screen:'6.8" Dynamic AMOLED 2X 120Hz 3088x1440',camera:'200MP+50MP+10MP 5x+10MP 10x+12MP',battery:'5000mAh 45W',os:'Android 14 One UI 6.1',weight:'232g'}),
p('phone','Samsung','Samsung Galaxy S24+ 256GB Cobalt Violet',21990000,24990000,12,18,4.7,IMG.samsung_s24,'Galaxy S24+ màn hình 6.7 inch sáng 2600 nits, Galaxy AI và pin 4900mAh với sạc nhanh 45W.',{chip:'Snapdragon 8 Gen 3 for Galaxy',ram:'12GB',storage:'256GB',screen:'6.7" Dynamic AMOLED 2X 120Hz',camera:'50MP+10MP 3x+12MP',battery:'4900mAh 45W',os:'Android 14 One UI 6.1',weight:'196g'}),
p('phone','Samsung','Samsung Galaxy S24 128GB Marble Gray',18990000,20990000,10,25,4.6,IMG.samsung_s24,'Galaxy S24 nhỏ gọn 6.2 inch với Snapdragon 8 Gen 3, Galaxy AI và màn hình 120Hz sáng nhất phân khúc.',{chip:'Snapdragon 8 Gen 3 for Galaxy',ram:'8GB',storage:'128GB',screen:'6.2" Dynamic AMOLED 2X 120Hz',camera:'50MP+10MP 3x+12MP',battery:'4000mAh 25W',os:'Android 14 One UI 6.1',weight:'167g'}),
p('phone','Samsung','Samsung Galaxy Z Fold6 256GB Navy',41990000,46990000,11,8,4.7,IMG.samsung_fold,'Galaxy Z Fold6 mỏng nhất lịch sử Fold, màn hình 7.6 inch như máy tính bảng, hỗ trợ S Pen và Galaxy AI đa nhiệm.',{chip:'Snapdragon 8 Gen 3 for Galaxy',ram:'12GB',storage:'256GB',screen:'Chính 7.6" QXGA+ 120Hz + Phụ 6.3"',camera:'50MP+10MP 3x+12MP',battery:'4400mAh 25W',os:'Android 14 One UI 6.1',weight:'239g'}),
p('phone','Samsung','Samsung Galaxy Z Flip6 256GB Mint',23990000,26990000,11,12,4.6,IMG.samsung_flip,'Galaxy Z Flip6 thời trang gập tiện lợi, màn hình phụ 3.4 inch to hơn và pin 4000mAh cải tiến.',{chip:'Snapdragon 8 Gen 3 for Galaxy',ram:'12GB',storage:'256GB',screen:'Chính 6.7" FHD+ 120Hz + Phụ 3.4"',camera:'50MP+12MP',battery:'4000mAh 25W',os:'Android 14 One UI 6.1',weight:'187g'}),
p('phone','Samsung','Samsung Galaxy S23 Ultra 256GB Phantom Black',22990000,27990000,18,15,4.7,IMG.samsung_s23,'Galaxy S23 Ultra flagship đỉnh với S Pen, camera 200MP và Snapdragon 8 Gen 2 for Galaxy. Vẫn là lựa chọn xuất sắc.',{chip:'Snapdragon 8 Gen 2 for Galaxy',ram:'12GB',storage:'256GB',screen:'6.8" Dynamic AMOLED 2X 120Hz',camera:'200MP+10MP 3x+10MP 10x+12MP',battery:'5000mAh 45W',os:'Android 14 One UI 6',weight:'234g'}),
p('phone','Samsung','Samsung Galaxy S23 FE 128GB Tangerine',12990000,14990000,13,30,4.4,IMG.samsung_s23,'Galaxy S23 FE mang trải nghiệm flagship phổ thông với camera 50MP OIS và màn hình 120Hz AMOLED.',{chip:'Snapdragon 8 Gen 1',ram:'8GB',storage:'128GB',screen:'6.4" FHD+ Dynamic AMOLED 120Hz',camera:'50MP OIS+12MP+8MP 3x',battery:'4500mAh 25W',os:'Android 14 One UI 6',weight:'209g'}),
p('phone','Samsung','Samsung Galaxy A55 5G 256GB Awesome Iceblue',8990000,9990000,10,40,4.5,IMG.samsung_a,'Galaxy A55 thiết kế premium khung nhôm, camera 50MP OIS và màn hình Super AMOLED 120Hz ở phân khúc tầm trung.',{chip:'Samsung Exynos 1480 (4nm)',ram:'8GB',storage:'256GB',screen:'6.6" FHD+ Super AMOLED 120Hz',camera:'50MP OIS+12MP+5MP macro',battery:'5000mAh 25W',os:'Android 14 One UI 6',weight:'213g'}),
p('phone','Samsung','Samsung Galaxy A35 5G 128GB Awesome Navy',6490000,7490000,13,45,4.4,IMG.samsung_a,'Galaxy A35 5G màn hình Super AMOLED 120Hz, camera 50MP và thiết kế IP67 chống nước tầm trung.',{chip:'Samsung Exynos 1380 (5nm)',ram:'6GB',storage:'128GB',screen:'6.6" FHD+ Super AMOLED 120Hz',camera:'50MP+8MP+5MP',battery:'5000mAh 25W',os:'Android 14 One UI 6',weight:'210g'}),
p('phone','Samsung','Samsung Galaxy A25 5G 128GB Blue Black',4990000,6490000,23,50,4.2,IMG.samsung_a,'Galaxy A25 5G giá rẻ với màn hình Super AMOLED 120Hz và camera 50MP, sạc 25W tiện lợi.',{chip:'Samsung Exynos 1280 (5nm)',ram:'6GB',storage:'128GB',screen:'6.5" FHD+ Super AMOLED 120Hz',camera:'50MP+8MP+2MP',battery:'5000mAh 25W',os:'Android 14 One UI 6',weight:'197g'}),
p('phone','Samsung','Samsung Galaxy A15 5G 128GB Blue Black',4490000,5490000,18,60,4.2,IMG.samsung_a,'Galaxy A15 5G pin trâu 5000mAh và màn hình Super AMOLED 90Hz giá phổ thông nhất dòng A.',{chip:'MediaTek Dimensity 6100+ (6nm)',ram:'4GB',storage:'128GB',screen:'6.5" FHD+ Super AMOLED 90Hz',camera:'50MP+5MP+2MP',battery:'5000mAh 25W',os:'Android 14 One UI 6',weight:'200g'}),
p('phone','Xiaomi','Xiaomi 14 Ultra 16GB/512GB',28990000,32990000,12,6,4.8,IMG.xiaomi,'Xiaomi 14 Ultra camera Leica 4 ống kính 50MP với cảm biến 1 inch Sony LYT-900. Sạc không dây 80W siêu nhanh.',{chip:'Snapdragon 8 Gen 3 (4nm)',ram:'16GB LPDDR5X',storage:'512GB UFS 4.0',screen:'6.73" AMOLED 120Hz 3200x1440',camera:'4x50MP Leica cảm biến 1 inch',battery:'5000mAh 90W / 80W wireless',os:'Android 14 HyperOS',weight:'222g'}),
p('phone','Xiaomi','Xiaomi 14 12GB/256GB Jade White',19990000,22990000,13,15,4.7,IMG.xiaomi,'Xiaomi 14 nhỏ gọn với màn hình LTPO AMOLED 6.36 inch và chip Snapdragon 8 Gen 3 mạnh nhất cùng camera Leica 3 ống kính.',{chip:'Snapdragon 8 Gen 3 (4nm)',ram:'12GB LPDDR5X',storage:'256GB UFS 4.0',screen:'6.36" LTPO AMOLED 120Hz 2670x1200',camera:'3x50MP Leica',battery:'4610mAh 90W / 50W wireless',os:'Android 14 HyperOS',weight:'193g'}),
p('phone','Xiaomi','Xiaomi 13T Pro 512GB Alpine Blue',15990000,18990000,16,20,4.6,IMG.xiaomi,'Xiaomi 13T Pro sạc siêu nhanh 144W đầy pin 19 phút. Camera Leica 50MP OIS và màn hình AMOLED 144Hz.',{chip:'MediaTek Dimensity 9200+ (4nm)',ram:'12GB LPDDR5X',storage:'512GB UFS 4.0',screen:'6.67" AMOLED 144Hz 2712x1220',camera:'50MP Leica OIS+50MP Tele 2x+12MP',battery:'5000mAh 144W / 50W wireless',os:'Android 13 MIUI 14',weight:'206g'}),
p('phone','Xiaomi','Redmi Note 13 Pro 256GB Aurora Purple',7990000,9490000,16,35,4.5,IMG.xiaomi,'Redmi Note 13 Pro camera 200MP ấn tượng nhất tầm trung, màn hình AMOLED 120Hz và sạc nhanh 67W.',{chip:'Snapdragon 7s Gen 2 (4nm)',ram:'8GB',storage:'256GB',screen:'6.67" AMOLED 120Hz FHD+',camera:'200MP+8MP+2MP macro',battery:'5000mAh 67W',os:'Android 13 MIUI 14',weight:'187g'}),
p('phone','Xiaomi','Redmi Note 13 4G 128GB Ice Blue',4990000,5990000,17,50,4.3,IMG.xiaomi,'Redmi Note 13 4G màn hình AMOLED 90Hz, camera 108MP và pin 5000mAh. Ngân sách tiết kiệm tốt nhất.',{chip:'MediaTek Helio G85 (12nm)',ram:'6GB',storage:'128GB',screen:'6.67" AMOLED 90Hz FHD+',camera:'108MP+8MP+2MP',battery:'5000mAh 33W',os:'Android 13 MIUI 13',weight:'188g'}),
p('phone','Xiaomi','Poco X6 Pro 256GB Yellow',9490000,11490000,17,25,4.5,IMG.xiaomi,'Poco X6 Pro chip Dimensity 8300 Ultra gaming, màn hình Flow AMOLED 144Hz và camera 64MP OIS.',{chip:'MediaTek Dimensity 8300 Ultra (4nm)',ram:'12GB',storage:'256GB',screen:'6.67" Flow AMOLED 144Hz',camera:'64MP OIS+8MP+2MP',battery:'5000mAh 67W',os:'Android 14 HyperOS',weight:'186g'}),
p('phone','Xiaomi','Xiaomi Redmi 13C 128GB Midnight Black',2990000,3490000,14,80,4.0,IMG.xiaomi,'Redmi 13C giá siêu rẻ với chip Helio G85, camera 50MP và pin 5000mAh phù hợp người dùng cơ bản.',{chip:'MediaTek Helio G85',ram:'4GB',storage:'128GB',screen:'6.74" IPS LCD 90Hz HD+',camera:'50MP+AI',battery:'5000mAh 18W',os:'Android 13 MIUI 13',weight:'192g'}),
p('phone','Google','Google Pixel 8 Pro 256GB Bay',22990000,26990000,15,10,4.7,IMG.google_pixel,'Pixel 8 Pro màn hình LTPO OLED 120Hz Always-On, Tensor G3 tối ưu AI và Best Take/Magic Eraser độc quyền. Hỗ trợ 7 năm.',{chip:'Google Tensor G3 (4nm)',ram:'12GB LPDDR5X',storage:'256GB',screen:'6.7" LTPO OLED 120Hz 2992x1344 Always-On',camera:'50MP+48MP+48MP Tele 5x',battery:'5050mAh 30W / 23W wireless',os:'Android 14',weight:'213g'}),
p('phone','Google','Google Pixel 8 128GB Hazel',18490000,21990000,16,12,4.6,IMG.google_pixel,'Pixel 8 với màn hình Actua OLED 120Hz, Tensor G3 và camera 50MP chụp portrait cực đẹp nhờ xử lý AI.',{chip:'Google Tensor G3 (4nm)',ram:'8GB',storage:'128GB',screen:'6.2" OLED 120Hz 2400x1080',camera:'50MP+12MP',battery:'4575mAh 27W',os:'Android 14',weight:'187g'}),
p('phone','Google','Google Pixel 7a 128GB Snow',11990000,14990000,20,18,4.5,IMG.google_pixel,'Pixel 7a camera Pixel flagship ở phân khúc tầm trung với màn hình OLED 90Hz hiếm thấy ở tầm giá.',{chip:'Google Tensor G2 (5nm)',ram:'8GB',storage:'128GB',screen:'6.1" OLED 90Hz 2400x1080',camera:'64MP+13MP',battery:'4385mAh 18W + wireless',os:'Android 14',weight:'193g'}),
p('phone','Oppo','Oppo Find X7 Ultra 256GB',26990000,31990000,16,8,4.7,IMG.oppo,'Oppo Find X7 Ultra camera Hasselblad 2 cảm biến 1 inch và periscope zoom 6x. Sạc 100W đầy pin 26 phút.',{chip:'Snapdragon 8 Gen 3 (4nm)',ram:'12GB LPDDR5X',storage:'256GB UFS 4.0',screen:'6.82" LTPO3 AMOLED 120Hz 3168x1440',camera:'50MP 1"+50MP 1"+64MP+12MP',battery:'5000mAh 100W / 50W wireless',os:'Android 14 ColorOS 14',weight:'221g'}),
p('phone','Oppo','Oppo Reno11 Pro 5G 256GB Burgundy Red',12490000,14990000,17,20,4.4,IMG.oppo,'Reno11 Pro camera chân dung 50MP OIS và mặt lưng ánh sáng 3D. Sạc SUPERVOOC 80W đầy pin 30 phút.',{chip:'MediaTek Dimensity 8200 (4nm)',ram:'12GB',storage:'256GB',screen:'6.7" AMOLED 120Hz cong',camera:'50MP OIS+32MP+8MP',battery:'4600mAh 80W',os:'Android 14 ColorOS 14',weight:'185g'}),
p('phone','Oppo','Oppo A98 5G 256GB Cool Black',8990000,9990000,10,30,4.3,IMG.oppo,'Oppo A98 5G Snapdragon 695, màn hình FHD+ 120Hz và pin 5000mAh sạc 67W phù hợp sinh viên.',{chip:'Snapdragon 695 5G (6nm)',ram:'8GB',storage:'256GB',screen:'6.72" FHD+ LCD 120Hz',camera:'64MP+2MP+2MP',battery:'5000mAh 67W',os:'Android 13 ColorOS 13',weight:'193g'}),
p('phone','OnePlus','OnePlus 12 16GB/512GB Silky Black',22990000,26990000,15,10,4.7,IMG.oneplus,'OnePlus 12 camera Hasselblad, Snapdragon 8 Gen 3 và sạc 100W đầy pin siêu tốc. Màn hình ProXDR 120Hz cực sắc.',{chip:'Snapdragon 8 Gen 3 (4nm)',ram:'16GB LPDDR5X',storage:'512GB UFS 4.0',screen:'6.82" LTPO3 AMOLED 120Hz 3168x1440',camera:'50MP Hasselblad+48MP+64MP Tele 3x',battery:'5400mAh 100W / 50W wireless',os:'Android 14 OxygenOS 14',weight:'220g'}),
p('phone','OnePlus','OnePlus Nord CE 4 256GB Dark Chrome',8490000,9990000,15,25,4.4,IMG.oneplus,'OnePlus Nord CE 4 Snapdragon 7 Gen 3, màn hình AMOLED 120Hz và sạc 100W siêu nhanh tầm trung.',{chip:'Snapdragon 7 Gen 3 (4nm)',ram:'8GB',storage:'256GB',screen:'6.7" FHD+ AMOLED 120Hz',camera:'50MP OIS+8MP',battery:'5500mAh 100W',os:'Android 14 OxygenOS 14',weight:'193g'}),
p('phone','Vivo','Vivo X100 Pro 12GB/256GB Asteroid Black',23990000,27990000,14,8,4.7,IMG.vivo,'Vivo X100 Pro camera ZEISS 50MP, chip Dimensity 9300 mạnh nhất và sạc không dây 100W đầy pin siêu tốc.',{chip:'MediaTek Dimensity 9300 (4nm)',ram:'12GB LPDDR5X',storage:'256GB UFS 4.0',screen:'6.78" LTPO AMOLED 120Hz',camera:'50MP ZEISS+50MP+50MP',battery:'5400mAh 100W / 50W wireless',os:'Android 14 Funtouch OS 14',weight:'221g'}),
p('phone','Vivo','Vivo V30 Pro 256GB Sequoia Green',12990000,14990000,13,20,4.5,IMG.vivo,'Vivo V30 Pro camera chân dung đèn vòng AURA LIGHT, màn hình AMOLED 120Hz cong và Snapdragon 7 Gen 3.',{chip:'Snapdragon 7 Gen 3 (4nm)',ram:'12GB',storage:'256GB',screen:'6.78" FHD+ AMOLED cong 120Hz',camera:'50MP OIS+50MP ZEISS+8MP',battery:'5000mAh 80W',os:'Android 14 Funtouch OS 14',weight:'186g'}),
p('phone','Motorola','Motorola Edge 50 Pro 256GB Black Beauty',9990000,11990000,17,20,4.4,IMG.motorola,'Motorola Edge 50 Pro màn hình pOLED 144Hz mượt nhất tầm trung và sạc turbo 125W đầy pin 25 phút.',{chip:'Snapdragon 7s Gen 2 (4nm)',ram:'12GB',storage:'256GB',screen:'6.7" pOLED 144Hz FHD+',camera:'50MP OIS+10MP 2x+13MP',battery:'4500mAh 125W / 50W wireless',os:'Android 14 My UX',weight:'186g'}),
p('phone','Motorola','Motorola Moto G84 256GB Marshmallow Blue',4990000,5990000,17,35,4.2,IMG.motorola,'Moto G84 màn hình pOLED 120Hz hiếm ở tầm giá, chip Snapdragon 695 và pin 5000mAh dùng lâu.',{chip:'Snapdragon 695 (6nm)',ram:'12GB',storage:'256GB',screen:'6.55" pOLED 120Hz FHD+',camera:'50MP OIS+8MP',battery:'5000mAh 33W',os:'Android 14 My UX',weight:'186g'}),
p('phone','Realme','Realme GT 6 256GB Fluid Silver',11990000,14990000,20,15,4.5,IMG.realme,'Realme GT 6 flagship killer Snapdragon 8s Gen 3, màn hình 1.5K AMOLED 120Hz và sạc 120W siêu nhanh.',{chip:'Snapdragon 8s Gen 3 (4nm)',ram:'12GB LPDDR5X',storage:'256GB UFS 4.0',screen:'6.78" 1.5K AMOLED 120Hz 2780x1264',camera:'50MP OIS+8MP+2MP',battery:'5500mAh 120W',os:'Android 14 Realme UI 5.0',weight:'199g'}),
p('phone','Realme','Realme 12 Pro+ 256GB Navigator Beige',9490000,11490000,17,25,4.4,IMG.realme,'Realme 12 Pro+ camera periscope zoom 3x và thiết kế vân da sang trọng. Snapdragon 7s Gen 2 và AMOLED 120Hz.',{chip:'Snapdragon 7s Gen 2 (4nm)',ram:'12GB',storage:'256GB',screen:'6.7" FHD+ AMOLED 120Hz cong',camera:'50MP OIS+8MP+50MP Tele 3x periscope',battery:'5000mAh 67W',os:'Android 14 Realme UI 5.0',weight:'196g'}),
p('phone','Nokia','Nokia G42 5G 128GB So Purple',3990000,4990000,20,40,4.0,IMG.nokia,'Nokia G42 5G bền bỉ với khả năng tự sửa chữa và thay pin dễ dàng, Snapdragon 480+ và camera 50MP.',{chip:'Snapdragon 480+ (8nm)',ram:'6GB',storage:'128GB',screen:'6.56" HD+ LCD 90Hz',camera:'50MP+2MP macro+2MP',battery:'5000mAh 20W (có thể thay pin)',os:'Android 13',weight:'193g'}),

// ============================
// LAPTOP
// ============================
p('laptop','Apple','MacBook Air M3 13 inch 8GB/256GB Midnight',27990000,29990000,7,20,4.8,IMG.macbook_air,'MacBook Air M3 2024 siêu mỏng nhẹ 1.24kg, chip M3 cực mạnh, pin 18 tiếng và hỗ trợ 2 màn hình ngoài.',{cpu:'Apple M3 (8-nhân CPU, 10-nhân GPU)',ram:'8GB Unified Memory',storage:'256GB SSD',screen:'13.6" Liquid Retina 2560x1664',battery:'52.6Wh 18 giờ',weight:'1.24kg',ports:'2x Thunderbolt 4 + MagSafe 3 + 3.5mm',os:'macOS Sonoma'}),
p('laptop','Apple','MacBook Air M3 13 inch 16GB/512GB Starlight',37990000,39990000,5,15,4.9,IMG.macbook_air,'MacBook Air M3 cấu hình cao 16GB RAM xử lý mượt design, lập trình. Không quạt, không nóng, không giới hạn.',{cpu:'Apple M3 (8-nhân CPU, 10-nhân GPU)',ram:'16GB Unified Memory',storage:'512GB SSD',screen:'13.6" Liquid Retina 2560x1664',battery:'52.6Wh 18 giờ',weight:'1.24kg',ports:'2x Thunderbolt 4 + MagSafe 3 + 3.5mm',os:'macOS Sonoma'}),
p('laptop','Apple','MacBook Air M2 15 inch 8GB/256GB Midnight',32990000,35990000,8,12,4.8,IMG.macbook_air,'MacBook Air M2 15 inch màn hình lớn 15.3 inch Liquid Retina, chip M2 mạnh và pin 18 tiếng. Hoàn hảo cần màn hình lớn mà vẫn mỏng nhẹ.',{cpu:'Apple M2 (8-nhân CPU, 10-nhân GPU)',ram:'8GB Unified Memory',storage:'256GB SSD',screen:'15.3" Liquid Retina 2880x1864',battery:'66.5Wh 18 giờ',weight:'1.51kg',ports:'2x Thunderbolt 4 + MagSafe 3 + 3.5mm',os:'macOS Sonoma'}),
p('laptop','Apple','MacBook Pro M3 14 inch 18GB/512GB Space Black',54990000,59990000,8,8,4.9,IMG.macbook_pro14,'MacBook Pro M3 14 inch màn hình ProMotion XDR 120Hz siêu sắc nét. Chip M3 Pro 11-nhân CPU cực mạnh cho lập trình viên, video editor chuyên nghiệp.',{cpu:'Apple M3 Pro (11-nhân CPU, 14-nhân GPU)',ram:'18GB Unified Memory',storage:'512GB SSD',screen:'14.2" Liquid Retina XDR 3024x1964 120Hz',battery:'72.4Wh 18 giờ',weight:'1.61kg',ports:'3x Thunderbolt 4 + HDMI + SDXC + MagSafe 3',os:'macOS Sonoma'}),
p('laptop','Apple','MacBook Pro M3 Max 14 inch 36GB/1TB',89990000,95990000,6,5,4.9,IMG.macbook_pro,'MacBook Pro M3 Max đỉnh nhất với 36GB RAM và chip M3 Max 40-nhân GPU. Render 3D và biên tập video 8K siêu mượt.',{cpu:'Apple M3 Max (16-nhân CPU, 40-nhân GPU)',ram:'36GB Unified Memory',storage:'1TB SSD',screen:'14.2" Liquid Retina XDR 3024x1964 120Hz',battery:'72.4Wh 18 giờ',weight:'1.62kg',ports:'3x Thunderbolt 4 + HDMI + SDXC + MagSafe 3',os:'macOS Sonoma'}),
p('laptop','Apple','MacBook Pro M3 16 inch 18GB/512GB Silver',64990000,69990000,7,6,4.9,IMG.macbook_pro,'MacBook Pro M3 16 inch màn hình rộng lớn ProMotion XDR 120Hz. M3 Pro 12-nhân CPU và 18-nhân GPU xuất sắc cho công việc chuyên nghiệp.',{cpu:'Apple M3 Pro (12-nhân CPU, 18-nhân GPU)',ram:'18GB Unified Memory',storage:'512GB SSD',screen:'16.2" Liquid Retina XDR 3456x2234 120Hz',battery:'99.6Wh 22 giờ',weight:'2.14kg',ports:'3x Thunderbolt 4 + HDMI + SDXC + MagSafe 3',os:'macOS Sonoma'}),
p('laptop','Dell','Dell XPS 13 Plus 9320 Core i7-1360P',42500000,48500000,12,6,4.5,IMG.dell_xps,'Dell XPS 13 Plus thiết kế đột phá bàn phím tràn viền, TouchBar ẩn và màn hình OLED chuẩn màu tuyệt đẹp.',{cpu:'Intel Core i7-1360P (12 nhân, 16 luồng)',ram:'16GB LPDDR5 6000MHz',storage:'512GB SSD PCIe Gen4',screen:'13.4" OLED FHD+ InfinityEdge Touch',battery:'55Wh ~8-10 giờ',weight:'1.26kg',ports:'2x Thunderbolt 4 + 3.5mm',os:'Windows 11 Home'}),
p('laptop','Dell','Dell XPS 15 9530 Core i7 RTX 4060',55990000,62990000,11,5,4.6,IMG.dell_xps,'Dell XPS 15 màn hình 15.6 inch OLED cực sắc nét, Core i7-13700H và RTX 4060 8GB cho đồ họa chuyên nghiệp.',{cpu:'Intel Core i7-13700H (14 nhân)',ram:'16GB DDR5',storage:'512GB SSD PCIe Gen4',screen:'15.6" OLED Touch 3456x2160',battery:'86Wh',weight:'1.86kg',gpu:'NVIDIA RTX 4060 8GB',ports:'2x Thunderbolt 4 + USB-A + SDXC',os:'Windows 11 Home'}),
p('laptop','Dell','Dell Inspiron 15 3535 AMD Ryzen 7 7730U',15990000,18990000,16,20,4.2,IMG.dell_inspiron,'Dell Inspiron 15 phổ thông với Ryzen 7 7730U, màn hình FHD+ 120Hz mượt mà và pin 54Wh dùng cả ngày.',{cpu:'AMD Ryzen 7 7730U (8 nhân)',ram:'16GB DDR4',storage:'512GB SSD',screen:'15.6" FHD+ IPS 120Hz',battery:'54Wh ~7-8 giờ',weight:'1.65kg',ports:'USB-C + 2x USB-A + HDMI + SD',os:'Windows 11 Home'}),
p('laptop','Dell','Dell G15 Gaming 5530 Core i7 RTX 4060',29990000,34990000,14,10,4.4,IMG.dell_inspiron,'Dell G15 gaming giá hợp lý với Core i7-13650HX, RTX 4060 8GB và màn hình 165Hz chiến game AAA siêu mượt.',{cpu:'Intel Core i7-13650HX (14 nhân)',ram:'16GB DDR5',storage:'512GB SSD PCIe Gen4',screen:'15.6" FHD 165Hz IPS',battery:'86Wh',weight:'2.54kg',gpu:'NVIDIA RTX 4060 8GB',ports:'USB-C + 2x USB-A + HDMI 2.1 + RJ45',os:'Windows 11 Home'}),
p('laptop','Asus','Asus ROG Zephyrus G14 OLED 2024 Ryzen 9',49990000,54990000,9,6,4.8,IMG.asus_rog,'Asus ROG Zephyrus G14 2024 gaming mỏng nhẹ đẹp nhất, màn hình OLED 3K 120Hz AniMe Matrix và RTX 4070.',{cpu:'AMD Ryzen 9 8945HS (8 nhân)',ram:'16GB LPDDR5X',storage:'1TB SSD PCIe 4.0',screen:'14" OLED 3K 2880x1800 120Hz',battery:'73Wh',weight:'1.50kg',gpu:'NVIDIA RTX 4070 8GB',ports:'2x USB-C (1x TB4) + 2x USB-A + HDMI 2.1',os:'Windows 11 Home'}),
p('laptop','Asus','Asus ROG Strix G16 Core i9 RTX 4070',54990000,62990000,13,5,4.7,IMG.asus_rog,'Asus ROG Strix G16 với Core i9-14900HX cực mạnh và RTX 4070 12GB, màn hình QHD 240Hz gaming đỉnh.',{cpu:'Intel Core i9-14900HX (24 nhân)',ram:'16GB DDR5',storage:'1TB SSD PCIe 4.0',screen:'16" QHD 2560x1600 240Hz MUX',battery:'90Wh',weight:'2.50kg',gpu:'NVIDIA RTX 4070 12GB',ports:'1x TB4 + 1x USB-C + 3x USB-A + HDMI 2.1 + RJ45',os:'Windows 11 Home'}),
p('laptop','Asus','Asus ZenBook 14 OLED Core Ultra 7',32990000,37990000,13,10,4.6,IMG.asus_zenbook,'Asus ZenBook 14 OLED với Core Ultra 7 AI, màn hình OLED 3K 120Hz sắc nét và thiết kế nhôm mỏng nhẹ 1.28kg.',{cpu:'Intel Core Ultra 7 155H (16 nhân)',ram:'16GB LPDDR5X',storage:'512GB SSD PCIe 4.0',screen:'14" OLED 3K 2880x1800 120Hz',battery:'75Wh ~12-14 giờ',weight:'1.28kg',ports:'2x USB-C + USB-A + HDMI + SDXC',os:'Windows 11 Home'}),
p('laptop','Asus','Asus VivoBook 15 OLED Ryzen 5 7530U',16990000,19990000,15,15,4.3,IMG.asus_zenbook,'Asus VivoBook 15 OLED màn hình OLED FHD siêu sắc nét ở tầm giá trung bình, AMD Ryzen 5 mạnh mẽ.',{cpu:'AMD Ryzen 5 7530U (6 nhân)',ram:'16GB DDR4',storage:'512GB SSD',screen:'15.6" OLED FHD 1920x1080 60Hz',battery:'50Wh',weight:'1.8kg',ports:'USB-C + 2x USB-A + HDMI + SD',os:'Windows 11 Home'}),
p('laptop','Lenovo','Lenovo ThinkPad X1 Carbon Gen 12 Core Ultra 7',52990000,58990000,10,8,4.7,IMG.lenovo_thinkpad,'ThinkPad X1 Carbon Gen 12 siêu nhẹ 1.08kg chuẩn quân đội MIL-STD-810H, Core Ultra 7 AI và bàn phím số 1 thế giới.',{cpu:'Intel Core Ultra 7 155U (12 nhân)',ram:'32GB LPDDR5X',storage:'1TB SSD PCIe 4.0',screen:'14" OLED 2.8K 2880x1800 120Hz',battery:'57Wh ~15 giờ',weight:'1.08kg',ports:'2x TB4 + 2x USB-A + HDMI',os:'Windows 11 Pro'}),
p('laptop','Lenovo','Lenovo IdeaPad Slim 5 16 Ryzen 7 7730U',18990000,22990000,17,12,4.3,IMG.lenovo_ideapad,'Lenovo IdeaPad Slim 5 Ryzen 7 7730U, màn hình 16 inch FHD+ IPS chống chói và pin 60Wh dùng cả ngày.',{cpu:'AMD Ryzen 7 7730U (8 nhân)',ram:'16GB DDR4',storage:'512GB SSD',screen:'16" FHD+ 1920x1200 IPS',battery:'60Wh ~8 giờ',weight:'1.73kg',ports:'USB-C + 2x USB-A + HDMI + SD',os:'Windows 11 Home'}),
p('laptop','Lenovo','Lenovo Legion 5 Pro Ryzen 7 7745HX RTX 4060',37990000,43990000,14,8,4.6,IMG.lenovo_thinkpad,'Lenovo Legion 5 Pro gaming màn hình 2.5K 165Hz, Ryzen 7 7745HX cực mạnh và RTX 4060 8GB.',{cpu:'AMD Ryzen 7 7745HX (8 nhân)',ram:'16GB DDR5',storage:'512GB SSD PCIe 4.0',screen:'16" QHD+ 2560x1600 165Hz IPS',battery:'80Wh',weight:'2.4kg',gpu:'NVIDIA RTX 4060 8GB',ports:'1x TB4 + 2x USB-A + HDMI 2.1 + RJ45',os:'Windows 11 Home'}),
p('laptop','HP','HP Spectre x360 14 Core Ultra 7 OLED',42990000,48990000,12,6,4.7,IMG.hp_spectre,'HP Spectre x360 14 cao cấp nhất với màn hình OLED 2.8K cảm ứng xoay 360 độ và Core Ultra 7 AI. Thiết kế gem cut sang trọng.',{cpu:'Intel Core Ultra 7 155H (16 nhân)',ram:'16GB LPDDR5X',storage:'512GB SSD PCIe 4.0',screen:'14" OLED 2.8K 2880x1800 Touch 120Hz',battery:'66Wh ~17 giờ',weight:'1.40kg',ports:'2x TB4 + USB-A + HDMI',os:'Windows 11 Home'}),
p('laptop','HP','HP Pavilion 15 Core i5-1335U 8GB/512GB',14990000,17990000,17,18,4.1,IMG.hp_pavilion,'HP Pavilion 15 phổ thông với Core i5-1335U và màn hình FHD IPS 60Hz. Phù hợp học sinh sinh viên ngân sách trung bình.',{cpu:'Intel Core i5-1335U (10 nhân)',ram:'8GB DDR4',storage:'512GB SSD',screen:'15.6" FHD 1920x1080 IPS 60Hz',battery:'41Wh',weight:'1.75kg',ports:'USB-C + 2x USB-A + HDMI + SD',os:'Windows 11 Home'}),
p('laptop','HP','HP OMEN 16 Core i7 RTX 4070',45990000,52990000,13,5,4.5,IMG.hp_spectre,'HP OMEN 16 Core i7-13700HX và RTX 4070 16GB, màn hình QHD 165Hz và tản nhiệt OMEN Tempest Cooling.',{cpu:'Intel Core i7-13700HX (16 nhân)',ram:'16GB DDR5',storage:'1TB SSD PCIe Gen4',screen:'16.1" QHD 2560x1440 165Hz IPS',battery:'83Wh',weight:'2.29kg',gpu:'NVIDIA RTX 4070 16GB',ports:'1x TB4 + 3x USB-A + HDMI 2.1 + RJ45 + SD',os:'Windows 11 Home'}),
p('laptop','Acer','Acer Predator Helios Neo 16 Core i7 RTX 4060',32490000,37490000,13,10,4.4,IMG.acer_predator,'Acer Predator Helios Neo 16 gaming Core i7-13700HX, RTX 4060 và tản nhiệt kim loại lỏng độc quyền.',{cpu:'Intel Core i7-13700HX (16 nhân)',ram:'16GB DDR5',storage:'512GB SSD PCIe Gen4',screen:'16" WQXGA 2560x1600 165Hz IPS',battery:'90Wh',weight:'2.60kg',gpu:'NVIDIA RTX 4060 8GB',ports:'USB-C + 3x USB-A + HDMI 2.1 + RJ45 + SD',os:'Windows 11 Home'}),
p('laptop','Acer','Acer Swift Go 14 OLED Core Ultra 5 125H',22990000,26990000,15,12,4.5,IMG.acer_swift,'Acer Swift Go 14 OLED mỏng nhẹ 1.35kg, màn hình OLED 2.8K 90Hz và Core Ultra 5 AI, pin hơn 12 giờ.',{cpu:'Intel Core Ultra 5 125H (14 nhân)',ram:'16GB LPDDR5X',storage:'512GB SSD PCIe 4.0',screen:'14" OLED 2.8K 2880x1800 90Hz',battery:'65Wh ~12 giờ',weight:'1.35kg',ports:'2x USB4 (TB4) + USB-A + HDMI + SD',os:'Windows 11 Home'}),
p('laptop','MSI','MSI Titan GT77 HX Core i9 RTX 4090',89990000,99990000,10,3,4.8,IMG.msi_gaming,'MSI Titan GT77 HX Core i9-13980HX 24 nhân và RTX 4090 16GB mạnh nhất laptop. Màn hình 4K 144Hz đỉnh cao.',{cpu:'Intel Core i9-13980HX (24 nhân)',ram:'32GB DDR5',storage:'2TB SSD PCIe Gen4',screen:'17.3" 4K UHD 3840x2160 144Hz IPS',battery:'99.9Wh',weight:'3.30kg',gpu:'NVIDIA RTX 4090 16GB',ports:'2x TB5 + 3x USB-A + HDMI 2.1 + SD + RJ45',os:'Windows 11 Home'}),
p('laptop','MSI','MSI Katana 15 Core i7 RTX 4070',34990000,39990000,13,8,4.4,IMG.msi_gaming,'MSI Katana 15 Core i7-13620H và RTX 4070 8GB. Màn hình FHD 144Hz và giá hợp lý nhất cho hiệu năng này.',{cpu:'Intel Core i7-13620H (10 nhân)',ram:'16GB DDR5',storage:'512GB SSD PCIe Gen4',screen:'15.6" FHD 1920x1080 144Hz IPS',battery:'52.4Wh',weight:'2.25kg',gpu:'NVIDIA RTX 4070 8GB',ports:'USB-C + 3x USB-A + HDMI 2.0 + RJ45',os:'Windows 11 Home'}),
p('laptop','Razer','Razer Blade 16 Core i9 RTX 4090',119990000,129990000,8,2,4.9,IMG.razer,'Razer Blade 16 gaming mỏng đẹp nhất thế giới, dual-mode 4K 60Hz/FHD 240Hz, Core i9-13950HX và RTX 4090 trong vỏ nhôm CNC.',{cpu:'Intel Core i9-13950HX (24 nhân)',ram:'32GB DDR5',storage:'1TB SSD PCIe Gen4',screen:'16" Dual-mode 4K Mini-LED / FHD 240Hz',battery:'95.2Wh',weight:'2.14kg',gpu:'NVIDIA RTX 4090 16GB',ports:'3x TB4 + 3x USB-A + HDMI 2.1 + SD',os:'Windows 11 Home'}),
p('laptop','LG','LG Gram 17 Core Ultra 7 2024',39990000,44990000,11,6,4.7,IMG.lg_gram,'LG Gram 17 siêu nhẹ nhất thế giới ở size 17 inch chỉ 1.35kg. Màn hình IPS+ 17 inch và pin 80Wh dùng cực lâu.',{cpu:'Intel Core Ultra 7 155H (16 nhân)',ram:'16GB LPDDR5X',storage:'512GB SSD PCIe 4.0',screen:'17" WQXGA 2560x1600 IPS+',battery:'80Wh ~22 giờ',weight:'1.35kg',ports:'2x TB4 + 2x USB-A + HDMI + SD',os:'Windows 11 Home'}),
p('laptop','LG','LG Gram 14 Core Ultra 5 125H',28990000,33990000,15,8,4.6,IMG.lg_gram,'LG Gram 14 nhỏ gọn chỉ 980g, Core Ultra 5 AI, chuẩn quân đội MIL-STD-810H và pin 72Wh dùng 18 tiếng.',{cpu:'Intel Core Ultra 5 125H (14 nhân)',ram:'16GB LPDDR5X',storage:'512GB SSD PCIe 4.0',screen:'14" WQXGA 2560x1600 IPS',battery:'72Wh ~18 giờ',weight:'0.98kg',ports:'2x TB4 + 2x USB-A + HDMI + SD',os:'Windows 11 Home'}),

// ============================
// TIVI
// ============================
p('tv','Samsung','Samsung Neo QLED 8K 65 inch QN900D',149990000,179990000,17,3,4.9,IMG.samsung_qled,'Samsung Neo QLED 8K siêu phân giải 7680x4320, chip NQ8 AI Gen3 nâng cấp mọi nội dung lên 8K. Dolby Atmos 70W vòm không gian.',{screen:'65" Neo QLED 8K 7680x4320',panel:'Neo Quantum Matrix Pro',brightness:'4000 nit',refresh:'144Hz',sound:'Dolby Atmos 70W 4.2.2',os:'Tizen 8.0',connectivity:'WiFi 6E, BT 5.2, 4x HDMI 2.1, 3x USB'}),
p('tv','Samsung','Samsung Neo QLED 4K 75 inch QN90D',69990000,82990000,16,5,4.8,IMG.samsung_qled,'Samsung Neo QLED 4K QN90D với Mini LED Quantum Matrix, HDR2000 cực sáng và tần số quét 144Hz gaming mượt.',{screen:'75" Neo QLED 4K 3840x2160',panel:'Quantum Matrix Technology Pro',brightness:'2000 nit HDR',refresh:'144Hz',sound:'Dolby Atmos 60W 4.2.2',os:'Tizen 8.0',connectivity:'WiFi 6E, BT 5.2, 4x HDMI 2.1'}),
p('tv','Samsung','Samsung QLED 4K 65 inch Q80D',34990000,41990000,17,8,4.6,IMG.samsung_qled,'Samsung QLED 4K Q80D Quantum Dot màu sắc rực rỡ, Direct Full Array và HDR1500. VRR và ALLM cho gaming.',{screen:'65" QLED 4K 3840x2160',panel:'Quantum Dot Direct Full Array',brightness:'1500 nit',refresh:'120Hz',sound:'Dolby Atmos 40W 2.2.2',os:'Tizen 8.0',connectivity:'WiFi 5, BT 5.0, 4x HDMI 2.1'}),
p('tv','Samsung','Samsung Crystal UHD 4K 55 inch DU8500',15990000,19990000,20,15,4.4,IMG.samsung_tv,'Samsung Crystal UHD 4K 55 inch bộ xử lý Crystal 4K màu sắc sống động. AirSlim siêu mỏng và Gaming Hub tiện lợi.',{screen:'55" Crystal UHD 4K 3840x2160',panel:'Direct Lit VA',brightness:'250 nit',refresh:'60Hz',sound:'20W 2.0',os:'Tizen 8.0',connectivity:'WiFi 5, BT 5.0, 2x HDMI 2.0'}),
p('tv','Samsung','Samsung Crystal UHD 4K 43 inch DU7700',9990000,12990000,23,20,4.3,IMG.samsung_tv,'Samsung Crystal UHD 43 inch nhỏ gọn giá phải chăng, màu Crystal 4K và SmartThings nhà thông minh tích hợp.',{screen:'43" Crystal UHD 4K 3840x2160',panel:'Direct Lit VA',brightness:'200 nit',refresh:'60Hz',sound:'20W 2.0',os:'Tizen 8.0',connectivity:'WiFi 5, BT 5.0, 2x HDMI 2.0'}),
p('tv','Samsung','Samsung The Frame 4K 65 inch LS03D',38990000,46990000,17,6,4.7,IMG.samsung_qled,'Samsung The Frame tivi nghệ thuật treo tường như khung tranh, màn hình matte anti-glare và Art Mode nghệ thuật.',{screen:'65" QLED 4K 3840x2160 Matte',panel:'QLED',brightness:'700 nit',refresh:'120Hz',sound:'Dolby Atmos 40W 2.2.2',os:'Tizen 8.0',connectivity:'WiFi 6, BT 5.2, 4x HDMI 2.0'}),
p('tv','LG','LG OLED evo 77 inch C4 4K',79990000,94990000,16,4,4.9,IMG.lg_oled,'LG OLED evo C4 pixel tự phát sáng hoàn hảo, màu đen tuyệt đối và Alpha 11 AI. Gaming 144Hz HDMI 2.1 đỉnh cao.',{screen:'77" OLED evo 4K 3840x2160',panel:'OLED evo pixel tự phát sáng',brightness:'OLED Brightness Booster Max',refresh:'144Hz G-Sync FreeSync',sound:'Dolby Atmos 60W 4.2',os:'webOS 24',connectivity:'WiFi 6E, BT 5.1, 4x HDMI 2.1 (48Gbps)'}),
p('tv','LG','LG OLED evo 65 inch C4 4K',54990000,64990000,15,6,4.9,IMG.lg_oled,'LG OLED C4 65 inch TV gaming tốt nhất thế giới với 4x HDMI 2.1 48Gbps, 144Hz và độ trễ 1ms cực thấp.',{screen:'65" OLED evo 4K 3840x2160',panel:'OLED evo',brightness:'OLED Brightness Booster Max',refresh:'144Hz',sound:'Dolby Atmos 60W 4.2',os:'webOS 24',connectivity:'WiFi 6E, BT 5.1, 4x HDMI 2.1 (48Gbps)'}),
p('tv','LG','LG OLED evo 55 inch G4 Gallery 4K',64990000,77990000,17,4,4.9,IMG.lg_oled,'LG OLED G4 Gallery OLED MLA sáng nhất 3000 nit, thiết kế phẳng gắn tường và Alpha 11 AI tối ưu hình ảnh.',{screen:'55" OLED evo 4K 3840x2160 MLA',panel:'OLED evo MLA Micro Lens Array',brightness:'3000 nit',refresh:'144Hz',sound:'Dolby Atmos 60W 4.2',os:'webOS 24',connectivity:'WiFi 6E, BT 5.1, 4x HDMI 2.1'}),
p('tv','LG','LG NanoCell 4K 55 inch NANO89 2024',18990000,23990000,21,10,4.4,IMG.lg_nanocell,'LG NanoCell 55 inch màu sắc mở rộng NanoCell, màn hình IPS góc nhìn rộng phù hợp cả gia đình. webOS 24 thông minh.',{screen:'55" NanoCell 4K 3840x2160 IPS',panel:'NanoCell IPS',brightness:'400 nit',refresh:'60Hz',sound:'Dolby Atmos 20W 2.0',os:'webOS 24',connectivity:'WiFi 5, BT 5.0, 3x HDMI 2.0'}),
p('tv','LG','LG UHD 4K 43 inch UR78 2024',8490000,10490000,19,20,4.2,IMG.lg_nanocell,'LG UHD 43 inch giá tốt với upscaling 4K AI, webOS 24, Filmmaker Mode và HDR10 Pro chính xác màu sắc.',{screen:'43" UHD 4K 3840x2160',panel:'Direct Lit VA',brightness:'300 nit',refresh:'60Hz',sound:'20W 2.0',os:'webOS 24',connectivity:'WiFi 5, BT 5.0, 3x HDMI 2.0'}),
p('tv','Sony','Sony Bravia XR A95L OLED 65 inch 4K',84990000,99990000,15,3,4.9,IMG.sony_bravia,'Sony Bravia A95L QD-OLED thế hệ 3 sắc nét nhất, XR Cognitive Processor và Acoustic Surface Audio+ loa trong màn hình.',{screen:'65" QD-OLED 4K 3840x2160',panel:'QD-OLED Quantum Dot OLED',brightness:'2000 nit',refresh:'120Hz',sound:'Dolby Atmos Acoustic Surface Audio+ 60W',os:'Google TV',connectivity:'WiFi 6, BT 5.2, 4x HDMI 2.1'}),
p('tv','Sony','Sony Bravia X95L Mini LED 75 inch 4K',69990000,82990000,15,4,4.8,IMG.sony_bravia,'Sony Bravia X95L Mini LED Full Array 1000+ zones, HDR3000 nit và XR Triluminos Pro màu sắc đẹp không đối thủ.',{screen:'75" Mini LED 4K 3840x2160',panel:'Full Array Local Dimming 1000+ zones',brightness:'3000 nit',refresh:'120Hz',sound:'Dolby Atmos 60W 3.2',os:'Google TV',connectivity:'WiFi 6, BT 5.2, 4x HDMI 2.1'}),
p('tv','Sony','Sony Bravia X80L LED 55 inch 4K',19990000,24990000,20,10,4.4,IMG.sony_bravia,'Sony Bravia X80L LED 4K với X1 4K HDR Processor, Dolby Atmos và Google TV thông minh nhiều ứng dụng.',{screen:'55" LED 4K 3840x2160',panel:'Direct Lit VA',brightness:'400 nit',refresh:'60Hz',sound:'Dolby Atmos 20W 2.0',os:'Google TV',connectivity:'WiFi 5, BT 5.0, 3x HDMI 2.0'}),
p('tv','Xiaomi','Xiaomi TV S Pro QLED 65 inch 4K',21990000,26990000,19,8,4.5,IMG.xiaomi_tv,'Xiaomi TV S Pro QLED 1200 nit màu sắc rực rỡ, chip Mediatek tốc độ cao và Google TV. Giá tốt nhất QLED.',{screen:'65" QLED 4K 3840x2160',panel:'QLED',brightness:'1200 nit',refresh:'120Hz',sound:'Dolby Atmos 30W 2.1',os:'Google TV',connectivity:'WiFi 6, BT 5.2, 3x HDMI 2.1'}),
p('tv','Xiaomi','Xiaomi TV A2 55 inch 4K',10990000,13990000,21,15,4.2,IMG.xiaomi_tv,'Xiaomi TV A2 55 inch 4K HDR10+ và MEMC bù chuyển động mượt. MIUI TV tích hợp nhiều ứng dụng giải trí.',{screen:'55" LED 4K 3840x2160',panel:'Direct Lit',brightness:'350 nit',refresh:'60Hz MEMC',sound:'20W 2.0',os:'MIUI TV Android',connectivity:'WiFi 5, BT 5.0, 3x HDMI 2.0'}),
p('tv','Xiaomi','Xiaomi TV A 43 inch 4K 2024',6990000,8990000,22,25,4.1,IMG.xiaomi_tv,'Xiaomi TV A 43 inch mới nhất Google TV thông minh, màn hình 4K và nhiều app giải trí. Hoàn hảo phòng ngủ.',{screen:'43" LED 4K 3840x2160',panel:'Direct Lit',brightness:'300 nit',refresh:'60Hz',sound:'20W 2.0',os:'Google TV',connectivity:'WiFi 5, BT 5.0, 3x HDMI 2.0'}),
p('tv','TCL','TCL QD-Mini LED 65 inch C855 4K',29990000,36990000,19,6,4.6,IMG.tcl_tv,'TCL QD-Mini LED C855 hơn 5000 zones, màu QD-OLED và độ sáng 2000 nit. Hiệu năng vượt trội ở mức giá phổ thông.',{screen:'65" QD-Mini LED 4K 3840x2160',panel:'QD Mini LED 5000+ zones',brightness:'2000 nit',refresh:'144Hz VRR',sound:'Dolby Atmos 50W 2.1',os:'Google TV',connectivity:'WiFi 6, BT 5.0, 4x HDMI 2.1'}),
p('tv','TCL','TCL QLED 55 inch C745 4K',14990000,18990000,21,12,4.4,IMG.tcl_tv,'TCL QLED C745 AiPQ Pro, Dolby Vision IQ và tần số quét 144Hz gaming. Google TV và Google Assistant tiện lợi.',{screen:'55" QLED 4K 3840x2160',panel:'QLED',brightness:'800 nit',refresh:'144Hz',sound:'Dolby Atmos 30W 2.1',os:'Google TV',connectivity:'WiFi 5, BT 5.0, 3x HDMI 2.1'}),
p('tv','TCL','TCL UHD 4K 43 inch P635 2024',6490000,8490000,24,25,4.0,IMG.tcl_tv,'TCL 43 inch Google TV thông minh, 4K HDR Pro và giá siêu rẻ. Hoàn hảo phòng ngủ hay phòng nhỏ.',{screen:'43" LED 4K 3840x2160',panel:'Direct Lit',brightness:'250 nit',refresh:'60Hz',sound:'16W 2.0',os:'Google TV',connectivity:'WiFi 5, BT 5.0, 3x HDMI 2.0'}),
p('tv','Hisense','Hisense ULED Mini LED 65 inch U8N 4K',22990000,28990000,21,7,4.5,IMG.samsung_tv,'Hisense ULED Mini LED U8N 1500+ zones, độ sáng 3000 nit và Google TV. Hiệu năng vượt trội giá phổ thông.',{screen:'65" Mini LED 4K 3840x2160',panel:'ULED Mini LED 1500+ zones',brightness:'3000 nit',refresh:'144Hz VRR',sound:'Dolby Atmos 60W 2.1',os:'Google TV',connectivity:'WiFi 6, BT 5.0, 4x HDMI 2.1'}),
p('tv','Hisense','Hisense 55 inch A6N 4K Smart TV',7990000,10490000,24,20,4.0,IMG.lg_nanocell,'Hisense A6N 55 inch 4K Dolby Vision HDR10+ và VIDAA U7 Smart TV. DTS Virtual X mô phỏng âm thanh vòm.',{screen:'55" LED 4K 3840x2160',panel:'Direct Lit',brightness:'300 nit',refresh:'60Hz',sound:'DTS Virtual X 20W 2.0',os:'VIDAA U7',connectivity:'WiFi 5, BT 5.0, 3x HDMI 2.0'}),
p('tv','Panasonic','Panasonic MZ2000 OLED 65 inch 4K',72990000,84990000,13,3,4.8,IMG.lg_oled,'Panasonic MZ2000 OLED Master OLED Pro chuẩn Hollywood, chip HCX Pro AI MK2 và âm thanh 140W 7.1.2 rạp phim.',{screen:'65" OLED 4K 3840x2160',panel:'Master OLED Pro',brightness:'OLED',refresh:'120Hz',sound:'Dolby Atmos 140W 7.1.2',os:'My Home Screen 8.0',connectivity:'WiFi 6, BT 5.2, 4x HDMI 2.1'}),
p('tv','Philips','Philips OLED+ 907 65 inch 4K',79990000,91990000,13,2,4.8,IMG.sony_bravia,'Philips OLED+ 907 OLED EX Matte 3300 nit, âm thanh Bowers & Wilkins 100W 3.1.2 và Ambilight 4 mặt chiếu tường phòng khách.',{screen:'65" OLED EX 4K Matte',panel:'OLED EX Matte',brightness:'3300 nit',refresh:'120Hz VRR',sound:'Bowers & Wilkins 100W 3.1.2',os:'Titan OS',connectivity:'WiFi 6, BT 5.2, 4x HDMI 2.1'}),
p('tv','Philips','Philips QLED 8100 55 inch 4K Ambilight',18990000,22990000,17,8,4.5,IMG.samsung_qled,'Philips QLED 8100 Ambilight 3 mặt chiếu sáng phòng theo màu màn hình, QLED rực rỡ và Google TV thông minh.',{screen:'55" QLED 4K 3840x2160',panel:'QLED',brightness:'800 nit',refresh:'60Hz',sound:'Dolby Atmos 30W 2.0',os:'Google TV',connectivity:'WiFi 5, BT 5.0, 3x HDMI 2.0'}),

// ============================
// TAI NGHE
// ============================
p('earphone','Apple','Apple AirPods Pro Gen 2 USB-C',5690000,6490000,12,30,4.8,IMG.airpods_pro,'AirPods Pro Gen 2 USB-C chip H2, ANC mạnh gấp 2 và Adaptive Audio thông minh. Hộp sạc tích hợp loa tìm kiếm.',{battery:'6 giờ + 30 giờ hộp',anc:'ANC H2 Adaptive Audio',connection:'Bluetooth 5.3 H2',waterproof:'IP54 cả tai nghe và hộp',sound:'Âm thanh không gian cá nhân hóa'}),
p('earphone','Apple','Apple AirPods Max Midnight',12990000,14490000,10,10,4.7,IMG.airpods_max,'AirPods Max headphone chụp tai cao cấp nhôm sang trọng, ANC cực mạnh và Spatial Audio 3D điện ảnh tuyệt vời.',{battery:'20 giờ ANC bật',anc:'ANC mạnh nhất Apple',connection:'Bluetooth 5.0 H1',waterproof:'IPX4',sound:'Âm thanh không gian 3D Dolby Atmos'}),
p('earphone','Apple','Apple AirPods Gen 4 ANC',4490000,4990000,10,25,4.6,IMG.airpods_gen3,'AirPods Gen 4 ANC lần đầu xuất hiện ở AirPods tiêu chuẩn cùng thiết kế ergonomic thoải mái và Spatial Audio.',{battery:'5 giờ + 30 giờ hộp',anc:'Active Noise Cancellation H2',connection:'Bluetooth 5.3 H2',waterproof:'IP54',sound:'Spatial Audio'}),
p('earphone','Apple','Apple AirPods Gen 4 không ANC',3490000,3990000,13,35,4.5,IMG.airpods_gen3,'AirPods Gen 4 cơ bản thiết kế mới thoải mái, kết nối H2 mượt và chất âm trong sáng phù hợp người dùng iPhone.',{battery:'5 giờ + 30 giờ hộp',anc:'Không',connection:'Bluetooth 5.3 H2',waterproof:'IP54',sound:'Spatial Audio'}),
p('earphone','Sony','Sony WF-1000XM5 Earbuds',5990000,7490000,20,15,4.8,IMG.sony_wf,'Sony WF-1000XM5 chống ồn tốt nhất thế giới với chip V2+QN2e, LDAC 990kbps Hi-Res và 8 giờ pin.',{battery:'8 giờ + 24 giờ hộp',anc:'ANC V2+QN2e',connection:'Bluetooth 5.3 LE Audio LDAC',waterproof:'IPX4',sound:'Hi-Res Audio Wireless LDAC 990kbps'}),
p('earphone','Sony','Sony WH-1000XM5 Headphones Black',7490000,9490000,21,12,4.9,IMG.sony_wh,'Sony WH-1000XM5 tai nghe chụp tai chống ồn số 1 thế giới. 8 mic, chip V1+QN2 và Auto NC Optimizer tự điều chỉnh.',{battery:'30 giờ ANC bật / 40 giờ ANC tắt',anc:'ANC 8 mic 2 chip',connection:'Bluetooth 5.2 LDAC aptX',waterproof:'Không',sound:'Hi-Res Audio LDAC 990kbps'}),
p('earphone','Sony','Sony WH-CH720N Bluetooth Headphones White',2990000,3990000,25,20,4.5,IMG.sony_wh,'Sony WH-CH720N siêu nhẹ 192g với ANC tốt và pin 35 giờ. Multipoint kết nối 2 thiết bị đồng thời.',{battery:'35 giờ ANC bật',anc:'Active Noise Cancellation',connection:'Bluetooth 5.2',waterproof:'Không',sound:'Clear Bass Booster'}),
p('earphone','Sony','Sony LinkBuds S White',3490000,4490000,22,18,4.4,IMG.sony_wf,'Sony LinkBuds S siêu nhỏ nhẹ với LDAC Hi-Res, ANC tốt và Ambient Sound tự nhiên nhất. Fit ear thoải mái cả ngày.',{battery:'6 giờ + 20 giờ hộp',anc:'Active Noise Cancellation',connection:'Bluetooth 5.2 LDAC',waterproof:'IPX4',sound:'Hi-Res Audio Wireless LDAC'}),
p('earphone','Samsung','Samsung Galaxy Buds3 Pro White',4490000,5490000,18,20,4.6,IMG.samsung_buds,'Galaxy Buds3 Pro ANC mạnh nhất trong dòng Buds, thiết kế cánh mới và âm thanh Hi-Fi 360 Audio với Dolby Head Tracking.',{battery:'6 giờ + 30 giờ hộp',anc:'ANC AI',connection:'Bluetooth 5.4 LE Audio',waterproof:'IPX7',sound:'Hi-Fi 360 Audio Dolby Head Tracking'}),
p('earphone','Samsung','Samsung Galaxy Buds3 White',2990000,3990000,25,25,4.4,IMG.samsung_buds,'Galaxy Buds3 ANC cải tiến, thiết kế Open-type thoáng tai và Interpreter Mode dịch trực tiếp nhờ Galaxy AI.',{battery:'7 giờ + 30 giờ hộp',anc:'Active Noise Cancellation',connection:'Bluetooth 5.4 LE Audio',waterproof:'IPX5',sound:'Stereo + Bass Boost'}),
p('earphone','JBL','JBL Tour Pro 3 True Wireless ANC',4990000,6490000,23,15,4.6,IMG.jbl_earbuds,'JBL Tour Pro 3 màn hình cảm ứng Smart Charging Case độc đáo, ANC mạnh và âm thanh JBL Signature Bass.',{battery:'10 giờ + 40 giờ hộp',anc:'Active Noise Cancellation',connection:'Bluetooth 5.3 LE Audio LDAC',waterproof:'IPX5',sound:'JBL Signature Sound LDAC'}),
p('earphone','JBL','JBL Tune Beam 2 True Wireless',2190000,2990000,27,30,4.3,IMG.jbl_earbuds,'JBL Tune Beam 2 ANC tốt nhất tầm giá, pin 10 giờ và JBL Deep Bass signature đặc trưng.',{battery:'10 giờ + 40 giờ hộp',anc:'Active Noise Cancellation',connection:'Bluetooth 5.3',waterproof:'IPX4',sound:'JBL Deep Bass'}),
p('earphone','JBL','JBL Live 670NC Over-Ear Headphones Blue',2490000,3290000,24,20,4.4,IMG.jbl_headphones,'JBL Live 670NC tai nghe chụp tai ANC, Multipoint 2 thiết bị và pin 50 giờ. JBL Signature Sound mạnh mẽ.',{battery:'50 giờ không ANC / 40 giờ ANC',anc:'Active Noise Cancellation',connection:'Bluetooth 5.3',waterproof:'Không',sound:'JBL Signature Sound'}),
p('earphone','Bose','Bose QuietComfort Ultra Earbuds Black',6990000,8490000,18,8,4.8,IMG.bose_earbuds,'Bose QC Ultra Earbuds với Immersive Audio 3D không gian, ANC tốt nhất và Aware Mode âm thanh xung quanh tự nhiên.',{battery:'6 giờ + 24 giờ hộp',anc:'ANC Custom Mode',connection:'Bluetooth 5.3 aptX Adaptive',waterproof:'IPX4',sound:'Bose Immersive Audio 3D'}),
p('earphone','Bose','Bose QuietComfort 45 Headphones White Smoke',6490000,7990000,19,10,4.8,IMG.bose_qc,'Bose QC45 ANC hàng đầu và chất âm Bose chuẩn mực. Thiết kế gấp gọn và pin 24 giờ đủ dùng cả ngày.',{battery:'24 giờ ANC bật',anc:'Active Noise Cancellation',connection:'Bluetooth 5.1 aptX',waterproof:'Không',sound:'TriPort Acoustic Architecture'}),
p('earphone','Sennheiser','Sennheiser Momentum 4 Wireless Black',8490000,10490000,19,8,4.8,IMG.sennheiser,'Sennheiser Momentum 4 pin 60 giờ kỷ lục, ANC hiệu quả và chất âm audiophile ấm mượt tự nhiên.',{battery:'60 giờ không ANC / 40 giờ ANC',anc:'Active Noise Cancellation',connection:'Bluetooth 5.2 aptX Lossless',waterproof:'Không',sound:'Sennheiser Audiophile Sound'}),
p('earphone','Sennheiser','Sennheiser Momentum True Wireless 4 Black',6990000,8490000,18,10,4.7,IMG.sennheiser,'Sennheiser Momentum TW4 earbuds Adaptive ANC, LDAC Lossless và âm thanh audiophile chân thực nhất true wireless.',{battery:'7.5 giờ + 30 giờ hộp',anc:'Adaptive Active Noise Cancellation',connection:'Bluetooth 5.3 LDAC Lossless',waterproof:'IPX4',sound:'Sennheiser Audiophile LDAC'}),
p('earphone','Jabra','Jabra Elite 10 True Wireless',5490000,6990000,21,10,4.7,IMG.jabra,'Jabra Elite 10 Dolby Head Tracking chuyên nghiệp, ANC mạnh và thiết kế semi-open thoải mái nhất thị trường.',{battery:'6 giờ + 27 giờ hộp',anc:'Advanced Active Noise Cancellation',connection:'Bluetooth 5.3 Multipoint',waterproof:'IP57',sound:'Dolby Surround Sound Head Tracking'}),
p('earphone','Marshall','Marshall Motif II ANC Earbuds',4490000,5490000,18,15,4.5,IMG.marshall,'Marshall Motif II ANC phong cách rock n roll cổ điển, ANC mạnh và âm thanh mộc mạc. Pin 30 giờ cực trâu.',{battery:'6 giờ + 30 giờ hộp',anc:'Active Noise Cancellation',connection:'Bluetooth 5.3 LE Audio',waterproof:'IPX5',sound:'Marshall Rock Sound'}),
p('earphone','Marshall','Marshall Headphones Major IV Black',2990000,3990000,25,18,4.6,IMG.marshall,'Marshall Major IV pin 80 giờ kỷ lục nhất lớp, on-ear nhẹ nhàng và chất âm rock mạnh mẽ đặc trưng Marshall.',{battery:'80 giờ',anc:'Không',connection:'Bluetooth 5.2',waterproof:'Không',sound:'Marshall Rock Sound'}),
p('earphone','Beats','Beats Studio Pro Wireless Navy',7490000,8990000,17,8,4.6,IMG.beats_studio,'Beats Studio Pro chip H1 mới, ANC mạnh và lần đầu hỗ trợ LDAC Lossless Android. Pin 40 giờ và USB-C tiện lợi.',{battery:'40 giờ không ANC / 24 giờ ANC',anc:'Custom Acoustic Platform ANC',connection:'Bluetooth 5.3 H1 + LDAC Android',waterproof:'Không',sound:'Hi-Res Custom Acoustic Platform'}),
p('earphone','Beats','Beats Fit Pro True Wireless Tidal Blue',4490000,5490000,18,12,4.5,IMG.beats_earbuds,'Beats Fit Pro cánh earwing giữ chắc khi vận động mạnh, ANC hiệu quả và chip H1 kết nối iPhone siêu nhanh.',{battery:'6 giờ + 27 giờ hộp',anc:'Active Noise Cancellation H1',connection:'Bluetooth 5.0 H1',waterproof:'IPX4',sound:'Spatial Audio Head Tracking'}),
p('earphone','Anker','Anker Soundcore Liberty 4 NC Earbuds',1490000,1990000,25,30,4.3,IMG.anker_earbuds,'Anker Liberty 4 NC ANC tốt nhất tầm giá, LDAC Hi-Res và pin 10 giờ. Rẻ nhất có ANC và LDAC Lossless.',{battery:'10 giờ + 40 giờ hộp',anc:'Active Noise Cancellation',connection:'Bluetooth 5.3 LDAC',waterproof:'IPX4',sound:'LDAC Hi-Res Audio'}),
p('earphone','Anker','Anker Soundcore Q45 Headphones',890000,1290000,31,40,4.2,IMG.anker_earbuds,'Anker Q45 Hybrid ANC giá siêu rẻ, Multipoint 2 thiết bị và pin 50 giờ. Tai nghe ANC rẻ nhất thị trường.',{battery:'50 giờ không ANC / 40 giờ ANC',anc:'Hybrid Active Noise Cancellation',connection:'Bluetooth 5.3',waterproof:'Không',sound:'Custom EQ app Soundcore'}),

// ============================
// ĐỒNG HỒ
// ============================
p('smartwatch','Apple','Apple Watch Ultra 2 Titanium 49mm',21490000,23990000,10,10,4.9,IMG.apple_watch_ultra,'Apple Watch Ultra 2 Titanium grade 23, màn hình 3000 nit siêu sáng và pin 36 giờ. GPS tần số kép và chuẩn lặn WR100m.',{battery:'36 giờ (72 giờ Pin Ultra)',display:'Retina LTPO OLED 1.92" 3000 nit Always-On',waterproof:'WR100m EN13319 lặn',gps:'GPS/GNSS tần số kép L1+L5',compatible:'Chỉ iPhone',sensors:'ECG SpO2 Nhiệt độ Accelerometer'}),
p('smartwatch','Apple','Apple Watch Series 9 GPS 45mm Midnight',11490000,12990000,12,18,4.7,IMG.apple_watch_s9,'Apple Watch Series 9 chip S9 SiP, Double Tap chạm 2 ngón không cần chạm màn hình và đo nhiệt độ cơ thể.',{battery:'18 giờ',display:'Retina LTPO OLED 1.9" 2000 nit Always-On',waterproof:'WR50m',gps:'GPS GLONASS BeiDou',compatible:'iPhone XS trở lên',sensors:'ECG SpO2 Nhiệt độ'}),
p('smartwatch','Apple','Apple Watch Series 9 GPS 41mm Pink',10990000,12490000,12,15,4.6,IMG.apple_watch_s9,'Apple Watch Series 9 41mm nhỏ gọn phù hợp cổ tay nhỏ, chip S9 mới nhất và màn hình 2000 nit sáng rực rỡ.',{battery:'18 giờ',display:'Retina LTPO OLED 1.69" 2000 nit Always-On',waterproof:'WR50m',gps:'GPS GLONASS',compatible:'iPhone XS trở lên',sensors:'ECG SpO2 Nhiệt độ'}),
p('smartwatch','Apple','Apple Watch SE Gen 2 GPS 44mm Silver',6490000,7490000,13,22,4.5,IMG.apple_watch_se,'Apple Watch SE Gen 2 chip S8 mạnh và Crash Detection cứu sinh. Apple Watch rẻ nhất có đủ tính năng sức khỏe thực sự.',{battery:'18 giờ',display:'Retina LTPO OLED 1.78"',waterproof:'WR50m',gps:'GPS GLONASS',compatible:'iPhone XS trở lên',sensors:'SpO2 Accelerometer Gyro'}),
p('smartwatch','Samsung','Samsung Galaxy Watch Ultra LTE 47mm Titanium White',16990000,19990000,15,8,4.7,IMG.samsung_watch,'Galaxy Watch Ultra Titanium grade 4, Sapphire Crystal 600 nit và pin 60 giờ. Chuẩn quân đội MIL-STD-810H và WR100m.',{battery:'48 giờ (GPS liên tục 100 giờ)',display:'Super AMOLED 1.5" Sapphire Crystal 600 nit',waterproof:'10ATM WR100m',gps:'GPS GNSS',compatible:'Android 11.0+',sensors:'BioActive ECG SpO2 Nhiệt độ'}),
p('smartwatch','Samsung','Samsung Galaxy Watch7 LTE 44mm Green',8990000,10990000,18,15,4.6,IMG.samsung_watch,'Galaxy Watch7 chip 3nm mới nhất, AI Health Coach thông minh và BioActive thế hệ 3 đo thành phần cơ thể.',{battery:'40 giờ',display:'Super AMOLED 1.5" 2000 nit',waterproof:'5ATM IP68',gps:'GPS GNSS',compatible:'Android 11.0+',sensors:'BioActive ECG SpO2 Nhiệt độ Body Composition'}),
p('smartwatch','Samsung','Samsung Galaxy Watch6 Classic LTE 47mm Black',7490000,9990000,25,12,4.5,IMG.samsung_watch,'Galaxy Watch6 Classic với bezel quay cơ học độc đáo điều hướng, thiết kế stainless steel sang trọng và đủ tính năng sức khỏe.',{battery:'44 giờ',display:'Super AMOLED 1.5" 2000 nit',waterproof:'5ATM IP68',gps:'GPS GNSS',compatible:'Android 11.0+',sensors:'ECG SpO2 Nhiệt độ'}),
p('smartwatch','Garmin','Garmin Fenix 7X Pro Solar Sapphire Carbon Grey',26490000,29990000,12,4,4.9,IMG.garmin_fenix,'Garmin Fenix 7X Pro Solar đỉnh nhất dòng Fenix với kính sạc mặt trời Power Glass, đèn pin LED và bản đồ TOPO toàn cầu.',{battery:'37 ngày (89 ngày chỉ theo dõi)',display:'MIP chống chói 1.4" 260x260',waterproof:'10ATM',gps:'GPS/GLONASS/Galileo/BeiDou tần số đôi',compatible:'iOS + Android',sensors:'Pulse Ox SpO2 Nhiệt độ Compass Barometer'}),
p('smartwatch','Garmin','Garmin Forerunner 965 Music Carbon Aqua',16490000,18990000,13,6,4.8,IMG.garmin_forerunner,'Garmin Forerunner 965 runner chuyên sâu màn hình AMOLED, Training Readiness và 2000 bài nhạc offline.',{battery:'23 ngày (31 giờ GPS)',display:'AMOLED 1.4" 454x454',waterproof:'5ATM',gps:'GPS/GLONASS/BeiDou tần số đôi',compatible:'iOS + Android',sensors:'Pulse Ox VO2 Max Lactate Threshold'}),
p('smartwatch','Garmin','Garmin Venu 3S Ivory',9490000,10990000,14,10,4.6,IMG.garmin_forerunner,'Garmin Venu 3S nhỏ gọn AMOLED đẹp, Sleep Coach AI theo dõi giấc ngủ chuyên sâu và Nap Detection.',{battery:'10 ngày',display:'AMOLED 1.2" 390x390',waterproof:'5ATM',gps:'GPS GLONASS',compatible:'iOS + Android',sensors:'Pulse Ox Body Battery Stress'}),
p('smartwatch','Garmin','Garmin Instinct 2X Solar Tactical',11990000,13990000,14,5,4.7,IMG.garmin_fenix,'Garmin Instinct 2X Solar pin vô hạn nhờ sạc mặt trời, khung fiber chuẩn quân đội MIL-STD-810 và GPS tần số kép.',{battery:'Vô hạn đủ ánh sáng mặt trời',display:'MIP chống chói 1.1"',waterproof:'10ATM',gps:'GPS/GNSS tần số kép',compatible:'iOS + Android',sensors:'Pulse Ox ABC Altimeter Barometer Compass'}),
p('smartwatch','Huawei','Huawei Watch GT 4 46mm Brown Leather',4990000,6490000,23,20,4.5,IMG.huawei_watch,'Huawei Watch GT 4 thiết kế bát giác cổ điển sang trọng, pin 14 ngày và theo dõi sức khỏe TruSeen 5.5 chính xác.',{battery:'14 ngày',display:'AMOLED 1.43" 466x466',waterproof:'5ATM IP68',gps:'GPS/GLONASS/BeiDou/Galileo',compatible:'Android 8.0+ iOS 13.0+',sensors:'SpO2 ECG Nhiệt độ Stress'}),
p('smartwatch','Huawei','Huawei Watch GT 4 41mm White',3990000,5490000,27,25,4.4,IMG.huawei_watch,'Huawei Watch GT 4 41mm nhỏ nhắn dành cho nữ, thiết kế tròn sang trọng và pin 7 ngày.',{battery:'7 ngày',display:'AMOLED 1.32" 466x466',waterproof:'5ATM',gps:'GPS/GLONASS/BeiDou',compatible:'Android 8.0+ iOS 13.0+',sensors:'SpO2 ECG Nhiệt độ'}),
p('smartwatch','Xiaomi','Xiaomi Watch S3 Black',3490000,4490000,22,25,4.4,IMG.xiaomi_watch,'Xiaomi Watch S3 màn hình AMOLED 1.43 inch 60Hz, pin 15 ngày và thiết kế nhôm sang trọng ở tầm giá phổ thông.',{battery:'15 ngày',display:'AMOLED 1.43" 466x466',waterproof:'5ATM',gps:'GPS/GLONASS/BeiDou',compatible:'Android 6.0+ iOS 12.0+',sensors:'SpO2 Stress Nhiệt độ'}),
p('smartwatch','Xiaomi','Xiaomi Redmi Watch 4 Silver',1990000,2490000,20,40,4.2,IMG.xiaomi_watch,'Xiaomi Redmi Watch 4 AMOLED 1.97 inch lớn nhất tầm giá, pin 20 ngày và khung hợp kim nhôm sang trọng giá siêu rẻ.',{battery:'20 ngày',display:'AMOLED 1.97" 390x450',waterproof:'5ATM',gps:'GPS GLONASS',compatible:'Android 6.0+ iOS 12.0+',sensors:'SpO2 Stress'}),
p('smartwatch','Amazfit','Amazfit Balance Sunset Orange',4490000,5490000,18,15,4.5,IMG.amazfit,'Amazfit Balance AI Personal Trainer thông minh, Zepp Coach cá nhân hóa bài tập và màn hình AMOLED 1.5 inch sắc nét.',{battery:'14 ngày',display:'AMOLED 1.5" 480x480',waterproof:'5ATM',gps:'GPS/GLONASS/BeiDou/QZSS',compatible:'Android 7.0+ iOS 14.0+',sensors:'BioTracker 5.0 PPG SpO2 Nhiệt độ'}),
p('smartwatch','Amazfit','Amazfit GTS 4 Autumn Brown',2990000,3990000,25,20,4.3,IMG.amazfit,'Amazfit GTS 4 thiết kế vuông thời trang AMOLED 1.75 inch, GPS 6 hệ thống và pin 8 ngày.',{battery:'8 ngày',display:'AMOLED 1.75" 390x450',waterproof:'5ATM',gps:'GPS/GLONASS/BeiDou/Galileo/QZSS/NavIC',compatible:'Android 6.0+ iOS 14.0+',sensors:'BioTracker PPG SpO2 Nhiệt độ'}),

// ============================
// PHỤ KIỆN
// ============================
p('accessory','Anker','Anker Prime GaN 100W 3-Cổng (2C1A)',1290000,1590000,19,50,4.8,IMG.anker_charger,'Anker Prime GaN 100W sạc đồng thời Laptop MacBook, iPhone và tablet. PowerIQ 3.0 phân phối điện thông minh, vỏ nhôm mờ.',{power:'100W tổng (65W+20W+15W)',ports:'2x USB-C + 1x USB-A',technology:'GaN II PowerIQ 3.0',compatible:'Laptop iPhone Android iPad Switch',size:'58x58x32mm'}),
p('accessory','Anker','Anker 737 GaN 120W 2 USB-C',1590000,1990000,20,40,4.7,IMG.anker_charger,'Anker 737 GaN 120W siêu nhỏ sạc 2 laptop. Cổng 1 đạt 100W sạc MacBook Pro 16 inch, cổng 2 đạt 45W.',{power:'120W tổng (100W+20W)',ports:'2x USB-C',technology:'GaN II Ultra PowerIQ',compatible:'MacBook Pro Dell XPS Laptop USB-C PD',size:'64x64x35mm'}),
p('accessory','Anker','Anker Nano 30W USB-C Sạc Nhanh',290000,390000,26,80,4.6,IMG.anker_charger,'Anker Nano 30W siêu nhỏ siêu nhẹ 40g, sạc nhanh iPhone 15 đầy 50% trong 30 phút. GaN tản nhiệt mát bền bỉ.',{power:'30W',ports:'1x USB-C',technology:'GaN PowerIQ 3.0',compatible:'iPhone 15/14/13 iPad Android',size:'40x40x24mm'}),
p('accessory','Apple','Apple MagSafe Charger 1m USB-C',990000,990000,0,30,4.6,IMG.magsafe,'Sạc MagSafe chính hãng Apple tự căn chỉnh nam châm, sạc nhanh 15W cho iPhone 12 trở lên và 5W cho AirPods.',{power:'15W với củ 20W+',connection:'MagSafe + Qi2',compatible:'iPhone 12/13/14/15 + AirPods MagSafe',cable_length:'1 mét'}),
p('accessory','Apple','Apple 20W USB-C Power Adapter',490000,490000,0,40,4.5,IMG.anker_charger,'Củ sạc USB-C 20W chính hãng Apple nhỏ gọn sạc nhanh iPhone, iPad và MacBook nhỏ.',{power:'20W USB-C Power Delivery',ports:'1x USB-C',compatible:'iPhone 15/14/13 iPad MacBook Air',size:'Nhỏ gọn'}),
p('accessory','Apple','Apple Pencil Pro',3490000,3990000,13,15,4.8,IMG.apple_pencil,'Apple Pencil Pro bóp ngón tay Squeeze mở palette, xoay thân bút đổi nét cọ và phản hồi rung xúc giác chân thực cho vẽ trên iPad.',{type:'Bút stylus cảm ứng lực',compatible:'iPad Pro M4 và iPad Air M2 2024',color:'Trắng',feature:'Squeeze Barrel Roll Haptic Feedback'}),
p('accessory','Logitech','Logitech MX Master 3S Wireless Mouse Graphite',2490000,2990000,17,20,4.9,IMG.logitech_mouse,'Logitech MX Master 3S cuộn từ tính MagSpeed 1000 dòng/giây, cảm biến 8000 DPI trên mọi bề mặt và nút Silent 90% êm hơn.',{connection:'Bluetooth + Logi Bolt USB',dpi:'200-8000 DPI',battery:'Pin 70 ngày sạc USB-C',buttons:'7 nút tùy chỉnh',compatible:'Windows macOS iPadOS Linux ChromeOS'}),
p('accessory','Logitech','Logitech MX Keys S Wireless Keyboard Pale Grey',2490000,2990000,17,18,4.8,IMG.logitech_keyboard,'Logitech MX Keys S phím lõm ôm đầu ngón tay, đèn nền tự động sáng khi tay gần và Smart Actions tự động hóa.',{connection:'Bluetooth + Logi Bolt USB',battery:'10 ngày có đèn / 5 tháng không đèn',backlit:'Đèn nền thông minh tự điều chỉnh',compatible:'Windows macOS iOS Android',layout:'Full-size 107 phím'}),
p('accessory','Logitech','Logitech MX Anywhere 3S Mobile Mouse Rose',1590000,1990000,20,22,4.7,IMG.logitech_mouse,'Logitech MX Anywhere 3S chuột di động MagSpeed cuộn từ tính, cảm biến 8000 DPI trên mọi bề mặt kể cả thủy tinh.',{connection:'Bluetooth + Logi Bolt USB',dpi:'200-8000 DPI',battery:'Pin 70 ngày sạc USB-C',buttons:'6 nút',compatible:'Windows macOS Linux ChromeOS'}),
p('accessory','Logitech','Logitech G Pro X Superlight 2 Gaming Mouse',2990000,3490000,14,15,4.8,IMG.logitech_mouse,'Logitech G Pro X Superlight 2 siêu nhẹ 60g, cảm biến HERO 2 25600 DPI và LIGHTSPEED không dây 1ms cho gamer.',{connection:'LIGHTSPEED Wireless 1ms',dpi:'100-25600 DPI',battery:'95 giờ',weight:'60g siêu nhẹ',compatible:'Windows macOS'}),
p('accessory','Anker','Anker Power Bank 10000mAh 30W Slim',690000,890000,22,60,4.6,IMG.powerbank,'Anker Power Bank 10000mAh mỏng nhẹ nhất dòng với 2 cổng USB-C 30W, sạc iPhone 15 đầy 2.2 lần.',{capacity:'10000mAh',ports:'2x USB-C 30W + 1x USB-A 22.5W',output:'30W max USB-C PD',recharge:'2.5 giờ với củ 45W',weight:'218g'}),
p('accessory','Anker','Anker Power Bank 20000mAh 65W Laptop',1290000,1690000,24,40,4.7,IMG.powerbank,'Anker Power Bank 20000mAh sạc laptop 65W PD, đủ sạc MacBook Air 1 lần đầy. 3 cổng ra cùng lúc.',{capacity:'20000mAh',ports:'2x USB-C 65W/45W + 1x USB-A 22.5W',output:'65W max USB-C',recharge:'3 giờ với củ 65W',weight:'430g'}),
p('accessory','Anker','Anker 240W Nylon USB-C to USB-C 2m',290000,390000,26,80,4.7,IMG.cable_usbc,'Anker 240W USB-C siêu bền nylon, hỗ trợ 240W PD 3.1 cho laptop cao cấp và truyền dữ liệu 10Gbps USB 3.1.',{power:'240W PD 3.1',data:'10Gbps USB 3.1 Gen 2',length:'2 mét',material:'Nylon bện bền bỉ',compatible:'MacBook Dell iPad iPhone 15 Android'}),
p('accessory','Belkin','Belkin BoostCharge Pro MagSafe 3-in-1 Stand',2990000,3490000,14,15,4.6,IMG.wireless_charger,'Belkin 3-in-1 MagSafe 15W iPhone, sạc Apple Watch nhanh và AirPods. Sạc cả 3 thiết bị Apple cùng lúc.',{power:'15W iPhone MagSafe + 5W Watch + 5W AirPods',compatible:'iPhone 12/13/14/15 Apple Watch AirPods',ports:'USB-C Power Delivery 36W',certification:'Made for MagSafe Apple Certified'}),
p('accessory','Anker','Anker 552 USB-C Hub 9-in-1 4K',990000,1290000,23,35,4.7,IMG.hub_usb,'Anker 552 Hub 9-in-1 với 4K HDMI, 85W PD pass-through, SD/MicroSD, 3x USB-A và 2x USB-C mở rộng cổng MacBook.',{ports:'4K HDMI + 85W PD + 2x USB-C + 3x USB-A 5Gbps + SD + MicroSD',video:'4K@60Hz HDMI',power:'85W PD Pass-through',compatible:'MacBook Dell XPS iPad Pro ChromeBook'}),
p('accessory','Ugreen','Ugreen 100W USB-C Hub 7-in-1 HDMI 4K60',690000,890000,22,45,4.6,IMG.hub_usb,'Ugreen 7-in-1 Hub 100W PD, 4K@60Hz HDMI, 3x USB-A 3.0 và SD/MicroSD. Nhỏ gọn mang theo hằng ngày.',{ports:'4K HDMI + 100W PD + 3x USB-A 3.0 + SD + MicroSD',video:'4K@60Hz HDMI',power:'100W PD Pass-through',compatible:'MacBook Laptop USB-C iPad Pro'}),
p('accessory','Spigen','Spigen Tough Armor iPhone 15 Pro Max Gunmetal',490000,590000,17,50,4.7,IMG.case_phone,'Spigen Tough Armor bảo vệ double-layer TPU+Polycarbonate, chuẩn MIL-STD-810G và kickstand tích hợp tiện lợi.',{material:'TPU + Polycarbonate kép',standard:'MIL-STD-810G',compatible:'iPhone 15 Pro Max',weight:'50g',features:'Kickstand Air Cushion 4 góc'}),
p('accessory','Spigen','Spigen Ultra Hybrid Samsung Galaxy S24 Ultra Clear',390000,490000,20,60,4.6,IMG.case_phone,'Spigen Ultra Hybrid trong suốt bảo vệ mặt lưng không che khung. Nhìn thấy màu sắc thật mà vẫn được bảo vệ.',{material:'Bumper TPU + Polycarbonate trong suốt',compatible:'Samsung Galaxy S24 Ultra',yellowing:'Chống vàng ốp',weight:'25g',features:'Airbag 4 góc'}),
p('accessory','Spigen','Spigen GLAS.tR EZ Fit iPhone 15 Pro Max 2-pack',390000,490000,20,60,4.8,IMG.screen_protector,'Spigen GLAS.tR EZ Fit kính cường lực 9H khung dán chính xác EZ Fit. Gói 2 tấm bảo vệ màn hình cực tốt.',{hardness:'9H',material:'Kính cường lực tempered glass',compatible:'iPhone 15 Pro Max',thickness:'0.2mm',installation:'EZ Fit alignment frame'}),
p('accessory','Logitech','Logitech StreamCam Full HD 1080p 60fps',1990000,2490000,20,18,4.6,IMG.webcam,'Logitech StreamCam 1080p 60fps AI auto-focus bám khuôn mặt và USB-C. Chuyên dụng livestream và họp video.',{resolution:'1920x1080 60fps',autofocus:'AI Face Tracking',connection:'USB-C',fov:'78° góc nhìn rộng',compatible:'Windows macOS'}),
p('accessory','Logitech','Logitech MX Brio 4K Ultra HD Webcam',3990000,4990000,20,10,4.7,IMG.webcam,'Logitech MX Brio 4K AI light correction thích nghi ánh sáng và Show Mode xoay màn hình iPad/tablet chuyên nghiệp.',{resolution:'3840x2160 30fps 1080p 60fps',autofocus:'RightSight AI Auto-Framing',connection:'USB-C',fov:'90° điều chỉnh được',compatible:'Windows macOS ChromeOS'}),
p('accessory','Baseus','Baseus Monitor Light Bar 90W i-wok Pro',890000,1190000,25,25,4.5,IMG.stand_laptop,'Baseus Monitor Light Bar treo màn hình không chói không phản chiếu camera. Điều chỉnh nhiệt độ 2700K-6500K.',{power:'5W LED',colorTemp:'2700K-6500K',brightness:'0-100% không nhấp nháy',mounting:'Kẹp màn hình 0.5-5cm',control:'Núm xoay vô cực + remote'}),
p('accessory','Ugreen','Ugreen Laptop Stand Aluminum 6 Góc',690000,890000,22,35,4.6,IMG.stand_laptop,'Ugreen Laptop Stand nhôm nguyên khối 6 mức điều chỉnh góc 18-44 độ, tản nhiệt tốt. Hỗ trợ laptop 10-16 inch.',{material:'Nhôm nguyên khối',angles:'6 góc 18/22/26/30/38/44 độ',capacity:'Tới 20kg',compatible:'Laptop 10-16 inch',foldable:'Gập gọn mang đi'}),
];

async function seed(productsToSeed, hasDiscount) {
  const BATCH_SIZE = 50;
  let total = 0;
  
  for (let i = 0; i < productsToSeed.length; i += BATCH_SIZE) {
    const batch = productsToSeed.slice(i, i + BATCH_SIZE).map(prod => {
      if (!hasDiscount) {
        const { discount, original_price, ...rest } = prod;
        return rest;
      }
      return prod;
    });
    
    const { data, error } = await supabase.from('products').insert(batch).select('id');
    
    if (error) {
      console.error(`❌ Lỗi batch ${Math.floor(i/BATCH_SIZE)+1}:`, error.message);
      // Thử từng cái
      for (const prod of batch) {
        const insertData = hasDiscount ? prod : (() => { const { discount, original_price, ...r } = prod; return r; })();
        const { error: e2 } = await supabase.from('products').insert(insertData);
        if (e2) {
          console.error(`  ❌ "${prod.name}": ${e2.message}`);
        } else {
          total++;
        }
      }
    } else {
      total += data.length;
      const batchNum = Math.floor(i/BATCH_SIZE)+1;
      const cat = [...new Set(batch.map(p => p.category))].join('/');
      console.log(`✅ Batch ${batchNum}: ${data.length} SP [${cat}] (tổng: ${total}/${productsToSeed.length})`);
    }
  }
  return total;
}

async function main() {
  console.log('🚀 BẮT ĐẦU SEED DATABASE\n');
  
  // Kiểm tra schema
  console.log('🔍 Kiểm tra schema database...');
  const hasDiscount = await detectSchema();
  const hasTv = await detectTvConstraint();
  console.log(`  - Cột discount/original_price: ${hasDiscount ? '✅ Có' : '❌ Chưa có'}`);
  console.log(`  - Hỗ trợ category TV: ${hasTv ? '✅ Có' : '❌ Chưa có'}\n`);
  
  if (!hasDiscount) {
    console.log('⚠️ CẢNH BÁO: Cột discount/original_price chưa tồn tại!');
    console.log('   Sẽ seed KHÔNG bao gồm discount/original_price.');
    console.log('   👉 Hãy chạy alter_v2.sql trong Supabase SQL Editor trước, rồi chạy lại script này.\n');
  }
  
  if (!hasTv) {
    console.log('⚠️ CẢNH BÁO: Constraint products_category_check chưa cho phép category "tv"!');
    console.log('   Sẽ BỎ QUA tất cả sản phẩm TV.');
    console.log('   👉 Hãy chạy alter_v2.sql trong Supabase SQL Editor trước, rồi chạy lại script này.\n');
  }
  
  const productsToSeed = hasTv 
    ? ALL_PRODUCTS 
    : ALL_PRODUCTS.filter(p => p.category !== 'tv');
  
  const categoryCounts = productsToSeed.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1; return acc;
  }, {});
  console.log(`📊 Phân bổ: ${JSON.stringify(categoryCounts)}`);
  console.log(`📦 Tổng sản phẩm sẽ seed: ${productsToSeed.length}\n`);
  
  // Xóa sản phẩm cũ
  await clearProducts();
  
  // Seed
  const inserted = await seed(productsToSeed, hasDiscount);
  
  // Verify
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
  
  console.log('\n🎉 SEED HOÀN TẤT!');
  console.log(`✅ Đã insert: ${inserted} sản phẩm`);
  console.log(`📊 Số lượng trong DB: ${count} sản phẩm`);
  
  if (!hasDiscount) {
    console.log('\n📋 BƯỚC TIẾP THEO:');
    console.log('1. Mở Supabase Dashboard → SQL Editor');
    console.log('2. Chạy file alter_v2.sql');
    console.log('3. Chạy lại: node scripts/run-seed.mjs');
    console.log('4. Lần này sẽ có đầy đủ discount, original_price và category TV!');
  }
}

main().catch(console.error);
