# Configuration Guide

Complete reference for configuring MCP Consultant.

---

## Table of Contents

- [Environment Variables](#environment-variables)
- [Model Configuration](#model-configuration)
- [Context Gathering](#context-gathering)
- [Server Configuration](#server-configuration)
- [Logging Configuration](#logging-configuration)
- [Configuration Examples](#configuration-examples)

---

## Environment Variables

### Required

#### `OPENAI_API_KEY`

Your OpenAI API key for accessing GPT-5 models.

- **Required**: Yes
- **Format**: String starting with `sk-`
- **Example**: `sk-proj-abcd1234...`
- **How to get**: [OpenAI API Keys](https://platform.openai.com/api-keys)

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

---

## Model Configuration

### `OPENAI_MODEL`

The GPT-5 model to use for consultations.

- **Required**: No
- **Default**: `gpt-5-mini`
- **Valid values**: `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-5-codex`
- **Example**: `OPENAI_MODEL=gpt-5-mini`

#### Model Comparison

| Model           | Speed     | Cost | Reasoning | Best For                                   |
| --------------- | --------- | ---- | --------- | ------------------------------------------ |
| **gpt-5**       | Moderate  | $$$  | Excellent | Complex reasoning, architectural decisions |
| **gpt-5-mini**  | Fast      | $$   | Good      | General consultation, balanced use         |
| **gpt-5-nano**  | Very Fast | $    | Basic     | High-throughput, simple questions          |
| **gpt-5-codex** | Moderate  | $$$  | Excellent | Code generation, refactoring, debugging    |

```bash
# Fast and economical (recommended)
OPENAI_MODEL=gpt-5-mini

# Deep reasoning for complex tasks
OPENAI_MODEL=gpt-5

# Highest throughput for simple tasks
OPENAI_MODEL=gpt-5-nano

# Code-focused tasks
OPENAI_MODEL=gpt-5-codex
```

---

### `OPENAI_REASONING_EFFORT`

Controls how much reasoning the model performs before responding.

- **Required**: No
- **Default**: `minimal`
- **Valid values**: `minimal`, `low`, `medium`, `high`
- **Example**: `OPENAI_REASONING_EFFORT=minimal`

#### Reasoning Effort Levels

| Level       | Speed     | Token Usage | Best For                            |
| ----------- | --------- | ----------- | ----------------------------------- |
| **minimal** | Very Fast | Lowest      | Quick feedback, simple questions    |
| **low**     | Fast      | Low         | Moderate complexity tasks           |
| **medium**  | Moderate  | Medium      | Standard complexity analysis        |
| **high**    | Slower    | Higher      | Complex decisions, critical systems |

**Impact on Performance:**

- **minimal**: ~0.5-1s time-to-first-token
- **low**: ~1-2s time-to-first-token
- **medium**: ~2-4s time-to-first-token
- **high**: ~4-8s time-to-first-token

```bash
# Fastest responses (default, recommended)
OPENAI_REASONING_EFFORT=minimal

# Balanced approach
OPENAI_REASONING_EFFORT=medium

# Thorough analysis for critical decisions
OPENAI_REASONING_EFFORT=high
```

---

### `OPENAI_VERBOSITY`

Controls how detailed the model's responses are.

- **Required**: No
- **Default**: `low`
- **Valid values**: `low`, `medium`, `high`
- **Example**: `OPENAI_VERBOSITY=low`

```bash
# Concise responses (recommended)
OPENAI_VERBOSITY=low

# Balanced detail
OPENAI_VERBOSITY=medium

# Comprehensive explanations
OPENAI_VERBOSITY=high
```

---

### `OPENAI_MAX_TOKENS`

Maximum number of tokens in the model's response.

- **Required**: No
- **Default**: `1024`
- **Valid range**: `1` to `16384`
- **Example**: `OPENAI_MAX_TOKENS=2048`

**Guidelines:**

- **512-1024**: Quick answers, concise feedback
- **2048**: Standard responses with detail
- **4096**: Comprehensive analysis
- **8192+**: Extensive documentation or complex explanations

```bash
# Concise responses (default)
OPENAI_MAX_TOKENS=1024

# Detailed responses
OPENAI_MAX_TOKENS=2048

# Comprehensive analysis
OPENAI_MAX_TOKENS=4096
```

---

## Context Gathering

Context gathering allows the consultant to access information from your codebase automatically.

### `ENABLE_SERENA`

Enable Serena MCP for semantic code search and symbol navigation. When enabled, this provides semantic code search, symbol definitions and references, code structure understanding, and function or class navigation.

- **Required**: No
- **Default**: `true`
- **Valid values**: `true`, `false`
- **Example**: `ENABLE_SERENA=true`

```bash
# Enable Serena (recommended if installed)
ENABLE_SERENA=true

# Disable Serena
ENABLE_SERENA=false
```

---

### `ENABLE_MEMORY`

Enable the MCP Knowledge Graph server (commonly published as `graph-memory`) for knowledge graph and project memory. This provides a project knowledge graph, entity relationships, historical context, and persistent memory across sessions.

- **Required**: No
- **Default**: `true`
- **Valid values**: `true`, `false`
- **Example**: `ENABLE_MEMORY=true`

```bash
# Enable memory (recommended if installed)
ENABLE_MEMORY=true

# Disable memory
ENABLE_MEMORY=false
```

---

### `ENABLE_CCLSP`

Enable CCLSP MCP for language server protocol features including type information, code intelligence, and diagnostics.

- **Required**: No
- **Default**: `true`
- **Valid values**: `true`, `false`
- **Example**: `ENABLE_CCLSP=true`

```bash
# Enable CCLSP (recommended if installed)
ENABLE_CCLSP=true

# Disable CCLSP
ENABLE_CCLSP=false
```

---

### `INCLUDE_FILE_CONTENT`

Include actual file contents in context.

- **Required**: No
- **Default**: `true`
- **Valid values**: `true`, `false`
- **Example**: `INCLUDE_FILE_CONTENT=false`

**⚠️ Privacy Consideration**: When enabled, file contents are sent to OpenAI's API.

```bash
# Include file contents (default)
INCLUDE_FILE_CONTENT=true

# Only include file metadata, not contents
INCLUDE_FILE_CONTENT=false
```

---

### `INCLUDE_GIT_HISTORY`

Include recent git commit history in context, providing recent commits, change history, author information, and commit messages.

- **Required**: No
- **Default**: `false`
- **Valid values**: `true`, `false`
- **Example**: `INCLUDE_GIT_HISTORY=true`

```bash
# Include git history
INCLUDE_GIT_HISTORY=true

# Don't include git history (default)
INCLUDE_GIT_HISTORY=false
```

---

### `MAX_CONTEXT_TOKENS`

Maximum number of tokens to use for gathered context.

- **Required**: No
- **Default**: `32000`
- **Valid range**: `1000` to `128000`
- **Example**: `MAX_CONTEXT_TOKENS=16000`

**Guidelines:**

- **8000**: Minimal context, faster responses
- **16000**: Balanced context
- **32000**: Comprehensive context (default)
- **64000+**: Very detailed context (slower, more expensive)

```bash
# Minimal context
MAX_CONTEXT_TOKENS=8000

# Balanced (default)
MAX_CONTEXT_TOKENS=32000

# Comprehensive
MAX_CONTEXT_TOKENS=64000
```

---

## Server Configuration

### `LOG_LEVEL`

Logging verbosity level.

- **Required**: No
- **Default**: `info`
- **Valid values**: `debug`, `info`, `warn`, `error`
- **Example**: `LOG_LEVEL=info`

| Level     | What Gets Logged                                           |
| --------- | ---------------------------------------------------------- |
| **debug** | Everything: requests, responses, context gathering, errors |
| **info**  | Normal operations, tool calls, errors                      |
| **warn**  | Warnings and errors only                                   |
| **error** | Errors only                                                |

```bash
# Detailed debugging (development)
LOG_LEVEL=debug

# Normal operations (production, default)
LOG_LEVEL=info

# Minimal logging
LOG_LEVEL=warn
```

### `AUDIT_LOGGING`

Enable audit logging to `.audit/kortx-mcp.log` file.

- **Required**: No
- **Default**: `false`
- **Valid values**: `true`, `false`
- **Example**: `AUDIT_LOGGING=true`

When enabled with `stdio` transport, logs are written to `.audit/kortx-mcp.log` instead of being discarded. The `.audit` directory is automatically created if it doesn't exist and is excluded from version control.

When disabled (default), logs are not persisted to disk unless you're using a non-stdio transport in development mode.

```bash
# Enable audit logging for compliance or debugging
AUDIT_LOGGING=true

# Disable audit logging (default)
AUDIT_LOGGING=false
```

**⚠️ Security Note**: Never use `debug` level in production with sensitive data.

---

### `TRANSPORT`

MCP transport protocol.

- **Required**: No
- **Default**: `stdio`
- **Valid values**: `stdio`, `streaming`
- **Example**: `TRANSPORT=stdio`

```bash
# Standard I/O (required for Claude Code)
TRANSPORT=stdio

# Streaming (for servers supporting it)
TRANSPORT=streaming
```

---

### `SERVER_NAME`

Custom server name for identification.

- **Required**: No
- **Default**: `kortx-mcp`
- **Example**: `SERVER_NAME=my-consultant`

```bash
SERVER_NAME=kortx-mcp
```

---

### `SERVER_VERSION`

Custom server version string.

- **Required**: No
- **Default**: From `package.json`
- **Example**: `SERVER_VERSION=1.0.0`

```bash
SERVER_VERSION=1.0.0
```

---

### `PORT`

Server port (for non-stdio transports).

- **Required**: No
- **Default**: `3000`
- **Valid range**: `1024` to `65535`
- **Example**: `PORT=3000`

```bash
PORT=3000
```

---

## Logging Configuration

### Log File Location

Logs are written to:

- **Global install**: `~/.kortx-mcp/logs/kortx-mcp.log`
- **Local development**: `./logs/kortx-mcp.log`

### Log Format

Structured JSON logs using Pino:

```json
{
  "level": 30,
  "time": 1703001234567,
  "msg": "Tool called: think-about-plan",
  "tool": "think-about-plan",
  "model": "gpt-5-mini",
  "reasoningEffort": "minimal"
}
```

### Sensitive Data Redaction

API keys and tokens are automatically redacted:

```json
{
  "apiKey": "[REDACTED]",
  "authorization": "[REDACTED]"
}
```

---

## Configuration Examples

### Development Configuration

Fast feedback for local development:

```bash
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=minimal
OPENAI_MAX_TOKENS=1024
LOG_LEVEL=debug
ENABLE_SERENA=true
ENABLE_MEMORY=true
ENABLE_CCLSP=true
MAX_CONTEXT_TOKENS=16000
```

---

### Production Configuration

Balanced performance and capability:

```bash
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=minimal
OPENAI_MAX_TOKENS=2048
LOG_LEVEL=info
ENABLE_SERENA=true
ENABLE_MEMORY=true
ENABLE_CCLSP=true
INCLUDE_FILE_CONTENT=true
INCLUDE_GIT_HISTORY=false
MAX_CONTEXT_TOKENS=32000
```

---

### High-Quality Analysis

Deep reasoning for critical decisions:

```bash
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-5
OPENAI_REASONING_EFFORT=high
OPENAI_VERBOSITY=high
OPENAI_MAX_TOKENS=4096
LOG_LEVEL=info
ENABLE_SERENA=true
ENABLE_MEMORY=true
ENABLE_CCLSP=true
INCLUDE_FILE_CONTENT=true
INCLUDE_GIT_HISTORY=true
MAX_CONTEXT_TOKENS=64000
```

---

### Cost-Optimized Configuration

Minimize API costs:

```bash
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-5-nano
OPENAI_REASONING_EFFORT=minimal
OPENAI_MAX_TOKENS=512
LOG_LEVEL=warn
ENABLE_SERENA=false
ENABLE_MEMORY=false
ENABLE_CCLSP=false
INCLUDE_FILE_CONTENT=false
INCLUDE_GIT_HISTORY=false
MAX_CONTEXT_TOKENS=8000
```

---

### Privacy-Focused Configuration

Minimal data sent to OpenAI:

```bash
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=minimal
OPENAI_MAX_TOKENS=1024
LOG_LEVEL=warn
ENABLE_SERENA=false
ENABLE_MEMORY=false
ENABLE_CCLSP=false
INCLUDE_FILE_CONTENT=false
INCLUDE_GIT_HISTORY=false
MAX_CONTEXT_TOKENS=1000
```

---

### High-Throughput Configuration

Maximum speed for many quick consultations:

```bash
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-5-nano
OPENAI_REASONING_EFFORT=minimal
OPENAI_VERBOSITY=low
OPENAI_MAX_TOKENS=512
LOG_LEVEL=error
ENABLE_SERENA=false
ENABLE_MEMORY=false
ENABLE_CCLSP=false
INCLUDE_FILE_CONTENT=false
MAX_CONTEXT_TOKENS=4000
```

---

## Configuration by Use Case

### For Individual Developers

```bash
OPENAI_API_KEY=${env:OPENAI_API_KEY}
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=minimal
LOG_LEVEL=info
ENABLE_SERENA=true
ENABLE_MEMORY=true
```

---

### For Enterprise Teams

```bash
OPENAI_API_KEY=${env:OPENAI_API_KEY}
OPENAI_MODEL=gpt-5
OPENAI_REASONING_EFFORT=medium
OPENAI_MAX_TOKENS=2048
LOG_LEVEL=info
ENABLE_SERENA=true
ENABLE_MEMORY=true
ENABLE_CCLSP=true
MAX_CONTEXT_TOKENS=32000
```

---

### For Compliance-Restricted Environments

```bash
OPENAI_API_KEY=${env:OPENAI_API_KEY}
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=minimal
ENABLE_SERENA=false
ENABLE_MEMORY=false
ENABLE_CCLSP=false
INCLUDE_FILE_CONTENT=false
INCLUDE_GIT_HISTORY=false
```

---

### For Education/Learning

```bash
OPENAI_API_KEY=${env:OPENAI_API_KEY}
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=medium
OPENAI_VERBOSITY=high
OPENAI_MAX_TOKENS=4096
LOG_LEVEL=debug
```

---

## Best Practices

Begin with the recommended defaults (`gpt-5-mini` with `minimal` reasoning) and adjust based on your needs. Never hardcode API keys - always use environment variables or secrets management.

Monitor API costs through the [OpenAI Dashboard](https://platform.openai.com/usage). For quick feedback, use `gpt-5-mini` with `minimal` reasoning. For complex analysis, use `gpt-5` with `high` reasoning. When cost-sensitive, choose `gpt-5-nano` with `minimal` reasoning.

Be mindful of what context gets sent to OpenAI. For sensitive projects, disable file content and git history inclusion. Use `debug` logging during development, `info` for production, and `warn` for high-traffic production environments.

---

## Environment File (.env)

Create a `.env` file in your project root:

```bash
# .env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=minimal
LOG_LEVEL=info
```

**Important**: Add `.env` to `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

Create `.env.example` for documentation:

```bash
# .env.example
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=minimal
LOG_LEVEL=info
```

---

## Validation

MCP Consultant validates configuration on startup:

### Valid Configuration

```bash
✓ Configuration loaded successfully
✓ OpenAI API key present
✓ Model: gpt-5-mini
✓ Reasoning effort: minimal
✓ Context gathering: Serena, Memory, CCLSP enabled
```

### Invalid Configuration

```bash
✗ Configuration error: OPENAI_API_KEY is required
✗ Invalid model: gpt-4-turbo (must be gpt-5, gpt-5-mini, gpt-5-nano, or gpt-5-codex)
✗ Invalid reasoning effort: extreme (must be minimal, low, medium, or high)
```

---

## Next Steps

- 📖 [Integration Guides](./integration/)
- 🎯 [API Documentation](./api/)
- 📝 [Example Workflows](../examples/)
- 🔒 [Security Best Practices](../SECURITY.md)

---

## Getting Help

- 📖 [Troubleshooting Guide](./troubleshooting.md)
- 💬 [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)
- 🐛 [Report an Issue](https://github.com/effatico/kortx-mcp/issues)
- 📧 [Email Support](mailto:info@effati.se)
