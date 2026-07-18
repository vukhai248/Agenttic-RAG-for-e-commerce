"""
Scraper cho Cellphones.com.vn
Cào dữ liệu sản phẩm từ các danh mục: điện thoại, laptop, âm thanh, mic thu âm, 
đồng hồ, camera, phụ kiện, PC, màn hình, máy in, TV, điện máy

Sử dụng Playwright để xử lý lazy load (click nút "Xem thêm")
"""

import asyncio
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse

from playwright.async_api import async_playwright, Page, Browser


class CellphonesScraper:
    """Scraper cho Cellphones.com.vn"""
    
    # Danh sách URL các danh mục cần cào
    CATEGORY_URLS = {
        "dien_thoai": "https://cellphones.com.vn/mobile.html",
        "laptop": "https://cellphones.com.vn/laptop.html",
        "am_thanh": "https://cellphones.com.vn/thiet-bi-am-thanh.html",
        "mic_thu_am": "https://cellphones.com.vn/thiet-bi-am-thanh/micro-thu-am.html",
        "dong_ho": "https://cellphones.com.vn/do-choi-cong-nghe.html",
        "camera": "https://cellphones.com.vn/phu-kien/camera.html",
        "phu_kien": "https://cellphones.com.vn/phu-kien.html",
        "pc": "https://cellphones.com.vn/may-tinh-de-ban.html",
        "man_hinh": "https://cellphones.com.vn/man-hinh.html",
        "may_in": "https://cellphones.com.vn/may-in.html",
        "tivi": "https://cellphones.com.vn/tivi.html",
        "dien_may": "https://cellphones.com.vn/dien-may.html",
    }
    
    def __init__(self, output_dir: str = "./data/raw"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.all_products = []
        
    async def scrape_category(self, browser: Browser, category_name: str, url: str) -> List[Dict]:
        """Cào dữ liệu từ một danh mục"""
        print(f"\n{'='*60}")
        print(f"Bắt đầu cào danh mục: {category_name}")
        print(f"URL: {url}")
        print(f"{'='*60}")
        
        page = await browser.new_page()
        # Set user agent để tránh bị block
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        await page.goto(url, wait_until="domcontentloaded", timeout=90000)
        
        # Chờ load sản phẩm ban đầu
        await page.wait_for_selector(".product-item", timeout=30000)
        
        products = []
        scraped_urls = set()  # Track URLs đã cào để tránh trùng lặp
        scroll_count = 0
        max_scrolls = 3  # Giới hạn số lần scroll để test nhanh
        
        while scroll_count < max_scrolls:
            # Lấy danh sách sản phẩm hiện tại
            current_products = await page.query_selector_all(".product-item")
            current_count = len(current_products)
            
            print(f"Scroll {scroll_count + 1}: Đã tìm thấy {current_count} sản phẩm")
            
            # Cào sản phẩm hiện tại trước khi click thêm
            for idx in range(len(current_products)):
                try:
                    current_products_list = await page.query_selector_all(".product-item")
                    if idx >= len(current_products_list):
                        break
                    
                    product_data = await self.extract_product_data(current_products_list[idx], category_name, page)
                    if product_data and product_data.get('url') and product_data['url'] not in scraped_urls:
                        products.append(product_data)
                        scraped_urls.add(product_data['url'])
                        print(f"  [{len(products)}] {product_data['name']}")
                except Exception as e:
                    print(f"  Lỗi khi trích xuất: {e}")
            
            # Tìm nút "Xem thêm" sản phẩm - selector đúng theo cấu trúc HTML
            load_more_button = await page.query_selector('.btn-show-more, .button_show-more-product')
            
            if load_more_button:
                try:
                    # Kiểm tra nút có visible và click được không
                    is_visible = await load_more_button.is_visible()
                    if is_visible:
                        print("  Tìm thấy nút 'Xem thêm sản phẩm', đang click...")
                        # Scroll đến nút trước khi click
                        await load_more_button.scroll_into_view_if_needed()
                        await page.wait_for_timeout(500)
                        
                        # Click vào nút "Xem thêm"
                        await load_more_button.click()
                        # Chờ page ổn định sau navigation (nếu có)
                        try:
                            await page.wait_for_load_state("networkidle", timeout=5000)
                        except:
                            pass  # Không có navigation, tiếp tục
                        await page.wait_for_timeout(3000)  # Chờ load thêm
                        
                        # Kiểm tra xem có sản phẩm mới không - re-query
                        new_products = await page.query_selector_all(".product-item")
                        new_count = len(new_products)
                        print(f"  Sau click: {new_count} sản phẩm (trước: {current_count})")
                        
                        if new_count > current_count:
                            print(f"  ✓ Load thêm {new_count - current_count} sản phẩm")
                        else:
                            print("  Không có sản phẩm mới sau click, dừng lại")
                            break
                    else:
                        print("  Nút Xem thêm không visible, thử scroll")
                        # Nếu nút không visible, scroll xuống và thử lại
                        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                        await page.wait_for_timeout(2000)
                        
                except Exception as e:
                    print(f"  Lỗi khi click nút Xem thêm: {e}")
                    break
            else:
                # Nếu không có nút, thử scroll xuống cuối trang
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(2000)
                
                # Kiểm tra xem có sản phẩm mới không
                new_products = await page.query_selector_all(".product-item")
                if len(new_products) <= current_count:
                    print("Không có sản phẩm mới sau scroll, dừng lại")
                    break
            
            scroll_count += 1
        
        await page.close()
        print(f"\nHoàn thành cào {len(products)} sản phẩm từ danh mục {category_name}")
        
        return products
    
    async def extract_product_data_from_page(self, page: Page, index: int, category_name: str) -> Optional[Dict]:
        """Trích xuất dữ liệu sản phẩm từ page bằng index - tránh lỗi DOM"""
        try:
            # Query lại element từ page để tránh lỗi stale element
            products = await page.query_selector_all(".product-item")
            if index >= len(products):
                return None
            
            product_element = products[index]
            return await self.extract_product_data(product_element, category_name, page)
        except Exception as e:
            print(f"    Lỗi extract_product_data_from_page: {e}")
            return None
    
    async def extract_product_data(self, product_element, category_name: str, page: Page) -> Optional[Dict]:
        """Trích xuất dữ liệu từ một element sản phẩm"""
        try:
            # Tên sản phẩm - selector đúng theo cấu trúc HTML thực tế
            name_elem = await product_element.query_selector(".product__name h3")
            name = ""
            if name_elem:
                name = await name_elem.inner_text()
                name = name.strip()
            
            # URL sản phẩm
            link_elem = await product_element.query_selector(".product__link")
            product_url = ""
            if link_elem:
                product_url = await link_elem.get_attribute("href")
                if product_url:
                    product_url = urljoin("https://cellphones.com.vn/", product_url)
            
            # Giá hiện tại
            price_elem = await product_element.query_selector(".product__price--show")
            price_text = ""
            if price_elem:
                price_text = await price_elem.inner_text()
                price_text = price_text.strip()
            price = self.parse_price(price_text)
            
            # Giá cũ
            old_price_elem = await product_element.query_selector(".product__price--through")
            old_price_text = ""
            if old_price_elem:
                old_price_text = await old_price_elem.inner_text()
                old_price_text = old_price_text.strip()
            old_price = self.parse_price(old_price_text)
            
            # Giảm giá
            discount_elem = await product_element.query_selector(".product__price--percent-detail")
            discount = ""
            if discount_elem:
                discount = await discount_elem.inner_text()
                discount = discount.strip()
            
            # Ảnh sản phẩm
            img_elem = await product_element.query_selector(".product__img")
            image_url = ""
            if img_elem:
                image_url = await img_elem.get_attribute("src")
                if image_url:
                    image_url = urljoin("https://cellphones.com.vn/", image_url)
            
            # Thương hiệu (từ tên sản phẩm)
            brand = self.extract_brand(name)
            
            # Thông số kỹ thuật cơ bản (màn hình, RAM, bộ nhớ)
            specs = {}
            specs_elements = await product_element.query_selector_all(".product__more-info__item")
            spec_labels = ["Màn hình", "RAM", "Bộ nhớ", "Pin", "CPU", "Camera"]
            for idx, spec_elem in enumerate(specs_elements):
                spec_text = await spec_elem.inner_text()
                if idx < len(spec_labels):
                    specs[spec_labels[idx]] = spec_text.strip()
                else:
                    specs[f"Spec_{idx}"] = spec_text.strip()
            
            # SKU từ URL
            sku = product_url.split('/')[-1].replace('.html', '') if product_url else ""
            
            # Special price (giá khuyến mãi) = price hiện tại
            special_price = price
            
            # Final price = price hiện tại
            final_price = price
            
            # Is parent = True (sản phẩm chính)
            is_parent = True
            
            product_data = {
                "product_id": "",
                "name": name,
                "brand": brand,
                "sku": sku,
                "url": product_url,
                "category": category_name,
                "price": price,
                "special_price": special_price,
                "final_price": final_price,
                "stock": 0,
                "is_parent": is_parent,
                "review_count": 0,
                "average_rating": 0,
                "cpu": specs.get("CPU", ""),
                "chipset": specs.get("Chipset", ""),
                "ram": specs.get("RAM", ""),
                "storage": specs.get("Bộ nhớ", ""),
                "display_size": specs.get("Màn hình", ""),
                "display_resolution": "",
                "battery": specs.get("Pin", ""),
                "os": "",
                "gpu": "",
                "camera_primary": specs.get("Camera", ""),
                "camera_secondary": "",
                "camera_video": "",
                "bluetooth": "",
                "dimensions": "",
                "weight": "",
                "color": "",
                "included_accessories": "",
                "thumbnail": image_url,
                "image_url": image_url,
                "description": "",
                "attributes_json": json.dumps(specs, ensure_ascii=False),
                "old_price": old_price,
                "discount": discount,
                "smember_discount": "",
                "trade_price": 0,
                "base_price": old_price,
                "sale_price": price,
                "color_variants": [],
                "storage_variants": [],
                "promotions": [],
                "scraped_at": datetime.now().isoformat(),
            }
            
            return product_data
            
        except Exception as e:
            print(f"    Lỗi trích xuất: {e}")
            return None
    
    async def scrape_product_detail(self, page: Page, product_url: str) -> Dict:
        """Cào chi tiết sản phẩm từ trang chi tiết (tùy chọn)"""
        try:
            await page.goto(product_url, wait_until="networkidle", timeout=60000)
            
            # Product ID
            product_id_elem = await page.query_selector("[data-product-id]")
            product_id = ""
            if product_id_elem:
                product_id = await product_id_elem.get_attribute("data-product-id")
            
            # SKU từ URL
            sku = product_url.split('/')[-1].replace('.html', '') if product_url else ""
            
            # Mô tả sản phẩm
            description_elem = await page.query_selector(".product-description, .description, .detail-desc")
            description = await description_elem.inner_text() if description_elem else ""
            
            # Stock availability
            stock_elem = await page.query_selector(".box-on-stock .count")
            stock = 0
            if stock_elem:
                stock_text = await stock_elem.inner_text()
                stock = int(re.sub(r'[^\d]', '', stock_text)) if stock_text else 0
            
            # Review count và average rating
            review_count = 0
            average_rating = 0
            rating_elem = await page.query_selector(".rating, .average-rating")
            if rating_elem:
                rating_text = await rating_elem.inner_text()
                # Parse rating (VD: "4.5/5" hoặc "4.5")
                rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                if rating_match:
                    average_rating = float(rating_match.group(1))
            
            review_count_elem = await page.query_selector(".review-count, .total-reviews")
            if review_count_elem:
                review_text = await review_count_elem.inner_text()
                review_count = int(re.sub(r'[^\d]', '', review_text)) if review_text else 0
            
            # Thông số kỹ thuật đầy đủ từ bảng technical-content
            specs = {}
            spec_table = await page.query_selector(".technical-content, .spec-table, .product-specs table, .specs-table")
            if spec_table:
                rows = await spec_table.query_selector_all("tr, .technical-content-item")
                for row in rows:
                    cells = await row.query_selector_all("td, th")
                    if len(cells) >= 2:
                        key = await cells[0].inner_text()
                        value = await cells[1].inner_text()
                        specs[key.strip()] = value.strip()
            
            # Cào variants (màu sắc)
            color_variants = []
            color_variant_elems = await page.query_selector_all(".box-product-variants .list-variants .item-variant")
            for variant_elem in color_variant_elems:
                variant_id = await variant_elem.get_attribute("data-product-id")
                variant_name_elem = await variant_elem.query_selector(".item-variant-name")
                variant_name = await variant_name_elem.inner_text() if variant_name_elem else ""
                variant_price_elem = await variant_elem.query_selector(".item-variant-price")
                variant_price = await variant_price_elem.inner_text() if variant_price_elem else ""
                variant_img_elem = await variant_elem.query_selector("img")
                variant_img = await variant_img_elem.get_attribute("src") if variant_img_elem else ""
                
                is_active = "active" in await variant_elem.get_attribute("class")
                is_disabled = "disable" in await variant_elem.get_attribute("class")
                
                color_variants.append({
                    "product_id": variant_id,
                    "color_name": variant_name,
                    "price": self.parse_price(variant_price),
                    "price_text": variant_price,
                    "image_url": urljoin("https://cellphones.com.vn/", variant_img) if variant_img else "",
                    "is_active": is_active,
                    "is_disabled": is_disabled
                })
            
            # Cào variants (phiên bản/storage)
            storage_variants = []
            storage_variant_elems = await page.query_selector_all(".box-linked .list-linked .item-linked")
            for variant_elem in storage_variant_elems:
                variant_name_elem = await variant_elem.query_selector("strong")
                variant_name = await variant_name_elem.inner_text() if variant_name_elem else ""
                variant_href = await variant_elem.get_attribute("href")
                variant_url = urljoin("https://cellphones.com.vn/", variant_href) if variant_href else ""
                
                is_active = "active" in await variant_elem.get_attribute("class")
                
                storage_variants.append({
                    "storage_name": variant_name,
                    "url": variant_url,
                    "is_active": is_active
                })
            
            # Ảnh thêm
            images = []
            img_elements = await page.query_selector_all(".product-gallery img, .product-images img")
            for img in img_elements:
                src = await img.get_attribute("src")
                if src:
                    images.append(urljoin("https://cellphones.com.vn/", src))
            
            # Thumbnail (ảnh chính)
            thumbnail = images[0] if images else ""
            
            # Khuyến mãi/promotions
            promotions = []
            promotion_items = await page.query_selector_all(".promotion-pack_item")
            for promo_elem in promotion_items:
                promo_detail_elem = await promo_elem.query_selector(".box-product-promotion-detail")
                if promo_detail_elem:
                    promo_text = await promo_detail_elem.inner_text()
                    promotions.append(promo_text.strip())
            
            # Smember discount
            smember_discount_elem = await page.query_selector(".smember-discount")
            smember_discount = ""
            if smember_discount_elem:
                smember_discount = await smember_discount_elem.inner_text()
            
            # Trade-in price (Thu cũ lên đời)
            trade_price_elem = await page.query_selector(".trade-price-info .sale-price")
            trade_price = 0
            if trade_price_elem:
                trade_price_text = await trade_price_elem.inner_text()
                trade_price = self.parse_price(trade_price_text)
            
            # Base price (giá gốc)
            base_price_elem = await page.query_selector(".base-price")
            base_price = 0
            if base_price_elem:
                base_price_text = await base_price_elem.inner_text()
                base_price = self.parse_price(base_price_text)
            
            # Sale price (giá khuyến mãi)
            sale_price_elem = await page.query_selector(".sale-price")
            sale_price = 0
            if sale_price_elem:
                sale_price_text = await sale_price_elem.inner_text()
                sale_price = self.parse_price(sale_price_text)
            
            return {
                "product_id": product_id,
                "sku": sku,
                "description": description,
                "specs": specs,
                "images": images,
                "thumbnail": thumbnail,
                "stock": stock,
                "review_count": review_count,
                "average_rating": average_rating,
                "color_variants": color_variants,
                "storage_variants": storage_variants,
                "promotions": promotions,
                "smember_discount": smember_discount,
                "trade_price": trade_price,
                "base_price": base_price,
                "sale_price": sale_price,
            }
            
        except Exception as e:
            print(f"    Lỗi khi cào chi tiết: {e}")
            return {}
    
    def parse_price(self, price_text: str) -> Optional[int]:
        """Parse giá từ text (VD: '30.090.000đ' -> 30090000)"""
        if not price_text:
            return None
        
        # Xóa ký tự không phải số
        cleaned = re.sub(r'[^\d]', '', price_text)
        
        if cleaned:
            return int(cleaned)
        return None
    
    def extract_brand(self, product_name: str) -> str:
        """Trích xuất thương hiệu từ tên sản phẩm"""
        # Danh sách thương hiệu phổ biến (ưu tiên dài hơn trước)
        brands = [
            "MacBook", "iPhone", "iPad", "Mac", "Apple",
            "Samsung", "Galaxy",
            "Xiaomi", "Redmi", "POCO",
            "OPPO", "Vivo", "Realme", "OnePlus",
            "Sony", "LG", "Panasonic", "Toshiba", "Sharp",
            "Dell", "HP", "Lenovo", "ASUS", "Acer", "MSI", "Gigabyte",
            "Canon", "Nikon", "Fujifilm", "GoPro", "DJI",
            "JBL", "Bose", "Harman Kardon", "Logitech", "Razer", "Corsair", "Garmin",
            "Honor", "Nubia", "Meizu", "Vsmart", "Huawei",
            "Google", "TCL", "Coocaa", "AQUA",
            "Epos", "Sennheiser", "Audio-Technica", "Shure",
            "Microsoft", "ZTE", "Nokia", "TECNO", "Infinix", "Nothing", "Masstel", "Itel",
            "Amazfit", "Roborock", "Dreame", "Tineco"
        ]
        
        product_name_lower = product_name.lower()
        for brand in brands:
            if brand.lower() in product_name_lower:
                return brand
        
        return "Unknown"
    
    def save_to_json(self, data: List[Dict], filename: str):
        """Lưu dữ liệu vào file JSON"""
        filepath = self.output_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Đã lưu dữ liệu vào {filepath}")
    
    def save_to_csv(self, data: List[Dict], filename: str):
        """Lưu dữ liệu vào file CSV với đầy đủ fields"""
        import csv
        
        filepath = self.output_dir / filename
        if not data:
            print(f"Không có dữ liệu để lưu vào {filename}")
            return
        
        # Flatten dict cho CSV - bao gồm tất cả fields từ laptop_products.csv
        fieldnames = [
            "product_id", "name", "brand", "sku", "url", "category", 
            "price", "special_price", "final_price", "stock", "is_parent",
            "review_count", "average_rating", "cpu", "chipset", "ram", "storage",
            "display_size", "display_resolution", "battery", "os", "gpu",
            "camera_primary", "camera_secondary", "camera_video", "bluetooth",
            "dimensions", "weight", "color", "included_accessories",
            "thumbnail", "image_url", "description", "attributes_json",
            "old_price", "discount", "smember_discount", "trade_price",
            "base_price", "sale_price", "color_variants", "storage_variants",
            "promotions", "scraped_at"
        ]
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for item in data:
                row = {}
                for field in fieldnames:
                    value = item.get(field, "")
                    # Convert dict/list to JSON string
                    if isinstance(value, (dict, list)):
                        value = json.dumps(value, ensure_ascii=False)
                    row[field] = value
                writer.writerow(row)
        
        print(f"Đã lưu dữ liệu vào {filepath}")
    
    async def scrape_all_categories(self, scrape_details: bool = False):
        """Cào tất cả các danh mục"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)  # headless=True để nhanh hơn
            
            for category_name, url in self.CATEGORY_URLS.items():
                try:
                    products = await self.scrape_category(browser, category_name, url)
                    self.all_products.extend(products)
                    
                    # Lưu dữ liệu từng danh mục
                    if products:
                        self.save_to_json(products, f"{category_name}_products.json")
                        self.save_to_csv(products, f"{category_name}_products.csv")
                        print(f"✓ Đã lưu {len(products)} sản phẩm cho danh mục {category_name}")
                    
                except Exception as e:
                    print(f"Lỗi khi cào danh mục {category_name}: {e}")
                    continue
            
            await browser.close()
        
        # Lưu tất cả dữ liệu
        if self.all_products:
            self.save_to_json(self.all_products, "all_products.json")
            self.save_to_csv(self.all_products, "all_products.csv")
            print(f"\n{'='*60}")
            print(f"TỔNG KẾT: Đã cào {len(self.all_products)} sản phẩm từ tất cả danh mục")
            print(f"{'='*60}")


async def main():
    """Hàm main"""
    scraper = CellphonesScraper(output_dir="./rag-service/data/raw")
    
    # Cào tất cả danh mục (scrape_details=False để nhanh, True để có chi tiết)
    await scraper.scrape_all_categories(scrape_details=False)


if __name__ == "__main__":
    asyncio.run(main())
