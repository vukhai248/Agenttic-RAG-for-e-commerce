import sys
from pathlib import Path

# Thêm thư mục gốc của rag-service vào sys.path để tránh lỗi import module configs
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from configs.setting import settings

app = FastAPI(
    title="Agentic RAG E-Commerce Backend",
    description="Dịch vụ Backend RAG hỗ trợ tư vấn sản phẩm, so sánh thông số và tra cứu đơn hàng.",
    version="1.0.0",
    debug=settings.DEBUG
)

# Cấu hình CORS để frontend Next.js có thể gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong thực tế nên giới hạn chỉ cho frontend Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_token: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    tool_used: Optional[str] = None
    sources: List[str] = []
    session_id: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "service": "rag-service",
        "debug_mode": settings.DEBUG,
        "supabase_connected": bool(settings.SUPABASE_URL)
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        msg_lower = request.message.lower()
        
        # MOCK phản hồi tạm thời để kiểm tra kết nối Next.js <-> FastAPI
        reply = "Chào bạn! Đây là phản hồi từ FastAPI AI Backend thực tế. Hệ thống RAG và Agent đang được cấu trúc."
        tool_used = "mock_fastapi_tool"
        sources = ["fastapi_backend"]
        
        return ChatResponse(
            reply=reply,
            tool_used=tool_used,
            sources=sources,
            session_id=request.session_id or "fastapi-session"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Chạy server dựa trên cấu hình trong file .env
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
