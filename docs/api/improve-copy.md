# improve-copy

Enhance written content for clarity, conciseness, appropriate tone, and accessibility. Works with error messages, documentation, UI text, API responses, and marketing copy.

---

## Quick Start

Improve any text in seconds:

```json
{
  "originalText": "Error 500: Internal server error occurred. Contact administrator.",
  "purpose": "User-facing error message",
  "targetAudience": "Non-technical business users"
}
```

The tool returns improved text with explanations of changes and reasoning.

---

## How to Use

Choose your depth based on your needs:

<details open>
<summary><strong>Minimal</strong> - Quick polish (30 seconds)</summary>

**When to use**: You have decent text and need quick improvements.

**Example**:

```json
{
  "originalText": "This tool does stuff with files. It's fast and works good."
}
```

**What you get**: Improved version with key changes highlighted.

</details>

<details>
<summary><strong>Standard</strong> - Comprehensive improvement (recommended)</summary>

**When to use**: Important user-facing content that needs to be polished.

**Example**:

```json
{
  "originalText": "Authentication failed. Try again or contact support.",
  "purpose": "Error message in SaaS application",
  "targetAudience": "Business users"
}
```

**What you get**:

- Improved version with better tone and clarity
- Detailed explanation of what was changed
- Reasoning based on best practices (clarity, empathy, actionability)
- Alternative versions for different contexts

</details>

<details>
<summary><strong>Advanced</strong> - Strategic content optimization</summary>

**When to use**: Critical content like product launches, legal notices, or high-stakes communication.

**Example**:

```json
{
  "originalText": "Our new API is available. It has better performance and new features. Check the docs.",
  "purpose": "Product launch announcement email",
  "targetAudience": "Existing API customers (developers and CTOs)"
}
```

**What you get**:

- Multiple polished versions for different tones (professional, enthusiastic, technical)
- Comprehensive analysis of tone, structure, and messaging
- Specific improvements for target audience
- SEO and accessibility considerations
- Call-to-action optimization

</details>

---

<details>
<summary><strong>API Reference</strong></summary>

### Parameters

| Parameter        | Type   | Required | Description                                                            |
| ---------------- | ------ | -------- | ---------------------------------------------------------------------- |
| `originalText`   | string | Yes      | The text to improve                                                    |
| `purpose`        | string | No       | Where this text will be used (error message, README, etc.)             |
| `targetAudience` | string | No       | Who will read this (developers, users, executives)                     |
| `preferredModel` | enum   | No       | GPT model: `gpt-5`, `gpt-5-mini`, `gpt-5-nano` (default: `gpt-5-mini`) |

### Response Structure

The tool returns:

1. **Improved Version** - The enhanced text
2. **Key Changes** - What was modified and why
3. **Reasoning** - Principles applied (clarity, tone, accessibility)
4. **Alternative Versions** (if applicable)

</details>

## Common Use Cases

### Error Messages

Make error messages helpful, empathetic, and actionable for users.

### Documentation

Transform technical documentation into clear, accessible content.

### UI Copy

Polish button labels, form text, tooltips, and help text.

### Marketing Content

Refine feature descriptions, landing pages, and announcements.

---

## Example: Error Message

<details>
<summary>View full example</summary>

**Input:**

```json
{
  "originalText": "Error 500: Internal server error occurred. Contact administrator.",
  "purpose": "User-facing error message in SaaS application",
  "targetAudience": "Non-technical business users"
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

</details>

---

## Example: README Section

<details>
<summary>View full example</summary>

**Input:**

```json
{
  "originalText": "This tool does stuff with files. It's fast and works good.",
  "purpose": "README introduction",
  "targetAudience": "Developers evaluating the tool"
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

</details>

---

## Best Practices

<details>
<summary><strong>How to Get Better Results</strong></summary>

### Provide Context

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
  "purpose": "Must maintain professional tone, max 100 characters"
}
```

</details>

---

## Related Tools

- **[think-about-plan](./think-about-plan.md)** - Get feedback on documentation structure
- **[suggest-alternative](./suggest-alternative.md)** - Explore different messaging approaches
- **[solve-problem](./solve-problem.md)** - Debug unclear or confusing content

---

## Next Steps

- 📖 [think-about-plan](./think-about-plan.md) - Plan strategic implementations
- 📖 [suggest-alternative](./suggest-alternative.md) - Explore alternatives
- 📖 [solve-problem](./solve-problem.md) - Debug and troubleshoot
- 🔧 [Configuration Guide](../configuration.md) - Customize behavior

---

## Getting Help

- 💬 [GitHub Discussions](https://github.com/amsv01/llm-consultants/discussions)
- 🐛 [Report an Issue](https://github.com/amsv01/llm-consultants/issues)
