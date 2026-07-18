"""
Validate dữ liệu đã cào
"""

import json
from collections import Counter


def validate_data():
    """Kiểm tra và validate dữ liệu đã cào"""
    
    # Đọc dữ liệu
    with open("./data/raw/all_products_fixed.json", "r", encoding="utf-8") as f:
        products = json.load(f)
    
    print(f"{'='*60}")
    print(f"TỔNG SỐ SẢN PHẨM: {len(products)}")
    print(f"{'='*60}\n")
    
    # Kiểm tra theo danh mục
    category_count = Counter(p["category"] for p in products)
    print("Số lượng sản phẩm theo danh mục:")
    for category, count in sorted(category_count.items()):
        print(f"  - {category}: {count} sản phẩm")
    
    print(f"\n{'='*60}")
    
    # Kiểm tra các trường dữ liệu
    print("\nKiểm tra trường dữ liệu:")
    fields = ["name", "url", "category", "brand", "price", "image_url"]
    for field in fields:
        count = sum(1 for p in products if p.get(field))
        percentage = (count / len(products)) * 100 if products else 0
        print(f"  - {field}: {count}/{len(products)} ({percentage:.1f}%)")
    
    print(f"\n{'='*60}")
    
    # Kiểm tra giá trị null/empty
    print("\nKiểm tra dữ liệu thiếu:")
    for field in fields:
        missing = sum(1 for p in products if not p.get(field))
        if missing > 0:
            print(f"  - {field}: {missing} sản phẩm thiếu")
    
    print(f"\n{'='*60}")
    
    # Kiểm tra giá
    prices = [p["price"] for p in products if p.get("price") and p["price"] > 0]
    if prices:
        print(f"\nThống kê giá:")
        print(f"  - Giá thấp nhất: {min(prices):,}đ")
        print(f"  - Giá cao nhất: {max(prices):,}đ")
        print(f"  - Giá trung bình: {sum(prices)/len(prices):,.0f}đ")
    
    print(f"\n{'='*60}")
    
    # Kiểm tra specs
    with_specs = sum(1 for p in products if p.get("specs") and len(p["specs"]) > 0)
    print(f"\nSản phẩm có thông số kỹ thuật: {with_specs}/{len(products)} ({with_specs/len(products)*100:.1f}%)")
    
    # Kiểm tra brand
    brands = Counter(p["brand"] for p in products if p.get("brand"))
    print(f"\nTop 10 thương hiệu phổ biến:")
    for brand, count in brands.most_common(10):
        print(f"  - {brand}: {count} sản phẩm")
    
    print(f"\n{'='*60}")
    print("VALIDATION HOÀN TẤT")
    print(f"{'='*60}")


if __name__ == "__main__":
    validate_data()
