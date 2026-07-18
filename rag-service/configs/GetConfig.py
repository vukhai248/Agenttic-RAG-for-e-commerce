import os
import yaml
from pathlib import Path

# Thư mục gốc (rag-service/)
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = os.path.join(BASE_DIR, "configs", "config.yaml")

class AppConfig:
    class Chunking:
        def __init__(self, data):
            self.chunk_size = data.get("chunk_size", 1000)
            self.chunk_overlap = data.get("chunk_overlap", 200)

    class Retrieval:
        def __init__(self, data):
            self.k = data.get("k", 5)
            self.graph_max_hops = data.get("graph_max_hops", 2)
            self.rrf_k = data.get("rrf_k", 60)

    class Generation:
        def __init__(self, data):
            self.temperature = data.get("temperature", 0.0)
            self.max_tokens = data.get("max_tokens", 2048)
            self.top_p = data.get("top_p", 1.0)
            self.reasoning_effort = data.get("reasoning_effort", "default")
            self.stream = data.get("stream", False)
            
            # Chuẩn hóa giá trị stop từ config.yaml
            stop_val = data.get("stop", None)
            if isinstance(stop_val, str) and stop_val.strip().lower() in ["none", "null", ""]:
                self.stop = None
            else:
                self.stop = stop_val

    class LLM:
        class ProviderCatalog:
            def __init__(self, data):
                self.available = data.get("available", [])

        def __init__(self, data):
            # Model active cho router và qa
            self.router = data.get("router", {})
            self.qa = data.get("qa", {})
            
            # Catalog model của từng nhà cung cấp dạng Object
            self.google = self.ProviderCatalog(data.get("google", {}))
            self.groq = self.ProviderCatalog(data.get("groq", {}))
            self.openrouter = self.ProviderCatalog(data.get("openrouter", {}))
            
            # Giữ lại catalog dict cũ để tương thích ngược nếu cần
            self.catalog = {
                "google": self.google.available,
                "groq": self.groq.available,
                "openrouter": self.openrouter.available
            }

    class Embedding:
        def __init__(self, data):
            self.available = data.get("available", [])
            self.active = data.get("active", "nvidia/llama-nemotron-embed-vl-1b-v2:free")

    def __init__(self, raw_yaml):
        self.chunking = self.Chunking(raw_yaml.get("chunking", {}))
        self.retrieval = self.Retrieval(raw_yaml.get("retrieval", {}))
        self.generation = self.Generation(raw_yaml.get("generation", {}))
        self.llm = self.LLM(raw_yaml.get("llm", {}))
        self.embedding = self.Embedding(raw_yaml.get("embedding", {}))

# Hàm helper đọc file YAML và khởi tạo đối tượng AppConfig
def load_config(config_path: str = DEFAULT_CONFIG_PATH) -> AppConfig:
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Không tìm thấy file cấu hình tại {config_path}")
        
    with open(config_path, "r", encoding="utf-8") as f:
        raw_yaml = yaml.safe_load(f)
    return AppConfig(raw_yaml)

# Tạo một thực thể (instance) config dùng chung toàn cục
config = load_config()
