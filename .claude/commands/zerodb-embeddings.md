---
description: ZeroDB embeddings API - generate 384-dimension embeddings, embed and store documents, semantic search
---

# ZeroDB Embeddings API

Model: BAAI/bge-small-en-v1.5 (HuggingFace)
Dimensions: 384
Performance: < 100ms per text
Cost: FREE (self-hosted on Railway)

Available operations:

1. **Generate embeddings**
   - Array of texts to embed (max 100 per request)
   - Returns embeddings without storing them
   - Use for one-time comparisons or external storage

2. **Embed and store**
   - Documents array with:
     * id (unique identifier)
     * text (content to embed)
     * metadata (optional JSON)
   - Namespace (optional, default: "default")
   - Upsert mode (update existing vectors)
   - Automatically generates embeddings and stores in vector DB
   - Perfect for building RAG systems

3. **Semantic search**
   - Query (natural language text)
   - Top K results (default: 10, max: 100)
   - Namespace (optional)
   - Metadata filters (optional)
   - Similarity threshold (0-1, default: 0.0)
   - Include metadata (default: true)
   - Include embeddings (default: false)
   - Automatically embeds query and performs similarity search

Best practices:
- Batch up to 100 texts per request
- Use namespaces to organize document types
- Add rich metadata for better filtering
- Keep text chunks under 8,000 characters
- Use similarity threshold 0.7+ for high-quality matches

Current project ID: 0ae4e639-d44b-43f2-9688-8f5f79157253

Which operation would you like to perform?
