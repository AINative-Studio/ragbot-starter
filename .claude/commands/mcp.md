---
description: MCP server status and available operations for ZeroDB and GitHub
---

# MCP Server Status & Operations

## Connected MCP Servers

### ✓ ZeroDB MCP Server
- **Status:** Connected
- **Package:** ainative-zerodb-mcp-server v2.0.8
- **Operations:** 60+ ZeroDB operations
- **Model:** BAAI/bge-small-en-v1.5 (384 dimensions)
- **Project:** New Project (0ae4e639-d44b-43f2-9688-8f5f79157253)

**Capabilities:**
- Vector operations (upsert, search, quantum)
- Embeddings generation & semantic search
- NoSQL tables & SQL queries
- File storage (S3-compatible)
- Event streaming (RedPanda)
- Agent memory & RLHF data
- Dedicated PostgreSQL instances

### ✓ GitHub MCP Server
- **Status:** Connected
- **Endpoint:** https://api.githubcopilot.com/mcp/
- **Authentication:** Bearer token (GitHub PAT)

**Capabilities:**
- Repository management
- Issue & PR operations
- Branch & commit operations
- File operations
- GitHub Actions
- Releases & webhooks
- User & organization management
- Search & discovery

## Quick Start

### ZeroDB Commands
Use `/zerodb` to see all ZeroDB operations, or:
- `/zerodb-embeddings` - Generate embeddings & semantic search
- `/zerodb-vectors` - Vector operations
- `/zerodb-memory` - AI agent memory
- `/zerodb-sql` - SQL queries

### GitHub Commands
Use `/github` to see all GitHub operations, or:
- `/gh-repo` - Repository operations
- `/gh-pr` - Pull requests
- `/gh-issues` - Issue tracking
- `/gh-actions` - CI/CD workflows

## Configuration Files
- `.env` - Contains all credentials
- `.claude/commands/` - All slash commands

## Resources
- **ZeroDB Docs:** https://docs.ainative.studio
- **ZeroDB API:** https://api.ainative.studio/docs
- **GitHub Docs:** https://docs.github.com
