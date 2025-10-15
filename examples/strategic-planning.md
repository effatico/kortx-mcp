# Strategic Planning Workflow

This example demonstrates using MCP Consultant for strategic planning and architecture decisions.

## Scenario

You're planning to refactor a monolithic e-commerce application into microservices. You want expert feedback on your approach before starting implementation.

## Workflow

### Step 1: Present Your Plan

Ask for strategic feedback using the `think-about-plan` tool:

**Query:**

```
I'm planning to refactor our e-commerce monolith into microservices.
Here's my approach:

1. Split into 5 services: User, Product, Order, Payment, Notification
2. Use REST APIs with API Gateway
3. Shared PostgreSQL database initially, then split databases
4. Deploy on Kubernetes with service mesh (Istio)
5. Gradual migration service by service over 6 months

What do you think about this plan?
```

**Expected Response:**

The consultant will analyze your plan across multiple dimensions:

- **Clarity Assessment**: Is the scope well-defined? Are responsibilities clear?
- **Feasibility Analysis**: Can this be done in 6 months? Are resources realistic?
- **Risk Evaluation**: What could go wrong? Database splitting complexity? Team learning curve?
- **Dependencies**: Service boundaries dependencies? Infrastructure requirements?
- **Recommendations**: Specific improvements to make the plan stronger
- **Alternatives**: Other approaches you might not have considered

### Step 2: Explore Specific Concerns

Based on the feedback, drill down into specific areas:

**Query:**

```
The consultant mentioned risks around database splitting.
Can you suggest alternative approaches to database management
during the microservices transition?
```

**Expected Response:**

The `suggest-alternative` tool will provide:

- **Shared Database Pattern**: Keep one DB initially with strict service boundaries
- **Database per Service**: Immediate split with data synchronization
- **Event Sourcing**: Event-driven architecture with eventual consistency
- **CQRS Pattern**: Separate read/write models
- **Trade-off Analysis**: Pros/cons of each approach

### Step 3: Refine Communication

Prepare clear documentation of the decision:

**Query:**

```
Improve this technical memo for the engineering team:

"We're going to split the monolith into microservices.
Each service gets its own database eventually but we start shared.
Use REST and Kubernetes. Migration happens service by service."
```

**Expected Response:**

The `improve-copy` tool will provide:

A polished, professional version:

```markdown
# Microservices Migration Strategy

## Overview

We're transitioning from our monolithic architecture to a microservices
architecture to improve scalability, deployment flexibility, and team autonomy.

## Approach

The migration will follow a gradual, risk-mitigated strategy:

1. **Service Boundaries**: Five independent services (User, Product, Order,
   Payment, Notification) with clear domain responsibilities

2. **Database Strategy**: Initially shared PostgreSQL with strict access
   boundaries, transitioning to database-per-service as services stabilize

3. **Communication**: REST APIs coordinated through an API Gateway for
   centralized security and routing

4. **Infrastructure**: Kubernetes deployment with Istio service mesh for
   observability and traffic management

5. **Timeline**: Phased migration over 6 months, one service at a time,
   minimizing production risk

## Next Steps

[Detailed implementation phases...]
```

### Step 4: Problem Solving During Implementation

When you hit issues during execution:

**Query:**

```
We're getting intermittent timeout errors when the Order service
calls the Payment service through the API Gateway.

The issue happens under load (>100 requests/sec).
We've tried:
- Increasing timeout from 5s to 30s
- Adding more Payment service replicas
- Checking network connectivity

Error logs show:
"upstream request timeout"
"connection pool exhausted"
```

**Expected Response:**

The `solve-problem` tool will provide:

- **Root Cause Analysis**: Connection pool limits, not actual service slowness
- **Diagnosis Steps**: Check connection pool configuration, measure actual response times
- **Solutions**: Configure connection pooling properly, implement circuit breaker pattern
- **Prevention**: Load testing before production, proper observability

## Complete Planning Session Example

Here's a full conversation flow:

### 1. Initial Strategy Review

**You:**

```
I'm planning a microservices migration. [detailed plan]
What do you think?
```

**Consultant:** Provides comprehensive strategic analysis with 6 key insights

### 2. Dive Into Database Strategy

**You:**

```
You mentioned risks with database splitting. Can you suggest alternatives?
```

**Consultant:** Explains 4 different database approaches with trade-offs

### 3. Evaluate Service Boundaries

**You:**

```
How should I decide if Payment and Order should be separate services
or combined into a single Transaction service?
```

**Consultant:** Analyzes domain boundaries, suggests decision criteria

### 4. Document the Decision

**You:**

```
Improve this architecture decision record: [draft ADR]
```

**Consultant:** Provides polished, comprehensive ADR

### 5. Plan Team Communication

**You:**

```
I need to present this to the team. Improve this slide deck outline: [outline]
```

**Consultant:** Enhances structure and clarity

### 6. Risk Mitigation

**You:**

```
What are the top 3 risks in this plan and how should we mitigate them?
```

**Consultant:** Identifies risks and provides mitigation strategies

## Tips for Strategic Planning

### Be Specific About Context

**Good:**

```
I'm planning to migrate our 10-year-old PHP monolith to microservices.
We have 8 developers, 1 million daily active users, and 6-month timeline.
Current pain points: slow deploys, can't scale individual features.
```

**Less Effective:**

```
Should we use microservices?
```

### Include Constraints

Mention:

- Team size and experience
- Timeline and budget
- Technical constraints
- Business requirements
- Risk tolerance

### Ask Follow-Up Questions

Don't stop at the first answer:

1. Get initial feedback
2. Explore alternatives
3. Drill into risks
4. Challenge assumptions
5. Refine communication

### Iterate on Plans

Use the consultant in cycles:

1. Draft initial plan
2. Get feedback
3. Revise plan
4. Get feedback on revision
5. Continue until confident

## Integrating With Your Workflow

### Architecture Decision Records (ADRs)

Use the consultant to:

1. Brainstorm alternatives
2. Analyze trade-offs
3. Polish the ADR document
4. Review before finalizing

### Technical RFCs

Get feedback at each stage:

1. Problem statement clarity
2. Solution alternatives
3. Trade-off analysis
4. Implementation plan review

### Sprint Planning

Consult on:

1. Story breakdown
2. Technical approach
3. Risk identification
4. Dependency analysis

### Technical Debt Planning

Ask for help with:

1. Prioritization strategy
2. Refactoring approaches
3. Migration paths
4. Communication with stakeholders

## Common Patterns

### The "Sanity Check" Pattern

Get quick validation:

```
Quick sanity check: I'm thinking of using Redis for session storage
instead of JWT tokens. Makes sense for our use case?
```

### The "Comparison" Pattern

Evaluate options:

```
Compare these two approaches: [A] vs [B]
What are the trade-offs for our situation?
```

### The "Risk Analysis" Pattern

Identify blindspots:

```
I'm planning [X]. What risks am I not seeing?
What could go wrong?
```

### The "Communication" Pattern

Get help explaining:

```
I need to explain [technical concept] to [non-technical stakeholders].
How should I frame this?
```

## Best Practices

1. **Provide Context**: More context = better advice
2. **Be Honest About Constraints**: Don't hide limitations
3. **Ask "Why"**: Understand reasoning behind suggestions
4. **Challenge Assumptions**: Both yours and the consultant's
5. **Iterate**: Strategic planning is rarely one-shot
6. **Document**: Save the insights for future reference
7. **Share**: Use improved communication with your team

## Related Examples

- [Code Review Workflow](./code-review.md) - Using consultant during code reviews
- [Documentation Improvement](./documentation-improvement.md) - Enhancing docs
- [Debugging Session](./debugging-session.md) - Problem-solving with consultant
