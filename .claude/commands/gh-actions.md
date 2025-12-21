---
description: GitHub Actions operations - manage workflows, runs, artifacts, secrets
---

# GitHub Actions Management

Available operations:

1. **List workflows**
   - Repository (owner/repo)
   - View all workflow files

2. **Get workflow details**
   - Repository
   - Workflow ID or filename

3. **List workflow runs**
   - Repository
   - Workflow ID (optional)
   - Filters:
     * Status (queued, in_progress, completed)
     * Conclusion (success, failure, cancelled)
     * Branch
     * Event type
     * Created date

4. **Get workflow run**
   - Repository
   - Run ID
   - View detailed run information

5. **Re-run workflow**
   - Repository
   - Run ID
   - Re-run failed jobs or all jobs

6. **Cancel workflow run**
   - Repository
   - Run ID

7. **Delete workflow run**
   - Repository
   - Run ID

8. **Download workflow logs**
   - Repository
   - Run ID
   - Save logs locally

9. **List workflow run jobs**
   - Repository
   - Run ID

10. **Get job details**
    - Repository
    - Job ID
    - View logs and steps

11. **List artifacts**
    - Repository
    - Run ID (optional)

12. **Download artifact**
    - Repository
    - Artifact ID
    - Save to local path

13. **Delete artifact**
    - Repository
    - Artifact ID

14. **Trigger workflow dispatch**
    - Repository
    - Workflow ID
    - Inputs (JSON object)
    - Branch reference

15. **List repository secrets**
    - Repository
    - View secret names (not values)

16. **Create or update secret**
    - Repository
    - Secret name
    - Secret value (encrypted)

17. **Delete secret**
    - Repository
    - Secret name

18. **List environment secrets**
    - Repository
    - Environment name

19. **Get workflow usage**
    - Repository
    - Workflow ID
    - View execution statistics

Which operation would you like to perform?
