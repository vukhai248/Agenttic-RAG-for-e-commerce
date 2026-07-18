import chromadb
from typing import List, Dict, Any, Optional
from configs.setting import settings

class ChromaVectorDatabase:
    """Class for managing ChromaDB vector database operations."""
    
    def __init__(self, persist_directory: str = None):
        self.persist_directory = persist_directory or settings.vector_db_absolute_path
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self._collections = {}
    
    def get_or_create_collection(self, name: str):
        """Get or create a collection by name."""
        if name not in self._collections:
            self._collections[name] = self.client.get_or_create_collection(name=name)
        return self._collections[name]
    
    def add_documents(
        self,
        collection_name: str,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: List[Dict[str, Any]]
    ):
        """Add documents to a collection."""
        collection = self.get_or_create_collection(collection_name)
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
    
    def list_collections(self):
        """List all collections in the database."""
        return self.client.list_collections()
    
    def get_collection(self, name: str):
        """Get a specific collection by name."""
        return self.client.get_collection(name=name)
    
    def count_documents(self, collection_name: str) -> int:
        """Count documents in a collection."""
        collection = self.get_or_create_collection(collection_name)
        return collection.count()
