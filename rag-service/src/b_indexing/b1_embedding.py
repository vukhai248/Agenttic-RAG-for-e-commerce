import requests
import time
from typing import List
from configs.setting import settings

class EmbeddingService:
    """Service class for handling text embeddings using OpenRouter API."""
    
    def __init__(self, api_key: str = None, model: str = None, config=None, settings=None):
        # Priority: manual api_key > api_key from settings object > api_key from global settings import
        if api_key:
            self.api_key = api_key
        elif settings:
            self.api_key = settings.OPENROUTER_API_KEY
        else:
            from configs.setting import settings as global_settings
            self.api_key = global_settings.OPENROUTER_API_KEY
            
        if not self.api_key or "your-openrouter" in self.api_key:
            raise ValueError("Vui lòng điền OPENROUTER_API_KEY thật vào file .env!")
  
        # Priority: manual 'model' parameter > config.yaml > default fallback
        if model:
            self.model = model
        elif config and hasattr(config, 'embedding') and hasattr(config.embedding, 'active'):
            self.model = config.embedding.active
        elif config and hasattr(config, 'embedding_model'):
            self.model = config.embedding_model
        else:
            self.model = "nvidia/llama-nemotron-embed-vl-1b-v2:free"  # Safe fallback
            
        self.url = "https://openrouter.ai/api/v1/embeddings"
          
    def clean_image_urls(self, text: str) -> str:
        """Remove absolute/relative image URLs to prevent OpenRouter API from misinterpreting them"""
        if not text:
            return ""
        import re
        text = re.sub(r'https?://\S+\.(?:png|jpg|jpeg|gif|webp)\S*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'/\S+\.(?:png|jpg|jpeg|gif|webp)', '', text, flags=re.IGNORECASE)
        return text
    
    def get_embedding(self, text: str, max_retries: int = 3, timeout: int = 15) -> List[float]:
        """
        Call OpenRouter API to get a 2048-dimensional embedding vector.
        
        Args:
            text: Text to be embedded
            max_retries: Number of retries when an error occurs (default: 3)
            timeout: Request timeout in seconds (default: 15)
            
        Returns:
            List[float]: 2048-dimensional embedding vector
            
        Raises:
            ValueError: If embedding cannot be retrieved after max_retries
        """
        cleaned_text = self.clean_image_urls(text)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "input": cleaned_text,
            "encoding_format": "float"
        }
        
        for attempt in range(max_retries):
            try:
                response = requests.post(self.url, headers=headers, json=payload, timeout=timeout)
                result = response.json()
                if "data" in result:
                    return result["data"][0]["embedding"]
                else:
                    print(f"Lỗi API: {result.get('error')}. Đang thử lại lần {attempt + 1}...")
            except Exception as e:
                print(f"Lỗi kết nối: {e}. Đang thử lại lần {attempt + 1}...")
            time.sleep(2)
        raise ValueError(f"Không thể lấy embedding sau {max_retries} lần thử!")
