# Debugging Session Workflow

This example demonstrates using MCP Consultant to diagnose and solve complex technical problems.

## Scenario

Your production application is experiencing intermittent failures that are difficult to reproduce. You need expert debugging assistance.

## Workflow

### Step 1: Present the Problem

Provide comprehensive problem details:

**Query:**

```
@consultant solve this problem:

**Issue:** Users experiencing intermittent 500 errors when uploading files larger than 5MB.
Happens in production but not in development.

**Error Messages:**
- "Request Entity Too Large" (413)
- "ETIMEDOUT: Socket timeout"
- "Error: Unexpected end of stream"

**What I've tried:**
1. Increased nginx body size to 50MB
2. Increased Node.js body parser limit to 50MB
3. Added more server memory (16GB → 32GB)
4. Checked disk space (500GB free)
5. Reviewed application logs (no obvious issues)

**Environment:**
- Node.js 20.x behind nginx reverse proxy
- Express.js with multer for file uploads
- PostgreSQL database
- AWS EC2 t3.large instances
- Load balancer with 60s timeout

**Additional context:**
- Issue started 2 weeks ago after deployment
- Affects ~10% of upload attempts
- Smaller files (<5MB) work fine
- Issue is time-dependent (worse during peak hours)
```

**Expected Response:**

The `solve-problem` tool provides:

**Root Cause Analysis:**

- Likely timeout between nginx and Node.js (default 60s)
- Large file uploads taking longer during peak hours
- Backend timeout (60s) shorter than expected upload time for slow connections
- Load balancer timeout matching backend timeout creates race condition

**Diagnosis Steps:**

1. Check nginx proxy_read_timeout setting
2. Measure actual upload times for 5-10MB files
3. Monitor backend connection pool during peak hours
4. Review nginx access logs for upstream timeout errors
5. Check if issue correlates with high traffic periods

**Proposed Solutions:**

1. Increase nginx proxy_read_timeout to 300s
2. Increase load balancer timeout to 300s
3. Add progress tracking for large uploads
4. Implement chunked upload for files >5MB
5. Add timeout monitoring and alerting

**Testing Guidance:**

- Simulate slow upload with `curl --limit-rate 100K`
- Load test during peak traffic simulation
- Verify timeout chain: client → LB → nginx → Node.js

**Prevention:**

- Monitor 95th percentile upload times
- Add timeout budgets to monitoring
- Document timeout chain in runbook
- Test with various network conditions

### Step 2: Implement and Validate

After implementing the fix:

**Query:**

```
@consultant we increased timeouts to 300s but now seeing different error:

"Error: request aborted"
"ECONNRESET: Connection reset by peer"

This happens for uploads around 8-10MB.
Smaller files still work fine.
```

**Expected Response:**

**New Root Cause:**

- Connection reset suggests intermediate timeout or memory issue
- Could be nginx worker connections exhausted
- Or Node.js event loop blocking during large file processing

**Next Diagnosis Steps:**

1. Check nginx worker_connections setting
2. Monitor Node.js event loop lag
3. Review memory usage during uploads
4. Check if multer is streaming or buffering

**Updated Solution:**

- Ensure multer uses streaming (not buffering entire file)
- Increase nginx worker_connections
- Monitor memory per upload

### Step 3: Investigate Related Issues

Sometimes one problem reveals others:

**Query:**

```
@consultant related question:

After fixing upload timeouts, we noticed database connection pool warnings:
"Pool exhausted, waiting for available connection"

Could the original upload issues be related to this?
```

**Expected Response:**

**Connection:**
Yes, likely related. Long-running uploads hold database connections if:

- File metadata written to DB before upload completes
- Connection acquired too early in request lifecycle
- Pool too small for concurrent long-running requests

**Recommendation:**

- Acquire DB connection only after upload completes
- Increase connection pool size
- Add connection pool monitoring
- Implement connection timeout shorter than request timeout

## Complete Debugging Session

### 1. Initial Problem Report

**Symptoms:**

- Intermittent failures
- Production only
- Load dependent

**Your Investigation:**

```
@consultant diagnose this issue:
[detailed problem description with environment, errors, attempted fixes]
```

**Consultant Analysis:**

- Identifies likely root cause
- Provides diagnosis steps
- Suggests solutions
- Recommends testing approach

### 2. Follow-Up After Fix Attempt

**You:**

```
@consultant we tried your suggestion but now seeing:
[new error messages]

Our fix:
[what you changed]
```

**Consultant:**

- Analyzes why initial fix didn't work
- Identifies overlooked factors
- Provides refined solution
- Suggests monitoring to prevent recurrence

### 3. Deep Dive Into Root Cause

**You:**

```
@consultant can you explain why this happens?
Why does it only affect large files during peak hours?
```

**Consultant:**

- Explains technical details
- Describes interaction between components
- Clarifies why specific conditions trigger issue
- Helps build mental model

### 4. Prevention Strategy

**You:**

```
@consultant how can we prevent this type of issue in the future?
```

**Consultant:**

- Recommends monitoring and alerting
- Suggests architectural improvements
- Provides testing strategies
- Lists early warning signs

## Debugging Patterns

### Pattern 1: The "Systematic Diagnosis"

For complex, multi-component issues:

```
@consultant diagnose systematically:

**Problem:** [clear description]

**Environment:** [architecture, components, versions]

**Symptoms:** [errors, behaviors, patterns]

**Attempts:** [what you've tried]

**Observations:** [logs, metrics, patterns]

Please provide:
1. Most likely root cause
2. Step-by-step diagnosis plan
3. Testing approach
```

### Pattern 2: The "Why Chain"

Understanding deep causes:

```
@consultant why does [symptom] happen?

Context: [technical details]

Please explain:
1. Immediate cause
2. Underlying reason
3. Why our attempted fix didn't work
```

### Pattern 3: The "Hypothesis Testing"

Validate theories:

```
@consultant evaluate this hypothesis:

I think [problem] is caused by [theory] because [reasoning].

Does this make sense?
What could disprove this?
What should I test?
```

### Pattern 4: The "Emergency Triage"

For production incidents:

```
@consultant URGENT production issue:

[critical problem affecting users]

Need:
1. Immediate mitigation
2. Quick diagnosis
3. Rollback decision guidance
```

### Pattern 5: The "Post-Mortem"

After resolving issue:

```
@consultant help with post-mortem:

**Issue:** [what happened]
**Resolution:** [how we fixed it]

What should we document?
What monitoring should we add?
How do we prevent recurrence?
```

## Types of Debugging Problems

### Performance Issues

```
@consultant performance problem:

API endpoint taking 5-10 seconds to respond (expected <200ms)

[database queries, N+1 issues, caching, profiling data]
```

**Consultant helps identify:**

- Query optimization opportunities
- Caching strategies
- Architectural bottlenecks
- Profiling approaches

### Memory Leaks

```
@consultant suspected memory leak:

Node.js process memory grows from 200MB to 8GB over 24 hours.
Then crashes with OOM.

[monitoring data, heap snapshots, patterns]
```

**Consultant helps identify:**

- Likely leak sources
- Heap dump analysis approach
- Memory profiling tools
- Temporary mitigation

### Race Conditions

```
@consultant suspected race condition:

Intermittent duplicate records in database.
Only happens under high concurrency.

[transaction code, locking, timing]
```

**Consultant helps identify:**

- Synchronization issues
- Transaction isolation problems
- Lock contention
- Testing strategies

### Integration Issues

```
@consultant third-party API failing:

Our integration with [service] returns 500 errors intermittently.

[API client code, retry logic, error patterns]
```

**Consultant helps identify:**

- Rate limiting issues
- Authentication problems
- Timeout configuration
- Error handling gaps

### Configuration Issues

```
@consultant environment-specific bug:

Works in dev/staging but fails in production.

[environment differences, configuration, infrastructure]
```

**Consultant helps identify:**

- Configuration drift
- Environment variable issues
- Resource constraints
- Network differences

## Best Practices for Debugging with Consultant

### 1. Gather Complete Information First

Before consulting:

- Collect all error messages
- Document reproduction steps
- Note environment details
- List attempted fixes
- Gather relevant logs/metrics

### 2. Be Systematic

Present information in structured format:

- Problem description
- Environment details
- Symptoms and errors
- Attempted solutions
- Specific questions

### 3. Provide Context

Include:

- Architecture overview
- Recent changes
- Traffic patterns
- Business impact
- Time constraints

### 4. Test Hypotheses

Use consultant to:

- Validate theories
- Design experiments
- Interpret results
- Refine understanding

### 5. Document Solutions

After resolving:

- Ask consultant to help write runbook
- Create monitoring alerts
- Document prevention strategies
- Share learnings with team

## Debugging Workflow Integration

### During Incident

1. **Initial triage**

   ```
   @consultant urgent issue: [symptoms]
   Need immediate mitigation strategy
   ```

2. **Quick diagnosis**

   ```
   @consultant based on these logs, what's most likely?
   ```

3. **Solution validation**
   ```
   @consultant if we do [fix], what are the risks?
   ```

### After Resolution

4. **Post-mortem help**

   ```
   @consultant help write post-mortem
   What should we monitor to catch this earlier next time?
   ```

5. **Prevention**
   ```
   @consultant suggest architectural changes to prevent this
   ```

### Proactive Debugging

6. **Code review**

   ```
   @consultant review this code for potential issues
   [paste critical code path]
   ```

7. **Load testing**
   ```
   @consultant what should we test before launch?
   Based on our architecture: [details]
   ```

## Debugging Anti-Patterns to Avoid

### Don't: Provide Minimal Information

**Bad:**

```
@consultant my app crashes, help
```

**Good:**

```
@consultant app crashes with "Segmentation fault"
Node.js 20.x, express 4.x, happens after 1000 requests
[full error, environment, patterns]
```

### Don't: Skip Attempted Solutions

**Bad:**

```
@consultant how do I fix timeout errors?
```

**Good:**

```
@consultant timeout errors persist after:
- Increased timeout to 60s
- Added connection pooling
- Reduced payload size
What am I missing?
```

### Don't: Ignore Related Symptoms

**Bad:**
Only mention the error message

**Good:**

```
Getting timeout errors AND noticing:
- High memory usage
- Slow database queries
- Connection pool warnings
Could these be related?
```

## Advanced Debugging Techniques

### Hypothesis-Driven Debugging

1. Form hypothesis with consultant
2. Design test to prove/disprove
3. Run test
4. Refine hypothesis
5. Repeat

### Binary Search Debugging

When issue started after deploy:

```
@consultant help isolate which change caused issue:

Deploy included 10 changes [list changes]
How should I bisect to find culprit?
```

### Comparative Debugging

```
@consultant compare these environments:

Dev (works): [config]
Prod (fails): [config]

What differences could cause [symptom]?
```

## Related Examples

- [Strategic Planning](./strategic-planning.md) - Planning decisions
- [Code Review](./code-review.md) - Reviewing code
- [Documentation Improvement](./documentation-improvement.md) - Better docs
