---
description: ZeroDB vector operations - upsert, batch upsert, advanced search with multiple similarity metrics
---

# ZeroDB Vector Operations

Available operations:

1. **Upsert vector**
   - Vector ID
   - Vector embedding (array of numbers)
   - Metadata (optional JSON)
   - Namespace (optional, default: "default")

2. **Batch upsert vectors**
   - Array of vectors with IDs, embeddings, and metadata
   - Efficient bulk operations (up to 1000 vectors)

3. **Advanced vector search**
   - Query vector (array of numbers)
   - Top K results (default: 10)
   - Namespace (optional)
   - Metadata filters (optional)
   - Similarity metric options:
     * cosine (default)
     * euclidean
     * manhattan
     * dot_product
     * jaccard
     * hamming
     * pearson
     * angular
   - Quantum enhanced (true/false)
   - Hybrid search (true/false)

4. **Quantum vector compression**
   - Vector to compress
   - Compression ratio (0-1)
   - Preserve semantics (true/false)

Current project: 0ae4e639-d44b-43f2-9688-8f5f79157253
Current limits: 10,000 max vectors (Free tier)

Which operation would you like to perform?
