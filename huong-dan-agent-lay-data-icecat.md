# HƯỚNG DẪN: Lấy dữ liệu sản phẩm từ Icecat và nạp vào Supabase

## Mục tiêu
Lấy ~150–200 sản phẩm điện tử thật (thông số, mô tả, ảnh) từ Icecat Open Catalog, thuộc 5 nhóm: **điện thoại, laptop, đồng hồ thông minh, tai nghe, phụ kiện công nghệ**, sau đó chuẩn hóa và nạp vào bảng `products` trên Supabase.

> ⚠️ **Không commit file `.env`/mật khẩu lên Git public.** Thêm `.env` vào `.gitignore` trước khi làm bất cứ điều gì khác.

---

## 1. Thông tin xác thực

Tạo file `.env` ở thư mục gốc project (KHÔNG hardcode trực tiếp trong code):

```
ICECAT_USERNAME=khaioccho
ICECAT_PASSWORD=Njnjakhai01
SUPABASE_URL=<điền URL project Supabase>
SUPABASE_KEY=<điền service_role key, không dùng anon key vì cần quyền insert>
```

Icecat dùng **HTTP Basic Auth** với 2 giá trị `ICECAT_USERNAME` / `ICECAT_PASSWORD` ở trên cho mọi request.

---

## 2. Cài đặt môi trường

```bash
pip install IceCat supabase python-dotenv sentence-transformers
```

- `IceCat` — package Python chính thức để gọi Icecat (tải category index + chi tiết sản phẩm).
- `supabase` — client Python để insert dữ liệu.
- `sentence-transformers` — tạo embedding cho cột `embedding` (pgvector), dùng model `multilingual-e5-large` hoặc `BGE-M3`.

---

## 3. ⚠️ Lưu ý bắt buộc đọc trước khi code

**Icecat KHÔNG cung cấp giá và tồn kho** (đây là nền tảng nội dung sản phẩm — specs/ảnh/mô tả — không phải marketplace bán hàng). Sau khi lấy xong dữ liệu từ Icecat, cần thêm **1 bước riêng** để gán `price` và `stock` cho từng sản phẩm (dùng LLM ước lượng theo phân khúc/thương hiệu, hoặc nhập tay theo khung giá thị trường thật). Không được để trống hoặc bịa ngẫu nhiên vô căn cứ.

---

## 4. Các bước thực hiện (viết thành script Python, chia theo file/hàm riêng)

### Bước 1 — Lấy category index (danh sách sản phẩm theo từng nhóm)

```python
from IceCat import IceCat
import os
from dotenv import load_dotenv

load_dotenv()
auth = (os.getenv("ICECAT_USERNAME"), os.getenv("ICECAT_PASSWORD"))

catalog = IceCat.IceCatCatalog(data_dir="./icecat_data", auth=auth)
categories = IceCat.IceCatCategoryMapping(data_dir="./icecat_data")
```

Tra trong `categories` để tìm đúng category ID cho 5 nhóm sau (tên category trong Icecat có thể lệch chút so với tên tiếng Việt, cần khớp gần đúng nghĩa):

| Nhóm trong đồ án | Tên category cần tìm trong Icecat |
|---|---|
| Điện thoại | Mobile Phones / Smartphones |
| Laptop | Notebooks / Laptops |
| Đồng hồ thông minh | Smartwatches / Wearables |
| Tai nghe | Headphones / Earphones |
| Phụ kiện công nghệ | Computer Accessories / Mobile Accessories |

Từ mỗi category, lấy ngẫu nhiên/lấy theo thứ tự **30–40 sản phẩm** (tổng 5 nhóm ≈ 150–200 sản phẩm).

### Bước 2 — Lấy chi tiết từng sản phẩm

```python
catalog.add_product_details_parallel(
    keys=[
        "ProductDescription[@LongDesc]",
        "ShortSummaryDescription",
        "LongSummaryDescription",
    ],
    connections=20,  # không để quá cao, tránh bị chặn do gọi API dồn dập
)
catalog.dump_to_file("icecat_raw.json")
```

Mỗi sản phẩm trả về (các field cần dùng): `ProductName`, `Brand`, `LongDesc`/`ShortSummaryDescription`, `HighPic`/`ThumbPic` (ảnh), `FeaturesGroups` (danh sách thông số kỹ thuật dạng tên-giá trị).

### Bước 3 — Map dữ liệu thô sang schema `products`

Viết 1 hàm `map_to_schema(raw_product, category)` trả về đúng cấu trúc:

```python
{
    "category": "laptop",          # lấy từ nhóm đã tải ở Bước 1
    "brand": raw["Brand"],
    "name": raw["ProductName"],
    "description": raw["LongDesc"] or raw["ShortSummaryDescription"],
    "images": [img["HighPic"] for img in raw["images"]],
    "specs": {...},                # xem hướng dẫn map riêng dưới đây
    "price": None,                 # gán ở Bước 5, KHÔNG lấy từ Icecat
    "stock": None,                 # gán ở Bước 5, KHÔNG lấy từ Icecat
}
```

**Map `specs` theo từng category** — Icecat trả `FeaturesGroups` với tên thông số không cố định (khác nhau tuỳ hãng), cần viết mapping riêng cho mỗi nhóm, ví dụ:

- **Laptop**: tìm feature có tên gần đúng `Processor`/`CPU` → `cpu`; `Internal memory`/`RAM` → `ram`; `Total storage capacity` → `storage`; `Display diagonal` → `screen`; `Graphics adapter` → `gpu`; `Battery capacity` → `battery`; `Weight` → `weight`.
- **Điện thoại**: `Chipset`/`Processor` → `chip`; `Internal memory` → `ram`+`storage`; `Display diagonal` → `screen`; `Battery capacity` → `battery`; `Rear camera` → `camera`.
- **Tai nghe**: `Battery life` → `battery_life`; `Active noise cancellation` → `anc`; `Bluetooth version` → `connection`; `Water resistance` → `waterproof`.
- **Đồng hồ thông minh**: `Battery life` → `battery_life`; `Display type/size` → `display`; `Water resistance` → `waterproof`; `Compatible operating systems` → `compatible`.
- **Phụ kiện**: giữ đơn giản — chỉ cần `type`, `compatible_with`, `material` nếu có.

Nếu không tìm thấy feature tương ứng, để trống field đó trong `specs`, không bịa giá trị.

### Bước 4 — Viết lại mô tả bằng tiếng Việt (khuyến nghị)

Mô tả gốc từ Icecat thường bằng tiếng Anh, văn phong kỹ thuật khô. Sau khi map xong, chạy 1 pass gọi LLM (API bất kỳ đang dùng cho phần RAG) để viết lại `description` sang tiếng Việt tự nhiên hơn, dựa trên `specs` đã map — không tự thêm thông tin ngoài specs thật.

### Bước 5 — Gán `price` và `stock`

Viết hàm riêng `assign_price_stock(product)`:
- Gọi LLM ước lượng khung giá VNĐ hợp lý dựa trên `category` + `brand` + `specs` (ví dụ: laptop RAM 16GB CPU i7 → khung 20-25 triệu), **ghi rõ trong code comment đây là giá ước lượng cho mục đích demo, không phải giá thị trường chính xác**.
- `stock`: gán số ngẫu nhiên hợp lý trong khoảng 5–50.

### Bước 6 — Tạo embedding và nạp vào Supabase

```python
from sentence_transformers import SentenceTransformer
from supabase import create_client

model = SentenceTransformer("intfloat/multilingual-e5-large")
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

for product in mapped_products:
    product["embedding"] = model.encode(product["description"]).tolist()
    supabase.table("products").insert(product).execute()
```

Nhớ: bảng `products` trên Supabase phải đã có cột `embedding vector(1024)` (kích thước vector khớp với model `multilingual-e5-large`) và extension `pgvector` đã bật (xem lại file kế hoạch chính).

---

## 5. Kiểm tra sau khi chạy xong
- Đếm số sản phẩm mỗi category — đảm bảo đủ ~30–40/nhóm, không lệch category (VD không có TV lẫn trong điện thoại).
- Spot-check 10–15 sản phẩm ngẫu nhiên: ảnh load được, `specs` không rỗng toàn bộ, mô tả tiếng Việt đọc tự nhiên.
- Nếu category nào thiếu số lượng do Icecat không có đủ, ghi log lại — bổ sung thủ công/từ nguồn khác sau, không cố ép đủ số bằng dữ liệu sai lệch.
