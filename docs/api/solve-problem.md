# solve-problem API Documentation

Debug and problem-solving assistance with root cause analysis and solutions.

---

## Overview

The `solve-problem` tool provides expert debugging and problem-solving assistance. It performs root cause analysis, provides diagnosis steps, proposes solutions, and suggests prevention strategies.

**Use this tool when:**

- Debugging production issues
- Investigating errors or failures
- Performance problems
- Unexpected behavior
- System outages

---

## API Signature

```typescript
tool("solve-problem", {
  problem: string;        // Description of the problem
  context?: string;       // System context, error messages, logs (optional)
  tried_solutions?: string; // What you've already tried (optional)
})
```

---

## Parameters

### `problem` (required)

Description of the problem you're experiencing.

- **Type**: String
- **Required**: Yes
- **Recommended length**: 50-500 words

### `context` (optional)

Additional context: error messages, logs, system information.

- **Type**: String
- **Required**: No

### `tried_solutions` (optional)

What you've already tried to fix the problem.

- **Type**: String
- **Required**: No

---

## Response Format

Returns a structured problem analysis:

1. **Root Cause Analysis**
   - Likely causes
   - Contributing factors
   - Why it's happening

2. **Diagnosis Steps**
   - How to verify the root cause
   - What to check
   - Commands to run

3. **Proposed Solutions**
   - Immediate fixes
   - Long-term solutions
   - Priority order

4. **Testing Guidance**
   - How to verify the fix
   - What to monitor

5. **Prevention Strategies**
   - How to prevent recurrence
   - Monitoring recommendations
   - Process improvements

---

## Example Usage

### Example 1: File Upload Errors

**Input:**

```json
{
  "problem": "Users experiencing intermittent 500 errors when uploading large files (>10MB)",
  "context": "Error: Request Entity Too Large, ETIMEDOUT: Socket timeout. Node.js Express API, nginx reverse proxy",
  "tried_solutions": "Increased server memory to 8GB, checked disk space (plenty available), increased nginx timeout to 60s, app timeout to 30s"
}
```

**Response:**

````markdown
## Root Cause Analysis

**Primary Cause**: Timeout mismatch and proxy buffer configuration

The issue has multiple contributing factors:

1. **Nginx timeout > App timeout (60s > 30s)**: When app times out first, nginx waits unnecessarily
2. **Missing client_max_body_size**: Default 1MB in nginx blocks large files
3. **Proxy buffer settings**: Default buffers may be insufficient for large uploads
4. **Possible memory issue**: Not in the app, but in nginx proxy buffering

## Diagnosis Steps

1. **Check nginx config**:
   ```bash
   nginx -T | grep -E "(client_max_body_size|proxy_read_timeout|client_body_temp)"
   ```
````

2. **Check actual upload size limit**:

   ```bash
   curl -X POST -H "Content-Type: multipart/form-data" \
        -F "file=@test-15mb.file" \
        https://yourapi.com/upload -v
   ```

3. **Monitor nginx error log during upload**:

   ```bash
   tail -f /var/log/nginx/error.log
   ```

4. **Check if issue is nginx or app**:
   - Temporarily bypass nginx, upload directly to app
   - If works: nginx config issue
   - If fails: app issue

## Proposed Solutions

### Immediate Fix (nginx configuration)

```nginx
# /etc/nginx/nginx.conf or site config
http {
    client_max_body_size 50M;  # Allow up to 50MB uploads
    client_body_timeout 120s;   # 2 minute client upload timeout
    client_body_buffer_size 128k;
    client_body_temp_path /var/nginx/client_temp;
}

server {
    location /upload {
        proxy_read_timeout 120s;  # Match or exceed app timeout
        proxy_request_buffering off;  # Stream upload to app
        proxy_pass http://app;
    }
}
```

### App-side Fix (Express)

```javascript
const express = require('express');
const multer = require('multer');

const app = express();

// Increase limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure multer with disk storage (not memory)
const upload = multer({
  dest: '/tmp/uploads',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Increase server timeout
const server = app.listen(3000);
server.timeout = 120000; // 2 minutes
```

### Long-term Solution

**Use direct S3/cloud storage uploads**:

1. Client requests presigned URL from API
2. Client uploads directly to S3
3. Client notifies API of completion
4. Benefits: No timeout, no server load, better UX

## Testing Guidance

1. **Test with various file sizes**:
   - 5MB, 10MB, 25MB, 50MB
   - Verify success rate

2. **Load test**:

   ```bash
   # 10 concurrent uploads of 15MB files
   seq 1 10 | xargs -P 10 -I {} curl -X POST \
       -F "file=@test-15mb.file" https://yourapi.com/upload
   ```

3. **Monitor during test**:
   - CPU usage (should stay < 70%)
   - Memory usage
   - Disk I/O
   - nginx/app response times

4. **Check logs for errors**:
   ```bash
   # During test
   tail -f /var/log/nginx/error.log
   tail -f /path/to/app/logs/app.log
   ```

## Prevention Strategies

1. **Add monitoring**:
   - Alert on 500 errors > 1% of requests
   - Track upload success rate
   - Monitor P95/P99 upload times

2. **Add upload progress indicator**:
   - Show users upload is progressing
   - Reduces user frustration on slow uploads

3. **Implement retry logic**:

   ```javascript
   // Client-side exponential backoff retry
   async function uploadWithRetry(file, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await upload(file);
       } catch (err) {
         if (i === maxRetries - 1) throw err;
         await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
       }
     }
   }
   ```

4. **Add request ID tracking**:
   - Generate request ID on client
   - Pass through all systems
   - Makes debugging much easier

5. **Consider CDN/edge uploads**:
   - CloudFront, Fastly for better upload performance
   - Reduces distance to upload endpoint
   - Better reliability

6. **Document timeout chain**:
   ```
   Client → nginx (120s) → App (120s) → External API (30s)
   ```
   Ensure each timeout > downstream timeout

## Quick Checklist

- [ ] Set client_max_body_size in nginx
- [ ] Align all timeouts (nginx ≥ app timeout)
- [ ] Use disk storage, not memory, for uploads
- [ ] Add monitoring for upload failures
- [ ] Test with actual large files
- [ ] Document timeout configuration

````

---

## Best Practices

### 1. Include Error Messages

Exact error messages help identify the issue:

```json
{
  "problem": "Database queries timing out",
  "context": "Error: 'connection timeout after 5000ms'. PostgreSQL 13, 100GB database, query: SELECT * FROM users WHERE created_at > '2024-01-01'"
}
````

### 2. Describe What You've Tried

Prevents suggesting solutions you've already attempted:

```json
{
  "tried_solutions": "Added index on created_at, increased connection pool to 20, checked for long-running queries"
}
```

### 3. Provide System Context

Helps understand constraints:

```json
{
  "context": "AWS RDS PostgreSQL db.t3.medium (2 vCPU, 4GB RAM), ~1000 req/min, 50GB data"
}
```

---

## Common Use Cases

- Production errors and outages
- Performance degradation
- Memory leaks
- Database issues
- Network problems
- Integration failures

---

## Related Tools

- **think-about-plan**: Plan fixes or improvements
- **suggest-alternative**: Explore different solutions

---

## Next Steps

- 📖 [Full API Documentation](./README.md)
- 🎯 [Example Workflows](../../examples/)

---

## Getting Help

- 💬 [GitHub Discussions](https://github.com/amsv01/mcp-consultant/discussions)
- 🐛 [Report an Issue](https://github.com/amsv01/mcp-consultant/issues)
