# suggest-alternative API Documentation

Request alternative approaches or solutions to your current implementation or plan.

---

## Overview

The `suggest-alternative` tool provides different perspectives and alternative solutions to your proposed approach. It considers different paradigms, simpler solutions, proven patterns, trade-offs, and edge cases you might not have considered.

**Use this tool when:**

- Seeking different approaches to a problem
- Want to explore options before committing
- Current solution has limitations
- Looking for simpler or more elegant solutions
- Need to compare trade-offs

---

## API Signature

```typescript
tool("suggest-alternative", {
  current_approach: string;  // Your current approach or solution
  context?: string;          // Additional context (optional)
})
```

---

## Parameters

### `current_approach` (required)

Description of your current approach or the problem you're solving.

- **Type**: String
- **Required**: Yes
- **Recommended length**: 50-300 words

### `context` (optional)

Additional context about constraints, requirements, or tried approaches.

- **Type**: String
- **Required**: No

---

## Response Format

Returns a structured comparison of alternatives:

1. **Alternative Approaches** (typically 3-5 options)
   - Description of each approach
   - How it differs from current approach
   - When to use it

2. **Pros and Cons** for each alternative
   - Advantages
   - Disadvantages
   - Trade-offs

3. **Recommendations**
   - Best fit based on context
   - Considerations for selection

---

## Example Usage

### Example 1: State Management

**Input:**

```json
{
  "current_approach": "Using Redux for state management in React app",
  "context": "Small team, simple CRUD app, 20 components"
}
```

**Response:**

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

---

### Example 2: API Communication

**Input:**

```json
{
  "current_approach": "Using WebSockets for real-time notifications in mobile app",
  "context": "Battery life is a concern, connection is intermittent"
}
```

**Response:**

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

---

## Best Practices

### 1. Describe Your Current Approach Clearly

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
  "context": "Considered PostgreSQL full-text search but concerned about performance"
}
```

---

## Common Use Cases

- Technology selection
- Architecture patterns
- Algorithm choices
- Tool and library selection
- Deployment strategies
- Testing approaches

---

## Related Tools

- **think-about-plan**: Evaluate a specific plan
- **solve-problem**: Debug implementation issues

---

## Next Steps

- 📖 [think-about-plan documentation](./think-about-plan.md)
- 🎯 [Example Workflows](../../examples/)

---

## Getting Help

- 💬 [GitHub Discussions](https://github.com/amsv01/llm-consultants/discussions)
- 🐛 [Report an Issue](https://github.com/amsv01/llm-consultants/issues)
