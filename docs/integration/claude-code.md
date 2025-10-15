# Claude Code Integration Guide

This guide will help you set up MCP Consultant with Claude Code, Anthropic's official CLI for AI-assisted development.

---

## Prerequisites

- Claude Code installed ([Installation Guide](https://docs.claude.com/claude-code/installation))
- Node.js >= 22.18.0
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

---

## Quick Setup

The fastest way to add MCP Consultant to Claude Code:

```bash
# Using npx (recommended - no installation required)
claude mcp add consultant -- npx -y mcp-consultant

# Using global install
npm install -g mcp-consultant
claude mcp add consultant -- mcp-consultant
```

That's it! Claude Code will now have access to MCP Consultant's tools.

---

## Manual Configuration

If you prefer manual configuration or need more control:

### 1. Locate Your MCP Config File

The MCP configuration file location depends on your operating system:

- **macOS/Linux**: `~/.config/claude/mcp.json`
- **Windows**: `%APPDATA%\Claude\mcp.json`

### 2. Add MCP Consultant Configuration

Edit the config file and add the consultant server:

```json
{
  "mcpServers": {
    "consultant": {
      "command": "npx",
      "args": ["-y", "mcp-consultant"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key-here",
        "OPENAI_MODEL": "gpt-5-mini",
        "OPENAI_REASONING_EFFORT": "minimal",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 3. Restart Claude Code

```bash
# No restart needed - changes are picked up automatically
```

---

## Configuration Options

### Basic Configuration (Recommended)

For most users, this minimal configuration works best:

```json
{
  "mcpServers": {
    "consultant": {
      "command": "npx",
      "args": ["-y", "mcp-consultant"],
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
      }
    }
  }
}
```

This uses:

- `gpt-5-mini` model (fastest, cost-effective)
- `minimal` reasoning effort (quick responses)
- Default context gathering (Serena, memory, cclsp)

### Advanced Configuration

For more control over behavior:

```json
{
  "mcpServers": {
    "consultant": {
      "command": "npx",
      "args": ["-y", "mcp-consultant"],
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
        "OPENAI_MODEL": "gpt-5",
        "OPENAI_REASONING_EFFORT": "high",
        "OPENAI_VERBOSITY": "high",
        "OPENAI_MAX_TOKENS": "4096",
        "LOG_LEVEL": "debug",
        "ENABLE_SERENA": "true",
        "ENABLE_MEMORY": "true",
        "ENABLE_CCLSP": "true",
        "MAX_CONTEXT_TOKENS": "32000"
      }
    }
  }
}
```

### Using Environment Variables

For better security, reference environment variables:

```bash
# Add to your ~/.bashrc, ~/.zshrc, or equivalent
export OPENAI_API_KEY="sk-your-api-key-here"
```

```json
{
  "mcpServers": {
    "consultant": {
      "command": "npx",
      "args": ["-y", "mcp-consultant"],
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
      }
    }
  }
}
```

---

## Verifying Installation

### 1. Check MCP Server Status

```bash
claude mcp list
```

You should see `consultant` in the list of configured servers.

### 2. Test the Tools

In Claude Code, try asking:

```
Can you use the consultant to think about my plan to refactor the authentication system?
```

Claude Code should invoke the `think-about-plan` tool from MCP Consultant.

### 3. Check Available Tools

```bash
claude mcp inspect consultant
```

You should see four tools:

- `think-about-plan`
- `suggest-alternative`
- `improve-copy`
- `solve-problem`

---

## Usage Examples

### Strategic Planning

```
I'm planning to migrate our REST API to GraphQL. The API currently has
50+ endpoints serving 10k+ requests per day. We want to improve
developer experience and reduce over-fetching. What do you think?
```

Claude Code will use the `think-about-plan` tool to get strategic feedback from GPT-5.

### Getting Alternatives

```
I'm using Redis for caching user sessions. Can you suggest alternatives
considering we need cross-datacenter replication and want to minimize costs?
```

Claude Code will use the `suggest-alternative` tool.

### Improving Copy

```
Can you improve this error message:
"Error 500: Internal server error. Try again later."
```

Claude Code will use the `improve-copy` tool.

### Problem Solving

```
Users are experiencing intermittent 500 errors when uploading files > 10MB.
I've checked nginx timeout (60s), app timeout (30s), and server memory (8GB).
Errors occur randomly, not consistently. What could be wrong?
```

Claude Code will use the `solve-problem` tool.

---

## Model Selection Guide

Choose the right model for your use case:

### gpt-5-mini (Default)

- **Best for**: General consultation, quick feedback, cost-sensitive usage
- **Speed**: Fastest time-to-first-token
- **Cost**: Most economical
- **Reasoning**: Good for straightforward tasks
- **Use when**: You need fast responses and the task is relatively simple

### gpt-5

- **Best for**: Complex reasoning, architectural decisions, multi-step analysis
- **Speed**: Moderate
- **Cost**: Higher than mini
- **Reasoning**: Excellent for nuanced analysis
- **Use when**: Task requires deep reasoning or broad knowledge

### gpt-5-nano

- **Best for**: High-throughput scenarios, simple tasks
- **Speed**: Very fast
- **Cost**: Lowest
- **Reasoning**: Basic
- **Use when**: You need many quick consultations for simple questions

### Configuration Example

```json
{
  "mcpServers": {
    "consultant-mini": {
      "command": "npx",
      "args": ["-y", "mcp-consultant"],
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
        "OPENAI_MODEL": "gpt-5-mini",
        "OPENAI_REASONING_EFFORT": "minimal"
      }
    },
    "consultant-pro": {
      "command": "npx",
      "args": ["-y", "mcp-consultant"],
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
        "OPENAI_MODEL": "gpt-5",
        "OPENAI_REASONING_EFFORT": "high"
      }
    }
  }
}
```

Now you can choose which consultant to use based on the task complexity!

---

## Reasoning Effort Guide

Control how much reasoning GPT-5 performs:

### minimal (Default)

- **Speed**: Very fast, immediate responses
- **Tokens**: Few reasoning tokens consumed
- **Best for**: Quick feedback, simple questions, cost optimization
- **Example use**: "What do you think of this approach?"

### low

- **Speed**: Fast
- **Tokens**: Some reasoning tokens
- **Best for**: Moderate complexity tasks
- **Example use**: "Suggest alternatives to this implementation"

### medium

- **Speed**: Moderate
- **Tokens**: Balanced token usage
- **Best for**: Standard complexity analysis
- **Example use**: "Analyze this architecture design"

### high

- **Speed**: Slower, thorough analysis
- **Tokens**: More reasoning tokens
- **Best for**: Complex decisions, critical systems
- **Example use**: "Review our security architecture for a banking application"

### Configuration Example

```json
{
  "env": {
    "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
    "OPENAI_MODEL": "gpt-5-mini",
    "OPENAI_REASONING_EFFORT": "minimal" // Change to low, medium, or high
  }
}
```

---

## Context Gathering

MCP Consultant can automatically gather context from your codebase:

### What Gets Gathered

When enabled, the consultant can access:

- **Serena**: Semantic code search and symbol navigation
- **Memory**: Knowledge graph with project information
- **CCLSP**: Language server features and code intelligence
- **File Content**: Actual file contents (if enabled)
- **Git History**: Recent commits and changes (if enabled)

### Configuration

```json
{
  "env": {
    "ENABLE_SERENA": "true", // Semantic search
    "ENABLE_MEMORY": "true", // Knowledge graph
    "ENABLE_CCLSP": "true", // Language server
    "INCLUDE_FILE_CONTENT": "true", // Send file contents
    "INCLUDE_GIT_HISTORY": "false", // Send git history
    "MAX_CONTEXT_TOKENS": "32000" // Context limit
  }
}
```

### Privacy Considerations

Be aware that enabling context gathering sends code to OpenAI's API:

- ✅ **Enable** for private repositories or non-sensitive code
- ⚠️ **Consider disabling** for sensitive codebases
- 🔒 **Always disable** for compliance-restricted projects (HIPAA, PCI-DSS, etc.)

```json
{
  "env": {
    "ENABLE_SERENA": "false",
    "ENABLE_MEMORY": "false",
    "ENABLE_CCLSP": "false",
    "INCLUDE_FILE_CONTENT": "false"
  }
}
```

---

## Troubleshooting

### MCP Consultant Not Available

**Problem**: Claude Code doesn't show consultant tools

**Solutions**:

1. Check the MCP configuration file exists and is valid JSON
2. Verify the API key is set correctly
3. Restart Claude Code
4. Check logs: `~/.mcp-consultant/logs/mcp-consultant.log`

```bash
# Validate JSON syntax
cat ~/.config/claude/mcp.json | jq .

# Check if npx can find mcp-consultant
npx -y mcp-consultant --help
```

### API Key Errors

**Problem**: `Authentication failed` or `Invalid API key`

**Solutions**:

1. Verify API key is correct (starts with `sk-`)
2. Check environment variable is set: `echo $OPENAI_API_KEY`
3. Ensure API key has sufficient quota
4. Try regenerating the API key

```bash
# Test API key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Slow Responses

**Problem**: Consultant takes a long time to respond

**Solutions**:

1. Use `gpt-5-mini` instead of `gpt-5`
2. Set reasoning effort to `minimal` or `low`
3. Reduce `MAX_CONTEXT_TOKENS`
4. Disable unnecessary context gathering

```json
{
  "env": {
    "OPENAI_MODEL": "gpt-5-mini",
    "OPENAI_REASONING_EFFORT": "minimal",
    "MAX_CONTEXT_TOKENS": "8000"
  }
}
```

### Context Gathering Errors

**Problem**: Errors related to Serena, Memory, or CCLSP

**Solutions**:

1. Verify those MCP servers are installed and configured
2. Disable context gathering if not needed
3. Check logs for specific errors

```json
{
  "env": {
    "ENABLE_SERENA": "false",
    "ENABLE_MEMORY": "false",
    "ENABLE_CCLSP": "false"
  }
}
```

### High API Costs

**Problem**: OpenAI API costs are too high

**Solutions**:

1. Switch to `gpt-5-mini` or `gpt-5-nano`
2. Use `minimal` reasoning effort
3. Reduce max tokens
4. Disable context gathering

```json
{
  "env": {
    "OPENAI_MODEL": "gpt-5-nano",
    "OPENAI_REASONING_EFFORT": "minimal",
    "OPENAI_MAX_TOKENS": "512",
    "ENABLE_SERENA": "false",
    "ENABLE_MEMORY": "false",
    "ENABLE_CCLSP": "false"
  }
}
```

---

## Advanced Topics

### Running Local Development Version

For testing changes or development:

```bash
# Clone and build
git clone https://github.com/amsv01/mcp-consultant.git
cd mcp-consultant
npm install
npm run build

# Configure Claude Code to use local version
```

```json
{
  "mcpServers": {
    "consultant": {
      "command": "node",
      "args": ["/path/to/mcp-consultant/build/index.js"],
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Multiple Consultant Configurations

Run different configurations for different purposes:

```json
{
  "mcpServers": {
    "consultant-fast": {
      "command": "npx",
      "args": ["-y", "mcp-consultant"],
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
        "OPENAI_MODEL": "gpt-5-nano",
        "OPENAI_REASONING_EFFORT": "minimal"
      }
    },
    "consultant-deep": {
      "command": "npx",
      "args": ["-y", "mcp-consultant"],
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
        "OPENAI_MODEL": "gpt-5",
        "OPENAI_REASONING_EFFORT": "high"
      }
    }
  }
}
```

### Custom Logging

For debugging or monitoring:

```json
{
  "env": {
    "LOG_LEVEL": "debug",
    "LOG_FILE": "/custom/path/mcp-consultant.log"
  }
}
```

---

## Best Practices

### 1. Start with Defaults

Begin with `gpt-5-mini` and `minimal` reasoning effort. Upgrade only if needed.

### 2. Use Environment Variables

Keep API keys in environment variables, not in the config file.

### 3. Monitor Costs

Track your OpenAI API usage in the [OpenAI Dashboard](https://platform.openai.com/usage).

### 4. Secure Your API Key

- Never commit API keys to git
- Use `.env` files (already in `.gitignore`)
- Rotate keys regularly

### 5. Optimize Context

Only enable context gathering features you actually need.

### 6. Review Privacy

Be mindful of what code you're sending to OpenAI's API.

---

## Next Steps

- 📖 Read the [API Documentation](../api/) for detailed tool usage
- 🎯 Check out [Example Workflows](../../examples/)
- 🔧 Explore [Configuration Options](../configuration.md)
- 💬 Join the [GitHub Discussions](https://github.com/amsv01/mcp-consultant/discussions)

---

## Getting Help

- 📖 [Troubleshooting Guide](../troubleshooting.md)
- 💬 [GitHub Discussions](https://github.com/amsv01/mcp-consultant/discussions)
- 🐛 [Report an Issue](https://github.com/amsv01/mcp-consultant/issues)
- 📧 [Email Support](mailto:amin@effati.se)
