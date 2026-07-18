from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import Dict, Any, List


class ChunkingDocuments:
    """Class for chunking documents using RecursiveCharacterTextSplitter"""
    
    def __init__(self, config):
        """
        Initialize chunker with configuration.
        
        Args:
            config: Configuration object with chunk_size and chunk_overlap attributes
        """
        self.config = config

    def build_splitter(self):
        """
        Build and return a RecursiveCharacterTextSplitter instance.
        
        Returns:
            RecursiveCharacterTextSplitter configured with chunk_size, chunk_overlap, and separators
        """
        return RecursiveCharacterTextSplitter(
            chunk_size=self.config.chunk_size,
            chunk_overlap=self.config.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def chunk_policy(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Chunk a single policy/product document.
        
        Args:
            doc: Dictionary containing document with 'title' and 'content' keys
            
        Returns:
            List of chunked documents with id, document content, and metadata
        """
        policy_chunks = []
        
        # 1. Initialize splitter
        splitter = self.build_splitter()
        
        # 2. Combine title and content to preserve context before chunking
        doc_text = f"Tài liệu chính sách: {doc['title']}\nNội dung chi tiết:\n{doc['content']}"
        
        # 3. Use split_text on raw text string
        chunks = splitter.split_text(doc_text)

        # 4. Package chunk list
        for i, chunk_content in enumerate(chunks):
            policy_chunks.append({
                "id": f"policy_{doc['id']}_chunk_{i}",  
                "document": chunk_content,            
                "metadata": {
                    "policy_id": str(doc["id"]),
                    "title": str(doc["title"]),
                    "category": str(doc["category"]),
                    "chunk_index": int(i)
                }
            })
        return policy_chunks

    def chunk_multiple_policies(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Chunk multiple policy/product documents at once.
        
        Args:
            docs: List of document dictionaries
            
        Returns:
            List of all chunked documents from all input documents
        """
        all_chunks = []
        for doc in docs:
            all_chunks.extend(self.chunk_policy(doc))
        return all_chunks
