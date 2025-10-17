# suggest-alternative

Explore alternative approaches and solutions to your current implementation or plan. Considers different paradigms, simpler solutions, proven patterns, and trade-offs you might not have considered.

---

## Quick Start

Get alternative approaches in seconds:

```json
{
  "currentApproach": "Using Redux for state management in React app with 20 components"
}
```

The tool returns multiple alternatives with pros, cons, trade-offs, and recommendations based on your context.

---

## How to Use

Choose your depth based on your needs:

<details open>
<summary><strong>Minimal</strong> - Quick alternatives (30 seconds)</summary>

**When to use**: You have an approach and want to quickly see other options.

**Example**:

```json
{
  "currentApproach": "Using WebSockets for real-time notifications in mobile app"
}
```

**What you get**: 2-3 alternative approaches with brief pros/cons.

</details>

<details>
<summary><strong>Standard</strong> - Comprehensive comparison (recommended)</summary>

**When to use**: Evaluating technology choices and need detailed trade-off analysis.

**Example**:

```json
{
  "currentApproach": "Using Elasticsearch for product search, costs $500/mo for 100k products",
  "goals": ["Reduce costs", "Maintain search quality"],
  "constraints": ["Team has SQL experience, no Elasticsearch expertise", "Budget: $100/mo"]
}
```

**What you get**:

- 3-5 detailed alternatives with descriptions
- Comprehensive pros and cons for each option
- Trade-off analysis (cost vs performance, complexity vs features)
- Clear recommendations based on your constraints
- Implementation considerations

</details>

<details>
<summary><strong>Advanced</strong> - Strategic evaluation</summary>

**When to use**: Major technology decisions with significant architectural impact.

**Example**:

```json
{
  "currentApproach": "Planning to use PostgreSQL for time-series data, 1M writes/sec, 100GB/day growth",
  "goals": [
    "Handle high write throughput",
    "Cost-effective long-term storage",
    "Fast queries on recent data"
  ],
  "constraints": ["Team knows PostgreSQL well", "Budget: $2k/mo infrastructure", "Cannot lose data"]
}
```

**What you get**:

- Comprehensive architectural alternatives (TimescaleDB, InfluxDB, ClickHouse, hybrid solutions)
- Detailed trade-off matrices (performance, cost, complexity, team expertise)
- Migration paths for each alternative
- Total cost of ownership analysis
- Scalability projections
- Risk assessment for each approach

</details>

---

<details>
<summary><strong>API Reference</strong></summary>

### Parameters

| Parameter         | Type     | Required | Description                                                            |
| ----------------- | -------- | -------- | ---------------------------------------------------------------------- |
| `currentApproach` | string   | Yes      | Your current approach or problem (50-300 words recommended)            |
| `goals`           | string[] | No       | What you're trying to achieve                                          |
| `constraints`     | string[] | No       | Limitations (budget, team skills, time, technology)                    |
| `preferredModel`  | enum     | No       | GPT model: `gpt-5`, `gpt-5-mini`, `gpt-5-nano` (default: `gpt-5-mini`) |

### Response Structure

The tool returns structured alternatives:

1. **Alternative Approaches** (typically 3-5 options)
2. **Pros and Cons** for each alternative
3. **Trade-off Analysis**
4. **Recommendations** based on your context

</details>

## Common Use Cases

### Technology Selection

Compare different technologies for the same problem. Understand trade-offs before choosing your stack.

### Algorithm Choices

Explore different algorithmic approaches with complexity and performance trade-offs.

### Architecture Patterns

Evaluate architectural patterns and their suitability for your specific requirements.

### Tool and Library Selection

Compare tools and libraries with clear pros, cons, and use case recommendations.

---

## Task Playbooks

Jump to common scenarios:

- [State Management Alternatives](#example-state-management)
- [API Communication Patterns](#example-api-communication)
- [Search Solutions](#how-to-use)
- [Time-Series Databases](#how-to-use)

---

## Example: State Management

<details>
<summary>View full example with alternatives</summary>

**Input:**

```json
{
  "currentApproach": "Using Redux for state management in React app",
  "goals": ["Global state management", "Simple developer experience"],
  "constraints": ["Small team", "Simple CRUD app", "20 components"]
}
```

**Response Summary:**

```markdown
## Alternative 1: React Context + useReducer

**Description**: Built-in React solution for global state

**Pros:**

- No external dependencies
- Simpler setup
- Smaller bundle size
- Familiar to React developers

**Cons:**

- Less DevTools support
- Manual optimization needed
- No middleware ecosystem

**Best for**: Small to medium apps, simple state logic

## Alternative 2: Zustand

**Description**: Minimal state management with hooks

**Pros:**

- Much smaller than Redux (1KB vs 45KB)
- Simpler API
- No boilerplate
- Good TypeScript support

**Cons:**

- Smaller ecosystem
- Less mature
- Fewer learning resources

**Best for**: Apps needing global state without Redux complexity

## Alternative 3: Jotai

**Description**: Atomic state management

**Pros:**

- Atomic approach prevents unnecessary re-renders
- Minimal boilerplate
- Good TypeScript support
- Built-in async support

**Cons:**

- Different mental model
- Smaller community
- Learning curve

**Best for**: Performance-critical apps

## Recommendation

For a small CRUD app with 20 components, **Zustand** or **Context + useReducer**
are likely better fits than Redux. Redux adds unnecessary complexity for your scale.

Start with Context + useReducer (zero dependencies), move to Zustand if you
need better performance or more features.
```

</details>

---

## Example: API Communication

<details>
<summary>View full example with alternatives</summary>

**Input:**

```json
{
  "currentApproach": "Using WebSockets for real-time notifications in mobile app",
  "constraints": ["Battery life is a concern", "Connection is intermittent"]
}
```

**Response Summary:**

```markdown
## Alternative 1: Server-Sent Events (SSE)

**Description**: One-way real-time updates from server

**Pros:**

- Better battery life than WebSockets
- Automatic reconnection
- Works over HTTP (simpler infrastructure)
- Simpler than WebSockets

**Cons:**

- One-way only (server → client)
- Limited browser support on older devices
- No binary data support

**Best for**: Notification/update streams where client rarely sends data

## Alternative 2: Push Notifications + Polling

**Description**: OS push notifications with occasional API polling

**Pros:**

- Excellent battery life
- Works with device in background
- Native OS integration
- Reliable delivery

**Cons:**

- Push notification setup complexity
- Polling delay for immediate updates
- Requires FCM/APNS setup

**Best for**: Mobile apps where instant updates aren't critical

## Alternative 3: HTTP Long Polling

**Description**: Client holds request open until server has data

**Pros:**

- Works everywhere (HTTP)
- Better battery than constant polling
- Simple fallback mechanism
- No special infrastructure

**Cons:**

- Higher latency than WebSockets
- More server resources
- Connection management complexity

**Best for**: Apps needing real-time updates with maximum compatibility

## Recommendation

For mobile with intermittent connectivity and battery concerns, \*\*Push Notifications

- periodic polling\*\* is likely the best approach. Use push for important updates,
  poll every 30-60 seconds when app is active.

WebSockets are overkill and drain battery. SSE is better but still drains
battery more than push notifications.
```

</details>

---

## Best Practices

<details>
<summary><strong>How to Get Better Alternatives</strong></summary>

### Describe Your Current Approach Clearly

**Good:**

```json
{
  "current_approach": "Using Elasticsearch for product search, costs $500/mo for 100k products, query time ~100ms"
}
```

**Bad:**

```json
{
  "current_approach": "Using Elasticsearch"
}
```

### 2. Include Constraints in Context

```json
{
  "context": "Budget: $100/mo, Team: 2 developers, No DevOps experience"
}
```

### 3. Mention What You've Already Considered

```json
{
  "constraints": ["Considered PostgreSQL full-text search but concerned about performance"]
}
```

</details>

---

## Related Tools

- **[think-about-plan](./think-about-plan.md)** - Evaluate a specific implementation plan
- **[solve-problem](./solve-problem.md)** - Debug and troubleshoot issues
- **[improve-copy](./improve-copy.md)** - Enhance documentation and messaging

---

## Next Steps

- 📖 [think-about-plan](./think-about-plan.md) - Plan strategic implementations
- 📖 [solve-problem](./solve-problem.md) - Debug and troubleshoot
- 📖 [improve-copy](./improve-copy.md) - Refine your documentation
- 🔧 [Configuration Guide](../configuration.md) - Customize models and behavior

---

## Getting Help

- 💬 [GitHub Discussions](https://github.com/amsv01/kortx-mcp/discussions)
- 🐛 [Report an Issue](https://github.com/amsv01/kortx-mcp/issues)
