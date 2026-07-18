"""
Test scraper với một danh mục nhỏ trước
"""

import asyncio
from playwright.async_api import async_playwright
from scraper_cellphones import CellphonesScraper


async def test_single_category():
    """Test với một danh mục"""
    scraper = CellphonesScraper(output_dir="./data/raw")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        
        # Test với danh mục điện thoại
        products = await scraper.scrape_category(
            browser, 
            "dien_thoai", 
            "https://cellphones.com.vn/mobile.html"
        )
        
        if products:
            scraper.save_to_json(products, "test_dien_thoai.json")
            scraper.save_to_csv(products, "test_dien_thoai.csv")
            print(f"\nTest thành công! Đã cào {len(products)} sản phẩm")
            
            # In mẫu dữ liệu đầu tiên để kiểm tra
            if products:
                print("\n=== MẪU DỮ LIỆU ĐẦU TIÊN ===")
                import json
                print(json.dumps(products[0], ensure_ascii=False, indent=2))
        
        await browser.close()


if __name__ == "__main__":
    asyncio.run(test_single_category())
