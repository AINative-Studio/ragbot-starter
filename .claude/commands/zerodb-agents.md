---
description: ZeroDB agent logging - track AI agent actions, performance, and behavior
---

# ZeroDB Agent Log Operations

Available operations:

1. **Store agent log**
   - Agent ID (unique identifier)
   - Action (what the agent did)
   - Result (outcome/data):
     * status (success/failure)
     * data returned
     * error messages
   - Execution time (milliseconds)
   - Metadata (optional):
     * session_id
     * user_id
     * context

2. **List agent logs**
   - Pagination (skip, limit)
   - Filters:
     * agent_id
     * session_id
     * date range
     * status

3. **Get agent log**
   - Log ID
   - View detailed log entry

4. **Delete agent log**
   - Log ID
   - Remove specific log entry

5. **Get agent statistics**
   - Total actions by agent
   - Success/failure rates
   - Average execution times
   - Most common actions

6. **List active agents**
   - View all agents that have logged actions
   - Agent activity summary

7. **List agent traces**
   - View complete execution traces
   - Session-based grouping
   - Timeline visualization

8. **Export agent logs**
   - Format (json, csv)
   - Filter by agent_id or session_id
   - Date range export

Use cases:
- Debug agent behavior
- Monitor agent performance
- Track agent decisions
- Audit agent actions
- Analyze agent patterns

Current project ID: 0ae4e639-d44b-43f2-9688-8f5f79157253

Which operation would you like to perform?
