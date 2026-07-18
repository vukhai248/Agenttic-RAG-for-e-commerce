import os
import yaml
from pathlib import Path

# Thư mục gốc (rag-service/)
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = os.path.join(BASE_DIR, "configs", "config.yaml")

class AppConfig:
    def __init__(self, raw_yaml):
        # 1. Tham số Chunking
        chunking_sec = raw_yaml.get("chunking", {})
        self.chunk_size = chunking_sec.get("chunk_size", 1000)
        self.chunk_overlap = chunking_sec.get("chunk_overlap", 200)
        
        # 2. Tham số Retrieval
        retrieval_sec = raw_yaml.get("retrieval", {})
        self.k = retrieval_sec.get("k", 5)
        self.graph_max_hops = retrieval_sec.get("graph_max_hops", 2)
        self.rrf_k = retrieval_sec.get("rrf_k", 60)
        
        # 3. Tham số Generation
        generation_sec = raw_yaml.get("generation", {})
        self.temperature = generation_sec.get("temperature", 0.0)
        self.max_tokens = generation_sec.get("max_tokens", 2048)

        # 4. Cấu hình LLM & Catalog
        llm_sec = raw_yaml.get("llm", {})
        self.router_provider = llm_sec.get("router", {}).get("provider", "groq")
        self.router_model = llm_sec.get("router", {}).get("model", "llama-3.3-70b-specdec")
        self.qa_provider = llm_sec.get("qa", {}).get("provider", "openrouter")
        self.qa_model = llm_sec.get("qa", {}).get("model", "google/gemini-2.5-flash")
        
        # Danh sách các model để benchmark
        self.llm_catalog = {
            "google": llm_sec.get("google", {}).get("available", []),
            "groq": llm_sec.get("groq", {}).get("available", []),
            "openrouter": llm_sec.get("openrouter", {}).get("available", [])
        }

        # 5. Cấu hình Embedding
        embedding_sec = raw_yaml.get("embedding", {})
        self.embedding_model = embedding_sec.get("active", "nvidia/llama-nemotron-embed-vl-1b-v2:free")
        self.embedding_catalog = embedding_sec.get("available", [])

# Hàm helper đọc file YAML và khởi tạo đối tượng AppConfig
def load_config(config_path: str = DEFAULT_CONFIG_PATH) -> AppConfig:
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Không tìm thấy file cấu hình tại {config_path}")
        
    with open(config_path, "r", encoding="utf-8") as f:
        raw_yaml = yaml.safe_load(f)
    return AppConfig(raw_yaml)

# Tạo một thực thể (instance) config dùng chung toàn cục
config = load_config()
