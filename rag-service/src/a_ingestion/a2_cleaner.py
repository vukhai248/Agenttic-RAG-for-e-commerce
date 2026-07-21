import re
from typing import List, Dict, Any

class DataCleaner:
    """Cleaner responsible for cleaning and normalizing raw data before embedding"""

    @staticmethod
    def remove_html_tags(text: str) -> str:
        """Remove HTML tags mixed in the text"""
        if not text:
            return ""
        # Remove HTML tags
        clean_text = re.sub(r'<[^>]+>', ' ', text)
        # Replace multiple consecutive spaces with a single space
        clean_text = re.sub(r'\s+', ' ', clean_text)
        return clean_text.strip()

    def clean_product_data(self, products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean and normalize the product list"""
        cleaned_products = []
        print("[Cleaner] Bắt đầu làm sạch dữ liệu sản phẩm...")
        
        for prod in products:
            try:
                # 1. Ensure basic fields are not None
                name = prod.get("name", "").strip()
                brand = prod.get("brand", "Unknown").strip()
                category = prod.get("category", "accessory").strip()
                description = prod.get("description", "")
                
                # 2. Clean description text (product descriptions easily contain HTML when scraped)
                clean_description = self.remove_html_tags(description)
                
                # 3. Normalize price and discount
                price = float(prod.get("price", 0))
                original_price = float(prod.get("original_price", 0))
                discount = float(prod.get("discount", 0))
                
                # 4. Normalize specs (JSONB)
                specs = prod.get("specs", {})
                if not isinstance(specs, dict):
                    specs = {}
                
                cleaned_prod = {
                    "id": prod.get("id"),
                    "name": name,
                    "brand": brand,
                    "category": category,
                    "price": price,
                    "original_price": original_price,
                    "discount": discount,
                    "description": clean_description,
                    "specs": specs,
                    "rating_avg": float(prod.get("rating_avg", 0.0)),
                    "images": prod.get("images", [])
                }
                cleaned_products.append(cleaned_prod)
            except Exception as e:
                print(f"[Cleaner] Lỗi khi làm sạch sản phẩm ID {prod.get('id')}: {e}")
                
        print(f"[Cleaner] Đã làm sạch xong {len(cleaned_products)} sản phẩm.")
        return cleaned_products

    def clean_policy_data(self, policies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean policy documents"""
        cleaned_policies = []
        print("[Cleaner] Bắt đầu làm sạch dữ liệu chính sách...")
        
        for policy in policies:
            content = policy.get("content", "")
            # Remove redundant whitespaces, normalize newline characters
            clean_content = re.sub(r'\n{3,}', '\n\n', content)
            
            cleaned_policies.append({
                "source_doc": policy.get("source_doc"),
                "content": clean_content.strip(),
                "file_path": policy.get("file_path")
            })
            
        print(f"[Cleaner] Đã làm sạch xong {len(cleaned_policies)} tài liệu chính sách.")
        return cleaned_policies
