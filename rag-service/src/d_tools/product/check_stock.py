from typing import List, Dict, Any
from app.core.security import supabase_anon_client


def check_stock(product_names: List[str]) -> str:
    """
    Query real-time product stock status and pricing from Supabase.
    Uses the static supabase_anon_client for ultra-fast response (< 50ms).
    Supports both general product series/lines and exact model SKUs.
    
    Args:
        product_names (List[str]): List of product names, series, or model SKUs to look up.
        
    Returns:
        str: Formatted string describing the real-time stock status and pricing of matching products.
    """
    try:
        if not product_names:
            return "Please provide at least one product name to check stock."
        
        results = []
        for name in product_names:
            clean_name = name.strip()
            if not clean_name:
                continue
                
            # Query directly from database using public client (Anon Key)
            response = (
                supabase_anon_client.table("products")
                .select("name, stock, price")
                .ilike("name", f"%{clean_name}%")
                .limit(3)
                .execute()
            )
            
            if response.data:
                for prod in response.data:
                    prod_name = prod.get("name", clean_name)
                    stock_qty = prod.get("stock", 0)
                    price = prod.get("price", 0)
                    
                    price_str = f"{price:,.0f} VND" if price else "Contact for price"
                    status = f"In Stock ({stock_qty} available)" if stock_qty > 0 else "Out of Stock"
                    results.append(f"- **{prod_name}**: {status} | Price: {price_str}")
            else:
                results.append(f"- No products found matching keyword '{clean_name}'.")
                
        if not results:
            return "No valid product names were provided."
            
        return "\n".join(results)

    except Exception as e:
        return f"Error during stock lookup: {str(e)}"


# Schema definition for LLM Function Calling registration
CHECK_STOCK_SCHEMA = {
    "name": "check_stock",
    "description": "Check real-time stock availability and pricing for one or multiple product names.",
    "parameters": {
        "type": "object",
        "properties": {
            "product_names": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "List of product names or keywords to check stock for. "
                    "Can be: "
                    "1) A general product series name containing multiple sub-models/variants "
                    "(e.g., 'HP Victus 15', 'iPhone 16'), OR "
                    "2) A specific exact product name or model SKU "
                    "(e.g., 'iPhone 16 Pro Max 256GB', 'HP Victus 15-fa1139TX')."
                )
            }
        },
        "required": ["product_names"]
    }
}