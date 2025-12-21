---
description: Manage dedicated PostgreSQL instances - provision, scale, backup, and monitor
---

# ZeroDB Dedicated PostgreSQL Management

Available operations:

## Instance Provisioning
1. **Provision new PostgreSQL instance**
   - Instance size:
     * micro-1: 1 vCPU, 1GB RAM, 10GB storage ($15/mo)
     * standard-2: 2 vCPU, 4GB RAM, 50GB storage ($45/mo)
     * standard-4: 4 vCPU, 8GB RAM, 100GB storage ($75/mo)
     * performance-8: 8 vCPU, 16GB RAM, 200GB storage ($150/mo)
     * performance-16: 16 vCPU, 32GB RAM, 500GB storage ($300/mo)
   - Database name
   - PostgreSQL version (15, 14, 13)
   - Storage size (GB)
   - Max connections
   - Backup settings

## Instance Management
2. **Get instance status**
   - Instance ID
   - View running status, uptime, connections

3. **Get connection details**
   - Instance ID
   - Host, port, database name, credentials
   - Connection string
   - SSL requirements

4. **Get usage analytics**
   - Instance ID
   - Period (7d, 30d, 90d)
   - Query breakdown, performance metrics, billing

5. **Scale instance**
   - Instance ID
   - New size
   - Scale immediately or scheduled

6. **Update configuration**
   - Instance ID
   - PostgreSQL settings:
     * max_connections
     * shared_buffers
     * effective_cache_size
     * maintenance_work_mem

7. **Create backup**
   - Instance ID
   - Backup name
   - Include data
   - Compression

8. **Delete instance**
   - Instance ID
   - Confirm deletion
   - Create final backup option

Features:
- Direct SQL access via any PostgreSQL client
- Full extension library (pgvector, pg_stat_statements)
- Custom configurations
- Automated backups (30-day retention)
- SSL/TLS encryption
- Dedicated compute resources

Current project ID: 0ae4e639-d44b-43f2-9688-8f5f79157253

Which operation would you like to perform?
