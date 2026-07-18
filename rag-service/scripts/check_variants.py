"""
Kiểm tra biến thể sản phẩm (cấu hình, màu sắc)
"""

import json
from collections import Counter


def check_variants():
    """Kiểm tra xem có sản phẩm nào có nhiều biến thể không"""
    
    # Đọc dữ liệu
    with open("./data/raw/all_products_fixed.json", "r", encoding="utf-8") as f:
        products = json.load(f)
    
    print(f"{'='*60}")
    print(f"KIỂM TRA BIẾN THỂ SẢN PHẨM")
    print(f"{'='*60}\n")
    
    # Tìm sản phẩm có tên cơ bản giống nhau
    # Ví dụ: "iPhone 17 Pro" có thể có "256GB", "512GB"
    product_groups = {}
    
    for product in products:
        name = product.get("name", "")
        # Lấy tên cơ bản (loại bỏ cấu hình)
        base_name = name
        for suffix in ["256GB", "512GB", "1TB", "128GB", "64GB", "8GB", "12GB", "16GB", "4GB", "6GB"]:
            base_name = base_name.replace(suffix, "").strip()
        
        if base_name not in product_groups:
            product_groups[base_name] = []
        product_groups[base_name].append(product)
    
    # Tìm sản phẩm có nhiều biến thể
    multi_variant = {k: v for k, v in product_groups.items() if len(v) > 1}
    
    print(f"Số sản phẩm có nhiều biến thể: {len(multi_variant)}")
    print(f"\nTop 20 sản phẩm có nhiều biến thể nhất:\n")
    
    for base_name, variants in sorted(multi_variant.items(), key=lambda x: len(x[1]), reverse=True)[:20]:
        print(f"  {base_name}: {len(variants)} biến thể")
        for v in variants:
            print(f"    - {v['name']}: {v.get('price', 0):,}đ")
        print()
    
    print(f"{'='*60}")


if __name__ == "__main__":
    check_variants()
