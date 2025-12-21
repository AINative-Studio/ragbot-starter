---
description: GitHub webhook operations - create, list, update, delete, test webhooks
---

# GitHub Webhook Management

Available operations:

1. **List repository webhooks**
   - Repository (owner/repo)
   - View all configured webhooks

2. **Get webhook**
   - Repository
   - Webhook ID
   - View webhook configuration

3. **Create webhook**
   - Repository
   - Payload URL
   - Content type (json, form)
   - Secret (optional)
   - Events to trigger:
     * push
     * pull_request
     * issues
     * release
     * star
     * fork
     * watch
     * workflow_run
     * And many more
   - Active (true/false)

4. **Update webhook**
   - Repository
   - Webhook ID
   - Update URL, events, active status

5. **Delete webhook**
   - Repository
   - Webhook ID

6. **Test webhook**
   - Repository
   - Webhook ID
   - Send test payload

7. **Ping webhook**
   - Repository
   - Webhook ID
   - Test connectivity

8. **List webhook deliveries**
   - Repository
   - Webhook ID
   - View delivery history

9. **Get webhook delivery**
   - Repository
   - Webhook ID
   - Delivery ID
   - View request/response details

10. **Redeliver webhook**
    - Repository
    - Webhook ID
    - Delivery ID
    - Retry failed delivery

11. **List organization webhooks**
    - Organization name

12. **Create organization webhook**
    - Organization name
    - Configuration (same as repo webhook)

Common webhook events:
- `push` - Git push
- `pull_request` - PR opened/closed/merged
- `issues` - Issue created/updated/closed
- `issue_comment` - Comments on issues/PRs
- `release` - Release published
- `workflow_run` - Actions workflow completed
- `star` - Repository starred
- `fork` - Repository forked
- `create` - Branch/tag created
- `delete` - Branch/tag deleted

Which operation would you like to perform?
