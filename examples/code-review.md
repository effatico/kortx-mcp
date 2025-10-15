# Code Review Workflow

This example demonstrates using MCP Consultant during code reviews to improve code quality, catch issues, and suggest better approaches.

## Scenario

You're reviewing a pull request that implements a new authentication system. You want expert input on the approach and potential issues.

## Workflow

### Step 1: Review Architecture Approach

When you see a significant architectural decision in the PR:

**Query:**

```
I'm reviewing a PR that implements JWT-based authentication.
The approach:
- JWTs stored in localStorage
- 15-minute access tokens
- 7-day refresh tokens in httpOnly cookies
- No token revocation mechanism
- Client-side role checking

What do you think about this approach?
```

**Expected Response:**

The `think-about-plan` tool identifies:

- **Security Concerns**: localStorage vulnerable to XSS
- **Missing Features**: Token revocation critical for auth systems
- **Best Practices**: Refresh token rotation, server-side validation
- **Recommendations**: Use httpOnly cookies for both tokens, implement blacklist
- **Alternatives**: Session-based auth, OAuth 2.0 flows

### Step 2: Request Better Alternatives

Based on the feedback:

**Query:**

```
The current JWT implementation stores access tokens in localStorage.
Can you suggest more secure alternatives for SPA authentication?
```

**Expected Response:**

The `suggest-alternative` tool provides:

**Alternative 1: httpOnly Cookies Only**

- Both tokens in httpOnly cookies
- CSRF protection required
- Simpler client code
- Better XSS protection

**Alternative 2: BFF Pattern**

- Backend-for-Frontend handles tokens
- Client gets session cookie only
- Most secure for SPAs
- More backend complexity

**Alternative 3: OAuth 2.0 with PKCE**

- Standard protocol
- Secure for public clients
- Better for third-party integration
- Requires OAuth provider

**Trade-off Analysis:**
Compares security, complexity, user experience, and implementation cost.

### Step 3: Improve Code Comments

You notice the auth code lacks clear documentation:

**Query:**

```
Improve this code comment:

// Check if user is admin
function checkAdmin(user) {
  // Return true if admin
  return user.roles.includes('admin')
}
```

**Expected Response:**

The `improve-copy` tool provides:

```javascript
/**
 * Validates whether a user has administrator privileges.
 *
 * This function performs a role-based authorization check by examining
 * the user's role array. It should be called server-side only, as
 * client-side role checks can be bypassed.
 *
 * @param {User} user - User object with roles array
 * @returns {boolean} true if user has 'admin' role, false otherwise
 *
 * @example
 * if (checkAdmin(currentUser)) {
 *   // Grant access to admin panel
 * }
 *
 * @security Critical: Never rely on this for client-side authorization
 */
function checkAdmin(user) {
  return user?.roles?.includes('admin') ?? false;
}
```

### Step 4: Debug PR Issues

The PR has failing tests:

**Query:**

````
The authentication tests are failing with this error:

"TypeError: Cannot read property 'verify' of undefined"

The test code:
```javascript
it('should validate JWT token', () => {
  const token = generateToken({ userId: 123 });
  const result = auth.verifyToken(token);
  expect(result.userId).toBe(123);
});
````

I've checked that:

- JWT_SECRET is set in test environment
- The token is being generated
- verifyToken function exists

```

**Expected Response:**

The `solve-problem` tool provides:

- **Root Cause**: Async initialization issue, `auth.init()` not called before test
- **Diagnosis Steps**: Check initialization order, verify JWT library is loaded
- **Solution**: Call `auth.init()` in `beforeAll` hook or make verifyToken handle uninitialized state
- **Prevention**: Better error messages, defensive coding, proper test setup

## Complete Code Review Example

### 1. Initial Architecture Review

**PR Description:**
```

Add JWT authentication system

- Login endpoint returns access + refresh tokens
- Middleware validates tokens on protected routes
- Client stores tokens in localStorage

```

**Your Review:**
```

@consultant think about this authentication approach:
[paste PR description with implementation details]

```

**Consultant Response:**
- Identifies localStorage security issue
- Suggests httpOnly cookie approach
- Flags missing token revocation
- Recommends refresh token rotation

**Your Action:**
```

Request changes:

- Move tokens to httpOnly cookies
- Add token revocation support
- Implement refresh token rotation

```

### 2. Evaluate Alternative Approach

**Author's Response:**
```

I'll switch to httpOnly cookies. Should I use SameSite=Strict or Lax?
Also considering session-based auth instead. Thoughts?

```

**Your Review:**
```

@consultant suggest alternatives for SPA authentication.
Context: React SPA, Node.js backend, need both mobile app and web support.

```

**Consultant Response:**
- Compares JWT vs sessions
- Explains SameSite options
- Suggests BFF pattern for SPAs
- Considers mobile requirements

**Your Action:**
```

Comment on PR:
Based on our mobile requirements, JWT with httpOnly cookies + SameSite=Lax
makes sense. Adding CSRF protection as discussed.

````

### 3. Review Error Messages

**Code in PR:**
```javascript
if (!token) {
  throw new Error('Auth error');
}
````

**Your Review:**

```
@consultant improve this error message: "Auth error"

Context: This appears in authentication middleware when token is missing.
Users see this message in API responses.
```

**Consultant Response:**

```javascript
if (!token) {
  throw new Error(
    'Authentication required. Please provide a valid access token ' +
      'in the Authorization header or ensure your session is active.'
  );
}
```

**Your Action:**

```
Suggestion:
Make error messages more specific and actionable for API consumers.
```

### 4. Investigate Test Failures

**Test Output:**

```
✗ should refresh expired tokens
  Error: Request failed with status code 401

✗ should reject invalid tokens
  Error: Timeout exceeded
```

**Your Review:**

```
@consultant solve this problem:
Two auth tests failing - one with 401, one with timeout.
[paste test code and error details]

We've tried:
- Restarting test DB
- Clearing test cache
- Increasing timeout to 10s
```

**Consultant Response:**

- **401 Test**: Clock skew issue, token expiry calculation wrong
- **Timeout Test**: Infinite loop in token validation, missing error case
- Provides specific fixes for both

**Your Action:**

```
Found the issues (thanks to consultant):
1. Fix expiry calculation
2. Add error handling in validator
```

### 5. Review Security Concerns

**Code Pattern:**

```javascript
// Decode JWT on client side to get user info
const userData = jwtDecode(token);
if (userData.role === 'admin') {
  showAdminPanel();
}
```

**Your Review:**

```
@consultant what are the security implications of this pattern?
[paste code showing client-side JWT decoding and role checking]
```

**Consultant Response:**

- **Critical Issue**: Client-side authorization is insecure
- **Attack Vector**: User can modify localStorage and change role
- **Recommendation**: Only use decoded JWT for UI hints, always validate server-side
- **Better Pattern**: Server returns allowed features, client respects

**Your Action:**

```
🚨 Security Issue:
Client-side role checking is insecure. Move authorization logic server-side.
```

## Code Review Patterns

### Pattern 1: The "Sanity Check"

Quick validation of approach:

```
@consultant quick sanity check:
Using bcrypt with 12 rounds for password hashing. Good for production?
```

### Pattern 2: The "Comparison"

Evaluate two implementations:

```
@consultant compare:
Approach A: JWT with redis blacklist
Approach B: Opaque tokens with DB lookup

Which is better for our high-traffic API?
```

### Pattern 3: The "Security Review"

Identify security issues:

```
@consultant security review:
[paste authentication/authorization code]

What security issues do you see?
```

### Pattern 4: The "Performance Analysis"

Check performance implications:

```
@consultant performance implications:
This PR adds JWT validation middleware to every request.
Each validation does RSA signature verification.
10,000 requests/minute expected.

Concerns?
```

### Pattern 5: The "Test Coverage"

Evaluate test quality:

```
@consultant are these tests sufficient?
[paste test suite]

What edge cases are we missing?
```

## Tips for Effective Code Reviews

### Provide Context

**Good:**

```
@consultant reviewing authentication PR for financial app.
PCI compliance required, storing credit cards.
[paste code and approach]
```

**Less Effective:**

```
@consultant is this auth code good?
```

### Ask Specific Questions

- "What security issues exist in this code?"
- "What's a better approach to error handling here?"
- "How can this error message be improved?"
- "What edge cases are we missing?"

### Follow Up on Feedback

Don't just accept first answer:

1. Get initial feedback
2. Ask "why" behind suggestions
3. Request alternative approaches
4. Discuss trade-offs
5. Challenge assumptions if needed

### Use Throughout Review Process

- **Early**: Review architecture and approach
- **Middle**: Check implementation details
- **Late**: Improve error messages and docs
- **Post-Merge**: Reflect on lessons learned

## Integrating With Your Review Process

### GitHub PR Template

Add consultant prompts to your PR template:

```markdown
## Architecture Review

<!-- Ask consultant about approach -->

## Security Considerations

<!-- Consult on security implications -->

## Alternative Approaches

<!-- What other options exist? -->

## Error Handling

<!-- Are error messages clear? -->
```

### Review Checklist

Add consultant steps:

- [ ] Ask consultant about architecture approach
- [ ] Request security review
- [ ] Check for alternative implementations
- [ ] Improve error messages
- [ ] Validate test coverage

### Review Comments

Use consultant to formulate feedback:

```
Before:
"This code is too complex"

After consulting:
"This approach works but has O(n²) complexity. Consider using a Map
for O(1) lookups instead. Example: [provide code]"
```

## Common Review Scenarios

### New Feature Implementation

1. Review architecture approach
2. Check for simpler alternatives
3. Validate error handling
4. Ensure test coverage
5. Improve documentation

### Bug Fix PR

1. Understand root cause
2. Verify fix addresses root cause
3. Check if fix is complete
4. Look for similar bugs elsewhere
5. Add regression test

### Refactoring PR

1. Validate refactoring approach
2. Check for breaking changes
3. Ensure behavior preservation
4. Review test updates
5. Verify performance impact

### Security Fix

1. Understand the vulnerability
2. Verify fix is complete
3. Check for similar issues
4. Validate security best practices
5. Ensure proper disclosure

## Best Practices

1. **Use Consultant Early**: Catch issues before detailed review
2. **Be Specific**: Provide code context and constraints
3. **Ask "Why"**: Understand reasoning behind suggestions
4. **Validate Suggestions**: Consultant is advisory, not authoritative
5. **Document Learnings**: Save insights for future reviews
6. **Share With Team**: Use improved explanations in PR comments
7. **Iterate**: Use consultant multiple times throughout review

## Metrics and Improvement

Track consultant effectiveness:

- Issues caught that you missed
- Better explanations in review comments
- Faster review cycle time
- Better alternative suggestions
- Improved code quality

## Related Examples

- [Strategic Planning](./strategic-planning.md) - Architecture decisions
- [Documentation Improvement](./documentation-improvement.md) - Better docs
- [Debugging Session](./debugging-session.md) - Solving problems
