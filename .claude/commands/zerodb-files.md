---
description: ZeroDB file operations - upload, list, download, delete files with S3-compatible storage
---

# ZeroDB File Operations

Available operations:

1. **Upload file metadata**
   - Filename
   - File size (bytes)
   - Content type (MIME type)
   - Metadata (optional JSON):
     * category
     * tags
     * description
     * custom fields

2. **List files**
   - Pagination (skip, limit)
   - Filters (optional)

3. **Get file metadata**
   - File ID

4. **Download file**
   - File ID
   - Returns file content

5. **Delete file**
   - File ID
   - Permanent deletion

6. **Generate presigned URL**
   - File ID
   - Expiration time (seconds, default: 3600)
   - Operation (download/upload)

7. **Get storage statistics**
   - Total files
   - Total storage used
   - Storage by type
   - Usage vs tier limits

Storage limit: 1 GB (Free tier)

Current project ID: 0ae4e639-d44b-43f2-9688-8f5f79157253

Which operation would you like to perform?
