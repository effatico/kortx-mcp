# improve-copy API Documentation

Improve text, documentation, or user-facing messages for clarity, conciseness, tone, and accessibility.

---

## Overview

The `improve-copy` tool enhances written content including error messages, documentation, user interface text, API responses, and marketing copy. It focuses on clarity, conciseness, appropriate tone, proper structure, and accessibility.

**Use this tool when:**

- Writing user-facing error messages
- Drafting documentation
- Creating UI copy
- Improving README files
- Refining API responses
- Writing release notes

---

## API Signature

```typescript
tool("improve-copy", {
  text: string;           // The text to improve
  context?: string;       // Where this text will be used (optional)
  target_audience?: string; // Who will read this (optional)
})
```

---

## Parameters

### `text` (required)

The text you want to improve.

- **Type**: String
- **Required**: Yes

### `context` (optional)

Where this text will be used (error message, README, API docs, etc.).

- **Type**: String
- **Required**: No

### `target_audience` (optional)

Who will read this text (developers, end users, executives, etc.).

- **Type**: String
- **Required**: No

---

## Response Format

Returns:

1. **Improved Version**: The enhanced text
2. **Explanation**: What was changed and why
3. **Reasoning**: Principles applied (clarity, tone, accessibility)

---

## Example Usage

### Example 1: Error Message

**Input:**

```json
{
  "text": "Error 500: Internal server error occurred. Contact administrator.",
  "context": "User-facing error message in SaaS application",
  "target_audience": "Non-technical business users"
}
```

**Response:**

```markdown
## Improved Version

**Something went wrong on our end**

We're sorry, but we encountered an unexpected error while processing your request.
Our team has been notified and is working to fix it.

**What you can do:**

- Try again in a few minutes
- If the problem persists, contact support at support@company.com
- Reference error code: #ERR-500-2024-01-15-1234

## Changes Made

1. **Removed jargon**: "Internal server error" → "unexpected error"
2. **Apologized**: Shows empathy and responsibility
3. **Added context**: Explains we're aware and working on it
4. **Actionable guidance**: Clear next steps for user
5. **Error reference**: For support tracking without exposing technical details
6. **Friendly tone**: Professional but approachable

## Reasoning

- **Clarity**: Users understand what happened without technical knowledge
- **Tone**: Apologetic and helpful, not defensive
- **Actionability**: Users know what to do next
- **Professionalism**: Maintains trust while acknowledging error
```

---

### Example 2: README Section

**Input:**

```json
{
  "text": "This tool does stuff with files. It's fast and works good.",
  "context": "README introduction",
  "target_audience": "Developers evaluating the tool"
}
```

**Response:**

```markdown
## Improved Version

**A high-performance file processing utility that streamlines your workflow.**

Built for developers who need fast, reliable file operations without the complexity.
Process thousands of files in seconds with an intuitive API and zero configuration.

## Changes Made

1. **Specific value proposition**: "file processing utility" instead of "does stuff"
2. **Quantifiable**: "Process thousands of files in seconds"
3. **Clear benefits**: "fast, reliable", "intuitive API", "zero configuration"
4. **Professional tone**: Removed casual "good", "stuff"
5. **Target audience clarity**: "Built for developers"

## Reasoning

- **Clarity**: Specific about what the tool does
- **Professionalism**: Technical but accessible language
- **Value-focused**: Emphasizes benefits over features
- **Credibility**: Concrete claims ("thousands of files in seconds")
```

---

## Best Practices

### 1. Provide Context

Helps tailor tone and style appropriately:

```json
{
  "context": "Error message in healthcare app (HIPAA compliant environment)",
  "target_audience": "Medical professionals"
}
```

### 2. Specify Audience

Different audiences need different approaches:

- **Developers**: Technical, precise, actionable
- **End users**: Simple, friendly, reassuring
- **Executives**: Business-focused, outcome-oriented

### 3. Include Original Intent

If the text has specific requirements:

```json
{
  "context": "Must maintain professional tone, max 100 characters"
}
```

---

## Common Use Cases

### Error Messages

- API error responses
- Validation errors
- System failures
- User mistakes

### Documentation

- README files
- API documentation
- User guides
- Inline comments

### UI Copy

- Button labels
- Form labels
- Help text
- Tooltips

### Marketing

- Feature descriptions
- Landing page copy
- Release announcements

---

## Related Tools

- **think-about-plan**: Get feedback on documentation structure
- **solve-problem**: Debug unclear or confusing content

---

## Next Steps

- 📖 [Full API Documentation](./README.md)
- 🎯 [Example Workflows](../../examples/)

---

## Getting Help

- 💬 [GitHub Discussions](https://github.com/amsv01/llm-consultants/discussions)
- 🐛 [Report an Issue](https://github.com/amsv01/llm-consultants/issues)
