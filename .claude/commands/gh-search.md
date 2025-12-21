---
description: GitHub search operations - search repositories, code, issues, users, commits
---

# GitHub Search

Available operations:

1. **Search repositories**
   - Query (keywords, qualifiers)
   - Filters:
     * Language
     * Stars range
     * Forks range
     * Topics
     * License
     * Created/updated date
     * User/org
   - Sort (stars, forks, updated)

2. **Search code**
   - Query (code content)
   - Filters:
     * Repository
     * Language
     * File path
     * File extension
     * File size
     * User/org
   - Sort (indexed)

3. **Search issues and pull requests**
   - Query
   - Filters:
     * State (open, closed)
     * Type (issue, pr)
     * Repository
     * Author
     * Assignee
     * Labels
     * Created/updated date
   - Sort (created, updated, comments)

4. **Search users**
   - Query (username, name)
   - Filters:
     * Account type
     * Followers range
     * Repositories range
     * Location
     * Language
     * Created date
   - Sort (followers, repositories, joined)

5. **Search commits**
   - Query
   - Filters:
     * Author
     * Committer
     * Author date
     * Committer date
     * Repository
     * Organization
   - Sort (author-date, committer-date)

6. **Search topics**
   - Query (topic name)
   - Filter by repositories count

7. **Search labels**
   - Repository
   - Query (label name)

Advanced search qualifiers:
- `in:name,description,readme` - Search in specific fields
- `stars:>1000` - Filter by stars
- `language:python` - Filter by language
- `created:>2024-01-01` - Filter by date
- `user:username` - Filter by user
- `org:orgname` - Filter by organization
- `is:public` - Public repositories only
- `archived:false` - Exclude archived repos

Which operation would you like to perform?
