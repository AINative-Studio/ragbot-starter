---
description: ZeroDB event streaming - publish and process real-time events with RedPanda
---

# ZeroDB Event Operations

Available operations:

1. **Publish event**
   - Event type (category/classification)
   - Event data (JSON object):
     * action performed
     * user_id
     * resource_id
     * custom fields
   - Timestamp (ISO 8601)
   - Partition key (optional, for ordering)
   - Topic (optional, default: "default")

2. **Subscribe to events**
   - Topic name
   - Consumer group
   - Callback function for processing

3. **List event topics**
   - View all available event topics
   - Topic statistics

4. **Get event statistics**
   - Total events published
   - Events by type
   - Events per time period
   - Topic usage

Event streaming features:
- Real-time event processing
- Guaranteed delivery
- Event ordering by partition key
- Multiple consumer groups
- Event replay capability
- High throughput (100K+ events/month on Free tier)

Use cases:
- User activity tracking
- System audit logs
- Real-time analytics
- Event-driven workflows
- Integration webhooks
- Change data capture

Current project limits: 100,000 events/month (Free tier)

Current project ID: 0ae4e639-d44b-43f2-9688-8f5f79157253

Which operation would you like to perform?
