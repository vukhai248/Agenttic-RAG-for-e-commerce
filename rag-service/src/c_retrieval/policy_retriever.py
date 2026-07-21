from .base_retriever import BaseRetriever

class PolicyRetriever(BaseRetriever):
    def __init__(self, config, settings):
        super().__init__(
            config=config,
            settings=settings,
            collection_name="policies_collection",
            k_query=config.retrieval.policy.k_query,  
            k_rerank=config.retrieval.policy.k_rerank 
        )
