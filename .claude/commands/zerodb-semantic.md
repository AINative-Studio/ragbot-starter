---
description: ZeroDB advanced semantic search with hybrid scoring and multiple providers
---

# ZeroDB Semantic Search

Available operations:

1. **Semantic search**
   - Query (natural language text)
   - Search type:
     * semantic - Embedding-based similarity
     * keyword - Traditional text search
     * hybrid - Combines semantic + keyword
   - Boost factors (optional):
     * recency (1.0-2.0)
     * popularity (1.0-2.0)
     * custom_score (1.0-2.0)
   - Filters (optional):
     * category
     * date_range
     * tags
     * metadata fields
   - Top K results
   - Minimum score threshold

2. **Multi-metric similarity analysis**
   - Vector A
   - Vector B
   - Metrics to compute:
     * cosine
     * euclidean
     * pearson
     * jaccard
     * manhattan
     * hamming
     * angular
   - Returns scores for all selected metrics

Search features:
- Multiple embedding providers support
- Hybrid search combining vector + keyword
- Boosting by recency, popularity, custom scores
- Advanced filtering on metadata
- Re-ranking algorithms
- Query expansion
- Semantic clustering

Use cases:
- Intelligent document search
- Product recommendations
- Similar content discovery
- Question answering
- Knowledge base search
- Customer support automation

Current project ID: 0ae4e639-d44b-43f2-9688-8f5f79157253

Which operation would you like to perform?
