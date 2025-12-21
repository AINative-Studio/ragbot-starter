---
description: Manage AI agent memory - store and search persistent context for AI agents
---

# ZeroDB Memory Management

Available operations:

1. **Store memory**
   - Content (text to remember)
   - Metadata (optional):
     * user_id
     * session_id
     * importance (high, medium, low)
     * role (user, assistant, system)
   - Tags (array of strings for categorization)

2. **Search memory**
   - Query text (natural language)
   - Limit (number of results, default: 20)
   - Filters (optional metadata filters)
   - Similarity threshold (0-1, default: 0.7)

Use cases:
- Store user preferences across sessions
- Remember conversation context
- Build knowledge bases for agents
- Track important facts and decisions
- Maintain long-term agent memory

Current project ID: 0ae4e639-d44b-43f2-9688-8f5f79157253

Which operation would you like to perform?
