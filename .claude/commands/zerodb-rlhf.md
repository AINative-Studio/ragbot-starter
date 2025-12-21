---
description: ZeroDB RLHF operations - collect feedback data for reinforcement learning from human feedback
---

# ZeroDB RLHF Operations

Available operations:

1. **Create RLHF dataset**
   - Prompt (input text)
   - Response A (first option)
   - Response B (second option)
   - Preference (A or B)
   - Metadata (optional):
     * model name
     * evaluation type
     * context

2. **Log RLHF interaction**
   - Type (user_feedback, agent_action, etc.)
   - Prompt (input text)
   - Response (model output)
   - Rating (1-5 or custom scale)
   - Metadata (optional)

3. **List RLHF interactions**
   - Pagination (skip, limit)
   - Filters (date range, rating, type)

4. **Get RLHF interaction**
   - Interaction ID
   - View detailed feedback data

5. **Update RLHF feedback**
   - Interaction ID
   - New rating
   - Comment

6. **Get RLHF statistics**
   - Total interactions
   - Average ratings
   - Preference distribution
   - Trends over time

7. **Export RLHF data**
   - Format (json, csv)
   - Date range filter
   - Export for model training

Use cases:
- Collect human feedback for model improvement
- A/B testing different responses
- Quality evaluation
- Training data generation
- Fine-tuning dataset creation

Current project ID: 0ae4e639-d44b-43f2-9688-8f5f79157253

Which operation would you like to perform?
