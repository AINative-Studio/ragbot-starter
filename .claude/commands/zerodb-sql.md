---
description: Execute SQL queries directly on ZeroDB PostgreSQL with security validation
---

# ZeroDB SQL Query Execution

Execute SQL queries against your dedicated PostgreSQL instance with built-in security.

Available operations:

1. **Execute SQL query**
   - SQL query string
   - Timeout (default: 30s, max: 300s)
   - Read-only mode (true for SELECT only)
   - Max rows (limit result set size)

Query types supported:
- SELECT (read data)
- INSERT (add data)
- UPDATE (modify data)
- DELETE (remove data)
- CREATE/ALTER TABLE (schema changes)
- Complex queries with JOINs, aggregations, CTEs

Security features:
- SQL injection prevention
- Dangerous command blocking (DROP DATABASE, etc.)
- Timeout enforcement
- Rate limiting (100 queries/min per user)
- Read-only mode for analytics

Examples:
```sql
-- SELECT query
SELECT * FROM users WHERE created_at > NOW() - INTERVAL '1 day'

-- INSERT query
INSERT INTO users (email, name) VALUES ('user@example.com', 'John Doe')

-- UPDATE query
UPDATE users SET last_login = NOW() WHERE email = 'user@example.com'

-- Analytics query
SELECT DATE(created_at) as date, COUNT(*) as signups
FROM users
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
```

Current project ID: 0ae4e639-d44b-43f2-9688-8f5f79157253

Enter your SQL query:
