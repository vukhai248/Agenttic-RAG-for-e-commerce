from typing import List
import json
from configs.GetConfig import config
from configs.setting import settings
from src.c_retrieval.product_retriever import ProductRetriever

# INITIALIZE RETRIEVER FOR SHARED USE
product_retriever = ProductRetriever(config=config, settings=settings)


def product_compare(product_names: List[str]) -> str:
    """
    Compare technical specifications and details of multiple products.
    
    Args:
        product_names (List[str]): List of specific product names to compare.
    """
    try:
        if not product_names:
            return "Please provide product names to compare."
            
        comparison_data = []
        
        # Query details for each product name in the list
        for name in product_names:
            # Call retrieve (limit is handled by slicing the first result [0])
            raw_products = product_retriever.retrieve(query_text=name)
            
            if raw_products:
                best_match = raw_products[0]  # Get the top 1 reranked match
                doc_content = best_match["document"]
                metadata = best_match["metadata"]
                
                product_name = doc_content.split('\n')[0].replace("Sản phẩm:", "").strip()
                price = metadata.get("price", "Unknown")
                brand = metadata.get("brand", "Unknown")
                
                comparison_data.append(
                    f"Product: {product_name}\n"
                    f"- Brand: {brand}\n"
                    f"- Price: {price:,.0f} VNĐ\n"
                    f"- Specifications & Details:\n{doc_content}"
                )
            else:
                comparison_data.append(f"Product '{name}': No information found in the database.")
                
        return "\n\n=== COMPARISON DATA ===\n\n" + "\n\n====================\n\n".join(comparison_data)
        
    except Exception as e:
        return f"Error occurred during product comparison: {str(e)}"






# SCHEMA DEFINITION FOR LLM API REGISTRATION
PRODUCT_COMPARE_SCHEMA = {
    "type": "function",
    "function": {
        "name": "product_compare",
        "description": (
            "Compare technical specifications, prices, and features of specific, named products. "
            "Use this tool ONLY when the user specifies the exact names of two or more products to compare (e.g., 'Compare iPhone 15 and Galaxy S24'). "
            "Do NOT use this tool for general comparisons (e.g., 'Compare Samsung S24 with other iPhones' or 'Compare Dell and HP laptops'). For those, use product_search instead."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "product_names": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": (
                        "List of specific product names to compare. Each item in the array MUST be a specific, named product (e.g., 'iPhone 15 Pro', 'Dell XPS 13 9315'). "
                        "Do NOT include generic terms like 'other iPhones' or 'HP laptops' in this list."
                    )
                }
            },
            "required": ["product_names"]
        }
    }
}