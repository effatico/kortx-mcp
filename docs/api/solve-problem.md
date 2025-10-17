# solve-problem

Expert debugging and problem-solving assistance with root cause analysis, diagnosis steps, proposed solutions, and prevention strategies.

---

## Quick Start

Get debugging help in seconds:

```json
{
  "problem": "Users experiencing intermittent 500 errors when uploading large files (>10MB)",
  "errorMessages": ["Request Entity Too Large", "ETIMEDOUT: Socket timeout"],
  "relevantCode": "Node.js Express API behind nginx reverse proxy"
}
```

The tool returns root cause analysis, diagnosis steps, solutions, testing guidance, and prevention strategies.

---

## How to Use

Choose your depth based on your needs:

<details open>
<summary><strong>Minimal</strong> - Quick diagnosis (30 seconds)</summary>

**When to use**: You have a clear error and need quick troubleshooting steps.

**Example**:

```json
{
  "problem": "Database queries timing out after 5 seconds"
}
```

**What you get**: Likely causes and immediate debugging steps.

</details>

<details>
<summary><strong>Standard</strong> - Comprehensive debugging (recommended)</summary>

**When to use**: Production issues that need thorough investigation.

**Example**:

```json
{
  "problem": "Memory usage growing continuously until server crashes",
  "errorMessages": ["JavaScript heap out of memory"],
  "relevantCode": "Node.js API server, runs fine for 2-3 hours then crashes",
  "attemptedSolutions": [
    "Increased heap size to 4GB",
    "Added memory profiling",
    "Checked for event listener leaks"
  ]
}
```

**What you get**:

- Root cause analysis with contributing factors
- Step-by-step diagnosis commands
- Immediate and long-term solutions
- Testing and verification guidance
- Prevention strategies

</details>

<details>
<summary><strong>Advanced</strong> - Complex system debugging</summary>

**When to use**: Distributed system issues, performance problems, or critical production outages.

**Example**:

```json
{
  "problem": "Microservices experiencing cascading failures during high load, some requests timeout while others succeed",
  "errorMessages": [
    "Connection pool exhausted",
    "Circuit breaker open",
    "Downstream service unavailable"
  ],
  "relevantCode": "5 microservices (auth, products, orders, payments, shipping) on Kubernetes, using gRPC, Redis cache, PostgreSQL",
  "attemptedSolutions": [
    "Increased connection pool sizes",
    "Added circuit breakers with Hystrix",
    "Scaled pods horizontally",
    "Added Redis caching layer"
  ]
}
```

**What you get**:

- Comprehensive distributed systems analysis
- Detailed dependency chain investigation
- Multiple solution approaches (immediate fixes, architectural improvements)
- Load testing and chaos engineering recommendations
- Full observability and monitoring setup
- SRE-grade prevention strategies

</details>

---

<details>
<summary><strong>API Reference</strong></summary>

### Parameters

| Parameter            | Type     | Required | Description                                                            |
| -------------------- | -------- | -------- | ---------------------------------------------------------------------- |
| `problem`            | string   | Yes      | Description of the problem (50-500 words recommended)                  |
| `errorMessages`      | string[] | No       | Exact error messages or stack traces                                   |
| `relevantCode`       | string   | No       | Code snippets, system architecture, tech stack                         |
| `attemptedSolutions` | string[] | No       | What you've already tried                                              |
| `preferredModel`     | enum     | No       | GPT model: `gpt-5`, `gpt-5-mini`, `gpt-5-nano` (default: `gpt-5-mini`) |

### Response Structure

The tool returns structured debugging assistance:

1. **Root Cause Analysis** - Why it's happening
2. **Diagnosis Steps** - How to verify the cause
3. **Proposed Solutions** - Immediate and long-term fixes
4. **Testing Guidance** - How to verify the fix works
5. **Prevention Strategies** - How to avoid recurrence

</details>

## Common Use Cases

### Production Errors

Debug live issues with root cause analysis and immediate fixes.

### Performance Problems

Identify bottlenecks and optimize system performance.

### Integration Failures

Troubleshoot issues between services and external systems.

### Memory Leaks

Find and fix memory issues before they crash your system.

---

## Example: File Upload Errors

<details>
<summary>View full example with solutions</summary>

**Input:**

```json
{
  "problem": "Users experiencing intermittent 500 errors when uploading large files (>10MB)",
  "errorMessages": ["Request Entity Too Large", "ETIMEDOUT: Socket timeout"],
  "relevantCode": "Node.js Express API behind nginx reverse proxy",
  "attemptedSolutions": [
    "Increased server memory to 8GB",
    "Checked disk space (plenty available)",
    "Increased nginx timeout to 60s",
    "App timeout to 30s"
  ]
}
```

**Response Summary:**

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

</details>

---

## Best Practices

<details>
<summary><strong>How to Get Better Debugging Help</strong></summary>

### Include Error Messages

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
  "relevantCode": "AWS RDS PostgreSQL db.t3.medium (2 vCPU, 4GB RAM), ~1000 req/min, 50GB data"
}
```

</details>

---

## Related Tools

- **[think-about-plan](./think-about-plan.md)** - Plan fixes or architectural improvements
- **[suggest-alternative](./suggest-alternative.md)** - Explore different solution approaches
- **[improve-copy](./improve-copy.md)** - Refine error messages and documentation

---

## Next Steps

- 📖 [think-about-plan](./think-about-plan.md) - Plan strategic implementations
- 📖 [suggest-alternative](./suggest-alternative.md) - Explore alternatives
- 📖 [improve-copy](./improve-copy.md) - Polish your messaging
- 🔧 [Configuration Guide](../configuration.md) - Customize behavior

---

## Getting Help

- 💬 [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)
- 🐛 [Report an Issue](https://github.com/effatico/kortx-mcp/issues)
