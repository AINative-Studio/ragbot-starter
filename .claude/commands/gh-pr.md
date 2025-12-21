---
description: GitHub pull request operations - create, list, review, merge, comment, request changes
---

# GitHub Pull Request Management

Available operations:

1. **List pull requests**
   - Repository (owner/repo)
   - Filters:
     * State (open, closed, all)
     * Base branch
     * Head branch
     * Sort (created, updated, popularity)

2. **Get pull request details**
   - Repository and PR number
   - View full PR information

3. **Create pull request**
   - Repository
   - Title
   - Body (description)
   - Head branch (source)
   - Base branch (target)
   - Draft mode (optional)
   - Reviewers (optional)
   - Assignees (optional)

4. **Update pull request**
   - PR number
   - Title
   - Body
   - State (open/closed)
   - Base branch

5. **Close pull request**
   - PR number
   - Closing comment (optional)

6. **Reopen pull request**
   - PR number

7. **Merge pull request**
   - PR number
   - Merge method:
     * merge (merge commit)
     * squash (squash and merge)
     * rebase (rebase and merge)
   - Commit title
   - Commit message

8. **List PR reviews**
   - PR number
   - View all review comments

9. **Create PR review**
   - PR number
   - Review body
   - Review event:
     * APPROVE
     * REQUEST_CHANGES
     * COMMENT

10. **Submit PR review**
    - Review ID
    - Review decision

11. **List PR comments**
    - PR number
    - Include review comments

12. **Add PR comment**
    - PR number
    - Comment text
    - Specific line/file (optional)

13. **Request reviewers**
    - PR number
    - Reviewer usernames

14. **Get PR files**
    - PR number
    - View changed files

15. **Get PR commits**
    - PR number
    - List all commits

16. **Check if PR is merged**
    - PR number

17. **Enable auto-merge**
    - PR number
    - Merge method

18. **Disable auto-merge**
    - PR number

Which operation would you like to perform?
