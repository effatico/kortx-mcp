# think-about-plan API Documentation

Get strategic feedback on plans and approaches before implementation.

---

## Overview

The `think-about-plan` tool provides expert consultation on your implementation plans, architectural decisions, and project strategies. It analyzes clarity, feasibility, identifies risks and dependencies, and suggests alternatives.

**Use this tool when:**

- Planning a new feature or system
- Making architectural decisions
- Designing complex workflows
- Evaluating implementation approaches
- Seeking strategic guidance

---

## API Signature

```typescript
tool("think-about-plan", {
  plan: string;  // The plan or approach to evaluate
})
```

---

## Parameters

### `plan` (required)

A description of the plan, approach, or strategy you want feedback on.

- **Type**: String
- **Required**: Yes
- **Format**: Free-form text
- **Recommended length**: 50-500 words

**What to include:**

- **Context**: Current state, constraints, requirements
- **Objective**: What you're trying to achieve
- **Approach**: Your proposed solution or plan
- **Timeline**: When you plan to implement (if relevant)
- **Resources**: Team size, budget, infrastructure (if relevant)

---

## Response Format

The tool returns a structured analysis with the following sections:

### 1. Clarity Assessment

Evaluates how well-defined your plan is.

- Clear objectives
- Specific steps
- Missing details or ambiguities

### 2. Feasibility Analysis

Assesses whether the plan is realistic.

- Technical feasibility
- Resource requirements
- Timeline assessment
- Complexity evaluation

### 3. Risk Evaluation

Identifies potential problems and challenges.

- Technical risks
- Integration risks
- Performance risks
- Security risks
- Operational risks

### 4. Dependencies Identification

Lists prerequisites and related systems.

- Technical dependencies
- Team dependencies
- Infrastructure requirements
- External dependencies

### 5. Recommendations

Provides actionable advice for improvement.

- Priority improvements
- Risk mitigation strategies
- Optimization opportunities
- Best practices

### 6. Alternative Approaches

Suggests different ways to achieve the same goal.

- Simpler alternatives
- More robust alternatives
- Faster alternatives
- Cost-effective alternatives

---

## Example Usage

### Example 1: Authentication System Refactor

**Input:**

```
I'm planning to refactor our authentication system to use OAuth 2.0
with JWT tokens and refresh token rotation. Currently using session
cookies. We have 50k users, Node.js backend, React frontend.
Timeline: 2 months, team of 3 developers. Need to maintain backward
compatibility during migration.
```

**Response:**

```markdown
## Clarity Assessment

✓ Well-defined: OAuth 2.0 with JWT + refresh tokens
✓ Clear context: 50k users, Node.js/React stack
✓ Specific timeline: 2 months
⚠ Ambiguous: Token expiration times not specified
⚠ Missing: Error handling strategy during migration

## Feasibility Analysis

✓ Timeline realistic for experienced team
✓ Technology stack compatible
⚠ Backward compatibility adds complexity
⚠ Consider 3 months for thorough testing

## Risk Evaluation

🔴 HIGH: Breaking existing sessions during cutover
🟡 MEDIUM: Token storage security on client
🟡 MEDIUM: Refresh token rotation complexity
🟢 LOW: OAuth 2.0 is well-documented standard

## Dependencies

- OAuth 2.0 provider (Auth0, Okta, or custom)
- Token storage strategy (httpOnly cookies vs localStorage)
- API endpoint updates for token handling
- Frontend state management for auth
- Database schema updates for refresh tokens

## Recommendations

1. **Phase the migration**
   - Week 1-2: Set up OAuth 2.0 infrastructure
   - Week 3-4: Implement JWT handling
   - Week 5-6: Gradual user migration
   - Week 7-8: Monitoring and bug fixes

2. **Maintain both systems temporarily**
   - Support session cookies AND JWT during migration
   - Gradual user migration reduces risk

3. **Security best practices**
   - Use httpOnly, Secure, SameSite cookies for tokens
   - Implement refresh token rotation
   - Set appropriate token expiration (15min access, 7d refresh)

4. **Testing strategy**
   - Load test with 10k+ concurrent users
   - Security audit before production
   - Gradual rollout with feature flags

## Alternative Approaches

1. **Simpler: Upgrade existing sessions**
   - Add JWT to existing session system
   - Less disruptive, faster implementation
   - Trade-off: Mixed architecture

2. **More robust: Use established provider**
   - Auth0 or Okta instead of custom OAuth
   - Faster setup, better security
   - Trade-off: Additional cost (~$200/mo)

3. **Gradual: Hybrid approach**
   - New users get OAuth + JWT
   - Existing users migrate on next login
   - Trade-off: Longer migration period
```

---

### Example 2: Microservices Migration

**Input:**

```
Planning to migrate monolithic e-commerce platform to microservices.
Current: 200k LOC Python monolith, 100k daily users, 500 req/sec peak.
Target: 5-7 microservices (auth, products, orders, payments, shipping).
Timeline: 6 months. Team: 8 developers. Budget: $50k infrastructure.
```

**Response:**

```markdown
## Clarity Assessment

✓ Clear decomposition strategy
✓ Realistic team size
✓ Specific metrics provided
⚠ Ambiguous: Communication protocol not specified
⚠ Missing: Data migration strategy

## Feasibility Analysis

⚠ 6 months is aggressive for 200k LOC migration
✓ Team size adequate if experienced
⚠ $50k may be tight for multi-region deployment
🔴 Risk: "Big bang" migration is high-risk

## Risk Evaluation

🔴 HIGH: Data consistency across services
🔴 HIGH: Distributed transactions (orders + payments)
🟡 MEDIUM: Increased operational complexity
🟡 MEDIUM: Network latency between services
🟢 LOW: Technology choice (Python supports async well)

## Dependencies

- Service mesh (Istio, Linkerd) or API gateway
- Message broker (RabbitMQ, Kafka) for async communication
- Distributed tracing (Jaeger, Zipkin)
- Centralized logging (ELK, Datadog)
- Service discovery (Consul, Eureka)
- Container orchestration (Kubernetes)

## Recommendations

1. **Strangler Fig Pattern instead of Big Bang**
   - Extract one service at a time
   - Start with authentication (lowest coupling)
   - Validate each service before next migration
   - Timeline becomes 12-18 months realistically

2. **Start with payments service**
   - Most isolated, clear boundaries
   - Immediate value: PCI DSS compliance
   - Lower risk for first extraction

3. **Shared database initially**
   - Keep shared database during migration
   - Split databases only after services are stable
   - Reduces data consistency risks

4. **Infrastructure automation**
   - Invest first month in K8s setup, CI/CD
   - Infrastructure as Code (Terraform)
   - Automated testing and deployment

## Alternative Approaches

1. **Simpler: Modular monolith**
   - Refactor monolith into modules with clear boundaries
   - 80% of microservices benefits, 20% of complexity
   - Timeline: 3 months
   - Cost: $5k (much cheaper)

2. **Hybrid: Extract only problematic services**
   - Keep most of monolith
   - Extract only scaling bottlenecks (e.g., product search)
   - Timeline: 4 months
   - Lower risk

3. **Serverless-first**
   - Use AWS Lambda/GCP Cloud Functions
   - Lower operational burden
   - Trade-off: Vendor lock-in, cold starts
```

---

## Best Practices

### 1. Provide Sufficient Context

**Good:**

```
Planning to implement caching with Redis. Current system: Node.js API
serving 10k req/min, PostgreSQL database, average query time 200ms.
Goal: Reduce to <50ms. Budget: $100/mo. Timeline: 2 weeks.
```

**Bad:**

```
Should I use Redis for caching?
```

---

### 2. Be Specific About Constraints

Include:

- Timeline and deadlines
- Team size and experience level
- Budget limitations
- Technology constraints
- Business requirements

---

### 3. State Your Assumptions

Make explicit what you're assuming:

```
I'm planning to use Docker Compose for local development and Kubernetes
for production. Assuming our team has K8s experience and we have
existing K8s infrastructure.
```

---

### 4. Ask Focused Questions

Instead of open-ended "what should I do", frame as "here's my plan, what do you think":

**Good:**

```
I'm planning to implement rate limiting using Redis sorted sets
with a sliding window algorithm. What do you think?
```

**Bad:**

```
How should I implement rate limiting?
```

---

## Common Use Cases

### Architecture Planning

```
I'm designing a real-time notification system using WebSockets.
Expected: 50k concurrent connections, 100 msg/sec/user on average.
Plan: Node.js with Socket.io, Redis pub/sub for scaling across servers,
PostgreSQL for persistence. What do you think?
```

### Technology Selection

```
I'm evaluating GraphQL vs REST for our new API. Requirements:
- Mobile and web clients
- Complex nested data structures
- Real-time updates needed
- Team has React experience but no GraphQL
My plan is to use GraphQL with Apollo Server. Thoughts?
```

### Migration Strategy

```
Planning to migrate from MySQL to PostgreSQL for better JSON support.
Current: 500GB database, 24/7 uptime requirement, 10k writes/sec.
Plan: Use logical replication, gradual cutover with read replicas.
Timeline: 1 month. What do you think?
```

### Scaling Approach

```
Our API is hitting performance limits at 5k req/sec. Plan: Add
horizontal scaling with load balancer, Redis caching, database
read replicas. Current: 2 API servers, 1 DB server, no caching.
Target: 20k req/sec. Thoughts?
```

---

## Integration Examples

### Claude Code

```
Can you use the consultant to think about my plan to implement
event sourcing for our order management system?
```

### Copliot

```
@mcp:consultant think-about-plan
I'm planning to implement event sourcing...
```

### Cursor

```
@mcp:consultant I'm planning to migrate our REST API to GraphQL...
```

---

## Response Interpretation

### Clarity Assessment

- **✓ Well-defined**: Your plan is clear on this aspect
- **⚠ Ambiguous**: Needs more detail or clarification
- **✗ Missing**: Critical information not provided

### Risk Levels

- **🔴 HIGH**: Serious concern, requires immediate attention
- **🟡 MEDIUM**: Important but manageable with proper planning
- **🟢 LOW**: Minor concern, easy to address

### Recommendations Priority

1. **Critical**: Must address before proceeding
2. **Important**: Should address for better outcomes
3. **Optional**: Nice to have, consider if time permits

---

## Tips for Better Results

1. **Write detailed plans**: More context = better feedback
2. **Include metrics**: Quantify your requirements and constraints
3. **State assumptions explicitly**: What are you taking for granted?
4. **Mention tried approaches**: What have you already considered?
5. **Be honest about limitations**: Team experience, budget, time
6. **Ask about specific concerns**: "Particularly worried about X"

---

## Related Tools

- **suggest-alternative**: Get alternative approaches to your plan
- **solve-problem**: Debug issues with current implementation
- **improve-copy**: Refine documentation or user-facing text

---

## Next Steps

- 📖 [suggest-alternative documentation](./suggest-alternative.md)
- 📖 [solve-problem documentation](./solve-problem.md)
- 🎯 [Example Workflows](../../examples/)
- 🔧 [Configuration Guide](../configuration.md)

---

## Getting Help

- 💬 [GitHub Discussions](https://github.com/amsv01/llm-consultants/discussions)
- 🐛 [Report an Issue](https://github.com/amsv01/llm-consultants/issues)
- 📧 [Email Support](mailto:amin@effati.se)
