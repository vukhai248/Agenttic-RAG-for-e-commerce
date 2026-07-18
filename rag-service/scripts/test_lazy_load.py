"""
Test lazy load - cào thêm sản phẩm bằng nút "Xem thêm"
"""

import asyncio
from playwright.async_api import async_playwright
from scraper_cellphones import CellphonesScraper


async def test_lazy_load():
    """Test lazy load với nhiều lần click nút Xem thêm"""
    scraper = CellphonesScraper(output_dir="./data/raw")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        # Set user agent
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        
        await page.goto("https://cellphones.com.vn/mobile.html", wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(3000)
        
        scroll_count = 0
        max_scrolls = 20  # Test 20 lần scroll
        
        while scroll_count < max_scrolls:
            current_products = await page.query_selector_all(".product-item")
            current_count = len(current_products)
            print(f"\nScroll {scroll_count + 1}: Đã tìm thấy {current_count} sản phẩm")
            
            # Scroll xuống cuối trang - lazy load tự động
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(3000)  # Chờ lâu hơn để load
            
            # Kiểm tra xem có sản phẩm mới không
            new_products = await page.query_selector_all(".product-item")
            if len(new_products) > current_count:
                print(f"✓ Load thêm {len(new_products) - current_count} sản phẩm")
            else:
                print("Không có sản phẩm mới sau scroll")
                # Thử thêm 1 lần nữa để chắc chắn
                await page.wait_for_timeout(2000)
                new_products = await page.query_selector_all(".product-item")
                if len(new_products) <= current_count:
                    print("Thử lại vẫn không có sản phẩm mới, dừng lại")
                    break
            
            scroll_count += 1
        
        # Cào dữ liệu sau khi đã load hết
        final_products = await page.query_selector_all(".product-item")
        print(f"\nTổng số sản phẩm sau lazy load: {len(final_products)}")
        
        # Trích xuất dữ liệu
        products = []
        for idx, product in enumerate(final_products):
            try:
                product_data = await scraper.extract_product_data(product, "dien_thoai", page)
                if product_data:
                    products.append(product_data)
                    if idx < 5:  # In 5 sản phẩm đầu tiên
                        print(f"  [{idx + 1}] {product_data['name']} - {product_data['price']}")
            except Exception as e:
                print(f"  Lỗi: {e}")
        
        # Lưu dữ liệu
        if products:
            scraper.save_to_json(products, "test_lazy_load.json")
            scraper.save_to_csv(products, "test_lazy_load.csv")
            print(f"\nĐã lưu {len(products)} sản phẩm")
        
        await page.close()
        await browser.close()


if __name__ == "__main__":
    asyncio.run(test_lazy_load())
