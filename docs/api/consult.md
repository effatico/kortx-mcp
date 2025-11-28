# consult

Expert consultation with domain-specific personas across software architecture, security, performance, databases, DevOps, frontend, backend, AI/ML, and general software engineering.

---

## Quick Start

Get expert advice in seconds:

```json
{
  "question": "Should I use microservices or a monolith for a new SaaS product with 3 developers?",
  "domain": "software-architecture"
}
```

The tool connects you with specialized domain experts who provide practical, experience-backed guidance.

---

## Domain Expertise

Choose the expert domain that matches your question:

<details open>
<summary><strong>software-architecture</strong> - System design and architecture patterns</summary>

**Best for**: Distributed systems, microservices, event-driven architectures, domain-driven design, scalability decisions.

**Example**:

```json
{
  "question": "How should I design a multi-tenant SaaS architecture with row-level security?",
  "domain": "software-architecture",
  "constraints": [
    "PostgreSQL database",
    "Need to support 1000+ tenants",
    "Strict data isolation requirements"
  ]
}
```

</details>

<details>
<summary><strong>security</strong> - Application security and threat modeling</summary>

**Best for**: OWASP vulnerabilities, secure coding, authentication/authorization, encryption, compliance.

**Example**:

```json
{
  "question": "What's the best way to implement OAuth2 with JWT tokens for a mobile API?",
  "domain": "security",
  "context": "React Native mobile app, Node.js backend, need refresh token rotation"
}
```

</details>

<details>
<summary><strong>performance</strong> - Optimization and scalability</summary>

**Best for**: Profiling, caching strategies, database optimization, memory management, load testing.

**Example**:

```json
{
  "question": "API response times degrading from 200ms to 2s under load",
  "domain": "performance",
  "context": "Express API, PostgreSQL, Redis cache, 500 req/s peak traffic"
}
```

</details>

<details>
<summary><strong>database</strong> - Data modeling and database systems</summary>

**Best for**: Schema design, query optimization, indexing, replication, database selection.

**Example**:

```json
{
  "question": "Should I denormalize user data for better read performance?",
  "domain": "database",
  "context": "E-commerce platform, 1M products, 100K users, heavy read workload"
}
```

</details>

<details>
<summary><strong>devops</strong> - Infrastructure and deployment</summary>

**Best for**: CI/CD pipelines, containerization, Kubernetes, cloud platforms, monitoring, IaC.

**Example**:

```json
{
  "question": "What's the best strategy for zero-downtime deployments on Kubernetes?",
  "domain": "devops",
  "constraints": ["Using AWS EKS", "Need to maintain session state", "Database migrations required"]
}
```

</details>

<details>
<summary><strong>frontend</strong> - Modern web development</summary>

**Best for**: React, Vue, Angular, state management, performance optimization, accessibility.

**Example**:

```json
{
  "question": "How should I structure state management for a large React dashboard?",
  "domain": "frontend",
  "context": "Real-time data updates, 20+ charts, need good performance"
}
```

</details>

<details>
<summary><strong>backend</strong> - Server-side systems</summary>

**Best for**: API design, service patterns, data processing, message queues, integration patterns.

**Example**:

```json
{
  "question": "Should I use REST or GraphQL for a new API with mobile and web clients?",
  "domain": "backend"
}
```

</details>

<details>
<summary><strong>ai-ml</strong> - AI/ML engineering</summary>

**Best for**: ML pipelines, model deployment, MLOps, vector databases, LLM integration.

**Example**:

```json
{
  "question": "What's the best approach for building a RAG system with document retrieval?",
  "domain": "ai-ml",
  "context": "Need to search 10K documents, using OpenAI embeddings"
}
```

</details>

<details>
<summary><strong>general</strong> - Broad software engineering</summary>

**Best for**: Cross-domain questions, high-level guidance, best practices, technology selection.

**Example**:

```json
{
  "question": "What tech stack would you recommend for a real-time collaborative editor?",
  "domain": "general"
}
```

</details>

---

<details>
<summary><strong>API Reference</strong></summary>

### Parameters

| Parameter        | Type   | Required | Description                                                                           |
| ---------------- | ------ | -------- | ------------------------------------------------------------------------------------- |
| `question`       | string | Yes      | Your question for the expert (min 10 characters)                                      |
| `domain`         | enum   | No       | Expert domain (default: `general`). See domain list above                             |
| `context`        | string | No       | Additional context about your situation                                               |
| `constraints`    | array  | No       | Technical or business constraints to consider                                         |
| `preferredModel` | enum   | No       | GPT model: `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-5.1-2025-11-13`, `gpt-5.1-codex` |

### Domain Values

- `software-architecture`
- `security`
- `performance`
- `database`
- `devops`
- `frontend`
- `backend`
- `ai-ml`
- `general`

### Response Structure

Each expert provides:

1. **Answer** - Direct response to your question
2. **Reasoning** - Why this is the recommended approach
3. **Considerations** - Important factors and trade-offs
4. **Next Steps** - Concrete actions you can take

</details>

---

## Common Use Cases

### Architecture Decisions

Get guidance on system design, technology selection, and architectural patterns.

### Security Reviews

Validate security approaches, identify vulnerabilities, and implement best practices.

### Performance Optimization

Find bottlenecks, optimize queries, and scale systems effectively.

### Technology Selection

Choose the right databases, frameworks, and tools for your use case.

---

## Example: Microservices vs Monolith

<details>
<summary>View full consultation</summary>

**Input:**

```json
{
  "question": "Should I use microservices or a monolith for a new SaaS product?",
  "domain": "software-architecture",
  "context": "Team of 3 developers, B2B SaaS, need to ship MVP in 3 months",
  "constraints": ["Limited DevOps experience", "Budget-conscious", "Need to iterate quickly"]
}
```

**Response Summary:**

```markdown
## Answer

**Start with a modular monolith, not microservices.**

For a 3-person team shipping an MVP, a well-structured monolith will let you move faster while keeping architectural flexibility for future scaling. You can always extract services later when specific scaling needs emerge.

## Reasoning

1. **Team Size**: With 3 developers, the operational overhead of microservices (deployment, monitoring, debugging across services) will slow you down significantly.

2. **Time to Market**: A monolith lets you:
   - Deploy as a single unit (simpler CI/CD)
   - Debug in one codebase
   - Refactor across boundaries easily
   - Ship features faster

3. **Cost**: Microservices require:
   - More infrastructure (multiple services, service mesh, API gateway)
   - More sophisticated monitoring
   - Higher cloud costs
   - More DevOps investment

4. **Iterative Development**: In early stages, you'll frequently change boundaries between domains. This is easy in a monolith, painful across services.

## Modular Monolith Approach

Structure your monolith with clear boundaries:
```

src/
modules/
auth/ # Authentication & authorization
billing/ # Payment & subscriptions
workspace/ # Core product features
notifications/ # Email, SMS, push
shared/ # Common utilities
api/ # API layer

```

**Key principles**:
- Modules only communicate through well-defined interfaces
- Each module could theoretically become a microservice
- Shared database but separate schemas per module
- Clear dependency rules (e.g., billing can't depend on workspace)

## Considerations

**When to reconsider**:
- One part needs different scaling (e.g., async job processing)
- Team grows beyond 10-12 people
- Parts have very different technology needs
- Specific compliance requirements (e.g., PCI-DSS isolation)

**Red flags that microservices might be premature**:
- "We might need to scale"  (Wait for actual scaling needs)
- "We want to use different languages" (Rarely a real need)
- "It's more 'modern'" (Architecture should solve problems, not follow trends)

## Next Steps

1. **Set up modular structure**:
   - Define 3-5 core modules
   - Create interface boundaries
   - Document dependency rules

2. **Plan for future extraction**:
   - Keep modules loosely coupled
   - Use dependency injection
   - Avoid direct database access across modules

3. **Monitor and measure**:
   - Track which parts have scaling needs
   - Monitor performance by module
   - Identify extraction candidates early

4. **DevOps foundation**:
   - Set up solid CI/CD for monolith
   - Add proper logging and monitoring
   - Containerize (Docker) for deployment flexibility

**Recommended reading**:
- "Monolith to Microservices" by Sam Newman
- "The Phoenix Project" for DevOps context
```

</details>

---

## Best Practices

<details>
<summary><strong>How to Get Better Expert Advice</strong></summary>

### 1. Choose the Right Domain

Select the domain that best matches your question. When in doubt, use `general`.

### 2. Provide Context

Include relevant details about your situation:

```json
{
  "context": "Series A startup, 10-person eng team, Rails monolith, 50K users, growing 20% MoM"
}
```

### 3. Specify Constraints

Be explicit about limitations:

```json
{
  "constraints": [
    "Must stay on AWS (existing contract)",
    "Team has no Kubernetes experience",
    "Need SOC 2 compliance"
  ]
}
```

### 4. Ask Specific Questions

More specific questions get better answers:

❌ "How do I improve performance?"
✅ "How can I reduce API response time from 500ms to <100ms for user dashboard queries?"

</details>

---

## Related Tools

- **[think-about-plan](./think-about-plan.md)** - Get feedback on implementation plans
- **[suggest-alternative](./suggest-alternative.md)** - Explore alternative approaches
- **[solve-problem](./solve-problem.md)** - Debug specific technical issues

---

## Getting Help

- 💬 [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)
- 🐛 [Report an Issue](https://github.com/effatico/kortx-mcp/issues)
