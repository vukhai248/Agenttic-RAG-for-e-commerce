import json
from configs.GetConfig import config
from configs.setting import settings
from src.c_retrieval.product_retriever import ProductRetriever

# INITIALIZE RETRIEVER FOR SHARED USE
product_retriever = ProductRetriever(config=config, settings=settings)

def product_search(
    key_word: str, 
    brand: str = None, 
    min_price: float = None, 
    max_price: float = None, 
    limit: int = 5
) -> str:
    """
    Search for products based on semantic query terms and optional hard filters (brand, price range).

    Args:
        key_word (str): The search query extracted and optimized by the LLM (noise-filtered, concise search term).
        brand (str, optional): The specific brand/manufacturer (e.g., 'HP', 'Dell', 'Asus', 'Samsung', 'Apple').
        min_price (float, optional): Minimum price limit in VNĐ.
        max_price (float, optional): Maximum price limit in VNĐ.
        limit (int): Maximum number of products to return.
    """
    try:
        # Call the retrieval service layer with filters and dynamic limit scaling
        raw_products = product_retriever.retrieve(
            query_text=key_word,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            limit=limit
        )
        
        if not raw_products:
            return "No matching products found."

        # Limit the results based on LLM request or default
        selected_products = raw_products[:limit]
        
        # Format raw data list into a structured string for the LLM
        formatted_list = []
        for i, item in enumerate(selected_products):
            doc_content = item["document"]
            metadata = item["metadata"]
            score = item["score"]
            
            # Extract product title from the first line of document content
            product_name = doc_content.split('\n')[0].replace("Sản phẩm:", "").strip()
            price = metadata.get("price", "Unknown")
            brand_name = metadata.get("brand", "Unknown")
            
            formatted_list.append(
                f"Product {product_name}\n"
                f"- Brand: {brand_name}\n"
                f"- Price: {price:,.0f} VNĐ\n"
                f"- Score: {score:.4f}\n"
                f"- Details:\n{doc_content}"
            )
            
        return "\n\n".join(formatted_list)
        
    except Exception as e:
        return f"Error occurred during product retrieval: {str(e)}"



# SCHEMA DEFINITION FOR LLM API REGISTRATION
PRODUCT_SEARCH_SCHEMA = {
    "type": "function",
    "function": {
        "name": "product_search",
        "description": (
            "Search for electronic products (laptops, phones) in the catalog based on search terms. "
            "Supports filtering by brand and price range (min/max price)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "key_word": {
                    "type": "string",
                    "description": (
                        "The search query extracted and optimized by the LLM (noise-filtered, concise search term). "
                        "Do NOT include greeting words, conversational filler, or hard filters like brand and price limit. "
                        "Example: convert 'Hey shop, find me a Samsung phone under 10M' to 'phone'."
                    )
                },
                "brand": {
                    "type": "string",
                    "description": "Specific brand/manufacturer if mentioned (e.g., 'Dell', 'HP', 'Samsung', 'Apple', 'Asus')."
                },
                "min_price": {
                    "type": "number",
                    "description": "Minimum price limit in VNĐ (e.g., 20000000 for 20 million VNĐ)."
                },
                "max_price": {
                    "type": "number",
                    "description": "Maximum price limit in VNĐ (e.g., 30000000 for 30 million VNĐ)."
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of products to return (default: 5)."
                }
            },
            "required": ["key_word"]
        }
    }
}
