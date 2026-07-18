"""
Fix brand cho dữ liệu đã cào
"""

import json
from scraper_cellphones import CellphonesScraper


def fix_brands():
    """Cập nhật brand cho dữ liệu đã cào"""
    scraper = CellphonesScraper(output_dir="./data/raw")
    
    # Đọc dữ liệu
    with open("./data/raw/all_products.json", "r", encoding="utf-8") as f:
        products = json.load(f)
    
    print(f"Tổng số sản phẩm: {len(products)}")
    
    # Cập nhật brand
    for product in products:
        old_brand = product.get("brand", "Unknown")
        new_brand = scraper.extract_brand(product.get("name", ""))
        product["brand"] = new_brand
        if old_brand != new_brand:
            print(f"  {product['name'][:50]}: {old_brand} -> {new_brand}")
    
    # Lưu lại
    scraper.save_to_json(products, "all_products_fixed.json")
    scraper.save_to_csv(products, "all_products_fixed.csv")
    
    print("\nĐã lưu dữ liệu đã fix brand")


if __name__ == "__main__":
    fix_brands()
