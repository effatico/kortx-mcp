# Copliot Integration Guide

This guide will help you set up MCP Consultant with Copliot, the AI-powered coding assistant.

---

## Prerequisites

- Copliot installed
- Node.js >= 22.12.0
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

---

## Quick Setup

### 1. Locate Your Copliot Config File

The location depends on your operating system and Copliot installation:

- **macOS**: `~/.copliot/config.json` or `~/Library/Application Support/Copliot/config.json`
- **Linux**: `~/.config/copliot/config.json`
- **Windows**: `%APPDATA%\Copliot\config.json`

### 2. Add MCP Consultant Configuration

Edit the config file and add the consultant server:

```json
{
  "mcp": {
    "servers": {
      "consultant": {
        "command": "npx",
        "args": ["-y", "kortx-mcp"],
        "env": {
          "OPENAI_API_KEY": "sk-your-api-key-here"
        }
      }
    }
  }
}
```

### 3. Restart Copliot

Restart Copliot to load the new configuration.

---

## Configuration Options

### Basic Configuration (Recommended)

```json
{
  "mcp": {
    "servers": {
      "consultant": {
        "command": "npx",
        "args": ["-y", "kortx-mcp"],
        "env": {
          "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
        }
      }
    }
  }
}
```

### Advanced Configuration

```json
{
  "mcp": {
    "servers": {
      "consultant": {
        "command": "npx",
        "args": ["-y", "kortx-mcp"],
        "env": {
          "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
          "OPENAI_MODEL": "gpt-5-mini",
          "OPENAI_REASONING_EFFORT": "minimal",
          "LOG_LEVEL": "info",
          "ENABLE_SERENA": "true",
          "ENABLE_MEMORY": "true",
          "ENABLE_CCLSP": "true"
        }
      }
    }
  }
}
```

### Using Environment Variables

```bash
# Add to your ~/.bashrc, ~/.zshrc, or equivalent
export OPENAI_API_KEY="sk-your-api-key-here"
```

Then reference in the config:

```json
{
  "env": {
    "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
  }
}
```

---

## Verifying Installation

### Check Available Tools

In Copliot, the consultant should provide four tools:

- `think-about-plan`
- `suggest-alternative`
- `improve-copy`
- `solve-problem`

### Test the Integration

Try asking Copliot:

```
Use the consultant to think about my plan to implement OAuth 2.0 authentication
```

---

## Usage Examples

### Strategic Planning

```
I'm planning to migrate from MongoDB to PostgreSQL. Our current database
has 50GB of data across 20 collections. We need zero downtime and
want to maintain data consistency. What do you think of this approach?
```

### Getting Alternatives

```
I'm using WebSockets for real-time updates. Can you suggest alternatives
that work better on mobile with intermittent connectivity?
```

### Improving Copy

```
Can you improve this user-facing error message:
"Error: Invalid input. Check your data and try again."
```

### Problem Solving

```
My application is consuming more memory over time (memory leak).
I've checked event listeners (properly cleaned up) and database
connections (pooled correctly). What else could cause this?
```

---

## Model Selection

Choose the right model for your needs:

### gpt-5-mini (Default)

- Fast responses
- Cost-effective
- Good for general consultation

### gpt-5

- Deep reasoning
- Complex analysis
- Best for architectural decisions

### gpt-5-nano

- Fastest
- Most economical
- Simple tasks

```json
{
  "env": {
    "OPENAI_MODEL": "gpt-5-mini" // or "gpt-5", "gpt-5-nano"
  }
}
```

---

## Reasoning Effort

Control how much thinking GPT-5 does:

```json
{
  "env": {
    "OPENAI_REASONING_EFFORT": "minimal" // minimal, low, medium, high
  }
}
```

- **minimal**: Fastest, fewest tokens
- **low**: Quick, some reasoning
- **medium**: Balanced
- **high**: Thorough analysis, slower

---

## Context Gathering

Configure what context is sent to the consultant:

```json
{
  "env": {
    "ENABLE_SERENA": "true", // Semantic code search
    "ENABLE_MEMORY": "true", // Knowledge graph
    "ENABLE_CCLSP": "true", // Language server
    "INCLUDE_FILE_CONTENT": "false", // Send file contents
    "INCLUDE_GIT_HISTORY": "false", // Send git history
    "MAX_CONTEXT_TOKENS": "16000" // Context limit
  }
}
```

**Privacy Note**: Enabling context gathering sends code to OpenAI's API. Disable for sensitive projects.

---

## Troubleshooting

### Consultant Not Available

1. Check config file syntax (must be valid JSON)
2. Verify API key is correct
3. Restart Copliot
4. Check logs in Copliot's output panel

### API Key Errors

1. Ensure API key starts with `sk-`
2. Verify the key is active in OpenAI dashboard
3. Check for sufficient quota

### Slow Responses

1. Use `gpt-5-mini` instead of `gpt-5`
2. Set reasoning to `minimal`
3. Reduce context token limit

```json
{
  "env": {
    "OPENAI_MODEL": "gpt-5-mini",
    "OPENAI_REASONING_EFFORT": "minimal",
    "MAX_CONTEXT_TOKENS": "8000"
  }
}
```

---

## Best Practices

1. **Start Simple**: Use defaults first, optimize later
2. **Secure API Keys**: Use environment variables
3. **Monitor Costs**: Track OpenAI API usage
4. **Optimize Context**: Only enable what you need
5. **Review Privacy**: Be mindful of sensitive code

---

## Next Steps

- 📖 Read the [API Documentation](../api/)
- 🎯 Check out [Example Workflows](../../examples/)
- 🔧 Explore [Configuration Options](../configuration.md)
- 💬 Join [GitHub Discussions](https://github.com/amsv01/kortx-mcp/discussions)

---

## Getting Help

- 📖 [Troubleshooting Guide](../troubleshooting.md)
- 💬 [GitHub Discussions](https://github.com/amsv01/kortx-mcp/discussions)
- 🐛 [Report an Issue](https://github.com/amsv01/kortx-mcp/issues)
- 📧 [Email Support](mailto:amin@effati.se)
