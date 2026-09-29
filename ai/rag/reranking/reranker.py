class Reranker:
    def rerank(self, query: str, documents: list[dict], top_k: int = 5) -> list[dict]:
        return documents[:top_k]
