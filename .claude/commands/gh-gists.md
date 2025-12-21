---
description: GitHub Gist operations - create, list, update, delete, fork, star gists
---

# GitHub Gist Management

Available operations:

1. **List gists**
   - User (authenticated user or specific username)
   - Filter:
     * Public gists
     * Starred gists
     * All gists (if authenticated)
   - Since date

2. **Get gist**
   - Gist ID
   - View full gist details

3. **Get gist revision**
   - Gist ID
   - Revision SHA
   - View specific version

4. **Create gist**
   - Files (one or more):
     * Filename
     * Content
   - Description
   - Public (true/false)

5. **Update gist**
   - Gist ID
   - Update description
   - Add/modify/delete files

6. **Delete gist**
   - Gist ID

7. **Fork gist**
   - Gist ID
   - Create a copy

8. **List gist forks**
   - Gist ID
   - View all forks

9. **Star gist**
   - Gist ID

10. **Unstar gist**
    - Gist ID

11. **Check if gist is starred**
    - Gist ID

12. **List gist comments**
    - Gist ID

13. **Create gist comment**
    - Gist ID
    - Comment body

14. **Update gist comment**
    - Gist ID
    - Comment ID
    - New body

15. **Delete gist comment**
    - Gist ID
    - Comment ID

16. **List gist commits**
    - Gist ID
    - View revision history

Example gist creation:
```javascript
{
  "description": "Example code snippet",
  "public": true,
  "files": {
    "example.js": {
      "content": "console.log('Hello World');"
    },
    "README.md": {
      "content": "# Example\nThis is an example gist"
    }
  }
}
```

Which operation would you like to perform?
