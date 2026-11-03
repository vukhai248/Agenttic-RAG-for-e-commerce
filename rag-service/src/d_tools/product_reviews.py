from app.core.security import supabase_anon_client
from src.d_tools.tool_result import Segment, ToolResult


def product_reviews(product_id: int | None = None, product_name: str | None = None, limit: int = 5) -> ToolResult:
    def result(text):
        return ToolResult("product_reviews", text)

    if type(limit) is not int or not 1 <= limit <= 20:
        return result("limit phải từ 1 đến 20.")
    if product_id is not None and (type(product_id) is not int or product_id <= 0):
        return result("Mã sản phẩm không hợp lệ.")
    try:
        if product_id is None:
            if not isinstance(product_name, str) or not product_name.strip():
                return result("Vui lòng chọn sản phẩm cụ thể bằng tên hoặc mã sản phẩm.")
            # No PostgREST filter syntax or wildcard supplied by the model is forwarded.
            name = product_name.strip()
            if len(name) > 200 or any(c in name for c in "%_*\\"):
                return result("Vui lòng chọn tên sản phẩm cụ thể.")
            products = (supabase_anon_client.table("products").select("id,name")
                        .ilike("name", f"%{name}%").limit(2).execute()).data
            if len(products or []) != 1:
                return result("Vui lòng chọn sản phẩm cụ thể bằng mã sản phẩm (không có hoặc có nhiều kết quả).")
            product_id = products[0]["id"]
        reviews = (supabase_anon_client.table("reviews").select("id,rating,comment,created_at")
                   .eq("product_id", product_id).order("created_at", desc=True).limit(limit).execute()).data or []
        trusted = [f"=== PRODUCT REVIEWS: {product_id} ==="]
        segments = []
        for review in reviews:
            trusted.append(f"Review {review['id']}: {review['rating']}/5 | {review['created_at']}")
            segments.append(Segment("review", str(review["id"]), review.get("comment") or ""))
        if not reviews:
            trusted.append("Chưa có đánh giá.")
        return ToolResult("product_reviews", "\n".join(trusted), segments)
    except Exception:
        return result("Không thể đọc đánh giá lúc này. Vui lòng thử lại sau.")


PRODUCT_REVIEWS_SCHEMA = {
    "type": "function", "function": {
        "name": "product_reviews",
        "description": "Read latest customer ratings and comments. Resolve an ambiguous product with product_search first.",
        "parameters": {"type": "object", "properties": {
            "product_id": {"type": "integer"}, "product_name": {"type": "string"},
            "limit": {"type": "integer", "minimum": 1, "maximum": 20, "default": 5},
        }, "required": []},
    },
}
