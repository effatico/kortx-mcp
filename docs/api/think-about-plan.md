# think-about-plan

Get strategic feedback on plans and approaches before implementation. Analyzes clarity, feasibility, risks, dependencies, and suggests alternatives to help you make better architectural decisions.

---

## Quick Start

Get feedback on your implementation plan in seconds:

```typescript
// Minimal example - paste and go
{
  "plan": "Migrate our REST API to GraphQL for better mobile performance. Current: 100k users, Node.js/Express, React Native app."
}
```

The tool returns a structured analysis covering clarity, feasibility, risks, dependencies, recommendations, and alternative approaches.

---

## How to Use

Choose your depth based on your needs:

<details open>
<summary><strong>Minimal</strong> - Quick validation (30 seconds)</summary>

**When to use**: You have a clear plan and need quick validation or risk identification.

**Example**:

```json
{
  "plan": "Add Redis caching to reduce database load. Current: 5k req/min, PostgreSQL, 200ms average response time."
}
```

**What you get**: Fast analysis of main risks and quick recommendations.

</details>

<details>
<summary><strong>Standard</strong> - Comprehensive feedback (recommended)</summary>

**When to use**: Planning a significant change and need thorough analysis before committing.

**Example**:

```json
{
  "plan": "Refactor authentication to OAuth 2.0 with JWT tokens. Current: session cookies, 50k users, Node.js/React stack. Timeline: 2 months, team of 3. Need backward compatibility during migration.",
  "context": "Concerned about breaking existing sessions and token storage security",
  "goals": ["Zero downtime migration", "Improved API security", "Better mobile support"]
}
```

**What you get**:

- Detailed clarity assessment identifying ambiguities
- Realistic feasibility analysis with timeline validation
- Comprehensive risk evaluation (technical, security, operational)
- Full dependency mapping
- Prioritized recommendations with phased migration plan
- Multiple alternative approaches with trade-offs

</details>

<details>
<summary><strong>Advanced</strong> - Strategic planning</summary>

**When to use**: Complex multi-system changes, migrations, or architectural decisions with significant business impact.

**Example**:

```json
{
  "plan": "Migrate 200k LOC monolithic e-commerce platform to microservices. Current: Python monolith, 100k daily users, 500 req/sec peak. Target: 5-7 services (auth, products, orders, payments, shipping). Timeline: 6 months, team: 8 developers, budget: $50k infrastructure.",
  "context": "Platform stability is critical - can't afford extended downtime. Team has mixed experience with microservices.",
  "goals": ["Better scalability", "Independent deployment", "Team autonomy"],
  "constraints": [
    "24/7 uptime requirement",
    "PCI compliance for payments",
    "Limited DevOps expertise"
  ]
}
```

**What you get**:

- Strategic assessment of approach viability
- Detailed risk matrix with mitigation strategies
- Infrastructure dependency planning
- Phased implementation roadmap
- Cost-benefit analysis
- Multiple architectural alternatives (modular monolith, hybrid, serverless)
- Operational readiness requirements

</details>

---

<details>
<summary><strong>API Reference</strong></summary>

### Parameters

| Parameter        | Type     | Required | Description                                                                   |
| ---------------- | -------- | -------- | ----------------------------------------------------------------------------- |
| `plan`           | string   | Yes      | Your implementation plan or approach (50-500 words recommended)               |
| `context`        | string   | No       | Additional context, constraints, or concerns                                  |
| `goals`          | string[] | No       | What you're trying to achieve                                                 |
| `constraints`    | string[] | No       | Limitations (budget, time, team, technology)                                  |
| `preferredModel` | enum     | No       | GPT model to use: `gpt-5`, `gpt-5-mini`, `gpt-5-nano` (default: `gpt-5-mini`) |

### Response Structure

The tool returns a structured analysis with six sections:

1. **Clarity Assessment** - How well-defined is your plan?
2. **Feasibility Analysis** - Is it realistic given your constraints?
3. **Risk Evaluation** - What could go wrong?
4. **Dependencies Identification** - What do you need in place?
5. **Recommendations** - How to improve your plan
6. **Alternative Approaches** - Different ways to achieve the goal

</details>

## Common Use Cases

### Architecture Planning

Get feedback on system design decisions before writing code. Validates your approach and identifies potential issues early.

### Technology Selection

Evaluate whether a technology choice fits your requirements. Understand trade-offs before committing to a stack.

### Migration Strategy

Plan complex migrations with risk assessment and phased approaches. Avoid common migration pitfalls.

### Scaling Approach

Design scaling solutions that actually work for your traffic patterns and constraints.

---

## Task Playbooks

Jump to common scenarios:

- [Refactor Authentication System](#example-authentication-system-refactor)
- [Migrate to Microservices](#example-microservices-migration)
- [Add Caching Layer](#quick-start)
- [Technology Migration](#migration-strategy)

---

## Example: Authentication System Refactor

<details>
<summary>View full example with analysis</summary>

**Input:**

```json
{
  "plan": "Refactor authentication to OAuth 2.0 with JWT tokens and refresh token rotation. Currently using session cookies. 50k users, Node.js backend, React frontend. Timeline: 2 months, team of 3 developers. Need backward compatibility during migration."
}
```

**Response Summary:**

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

</details>

---

## Example: Microservices Migration

<details>
<summary>View full example with analysis</summary>

**Input:**

```json
{
  "plan": "Migrate monolithic e-commerce platform to microservices. Current: 200k LOC Python monolith, 100k daily users, 500 req/sec peak. Target: 5-7 microservices (auth, products, orders, payments, shipping). Timeline: 6 months. Team: 8 developers. Budget: $50k infrastructure."
}
```

**Response Summary:**

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

</details>

---

## Best Practices

<details>
<summary><strong>How to Write Effective Plans</strong></summary>

### Provide Sufficient Context

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

### Ask Focused Questions

Frame your plan clearly rather than asking open-ended questions.

**Good**: "I'm planning to implement rate limiting using Redis sorted sets with a sliding window algorithm. What do you think?"

**Bad**: "How should I implement rate limiting?"

</details>

---

## Integration with AI Assistants

<details>
<summary><strong>Claude Code</strong></summary>

```
Can you use kortx-mcp to think about my plan to implement
event sourcing for our order management system?
```

</details>

<details>
<summary><strong>Copilot</strong></summary>

```
@mcp:kortx-mcp think-about-plan
I'm planning to implement event sourcing...
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

```
@mcp:kortx-mcp I'm planning to migrate our REST API to GraphQL...
```

</details>

---

## Understanding Responses

<details>
<summary><strong>How to interpret the analysis</strong></summary>

### Clarity Indicators

- **✓ Well-defined**: Your plan is clear on this aspect
- **⚠ Ambiguous**: Needs more detail or clarification
- **✗ Missing**: Critical information not provided

### Risk Levels

- **🔴 HIGH**: Serious concern, requires immediate attention
- **🟡 MEDIUM**: Important but manageable with proper planning
- **🟢 LOW**: Minor concern, easy to address

### Recommendation Priority

1. **Critical**: Must address before proceeding
2. **Important**: Should address for better outcomes
3. **Optional**: Nice to have, consider if time permits

</details>

---

## Related Tools

- **[suggest-alternative](./suggest-alternative.md)** - Get alternative approaches to your plan
- **[solve-problem](./solve-problem.md)** - Debug issues with current implementation
- **[improve-copy](./improve-copy.md)** - Refine documentation or user-facing text

---

## Next Steps

- 📖 [suggest-alternative](./suggest-alternative.md) - Explore alternative approaches
- 📖 [solve-problem](./solve-problem.md) - Debug and troubleshoot issues
- 📖 [improve-copy](./improve-copy.md) - Enhance documentation and messaging
- 🔧 [Configuration Guide](../configuration.md) - Customize behavior and models

---

## Getting Help

- 💬 [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)
- 🐛 [Report an Issue](https://github.com/effatico/kortx-mcp/issues)
