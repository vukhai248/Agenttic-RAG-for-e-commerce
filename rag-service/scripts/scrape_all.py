"""
Cào dữ liệu cho tất cả danh mục
"""

import asyncio
from scraper_cellphones import CellphonesScraper


async def main():
    """Cào tất cả danh mục"""
    scraper = CellphonesScraper(output_dir="./data/raw")
    await scraper.scrape_all_categories()


if __name__ == "__main__":
    asyncio.run(main())
