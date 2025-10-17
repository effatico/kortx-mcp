# Claude Code Integration Guide

This guide will help you set up MCP Consultant with Claude Code, Anthropic's official CLI for AI-assisted development.

---

## Prerequisites

- Claude Code installed ([Installation Guide](https://docs.claude.com/claude-code/installation))
- Node.js >= 22.12.0
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

---

## Quick Setup

The fastest way to add MCP Consultant to Claude Code:

```bash
# Using npx (recommended - no installation required)
claude mcp add --transport stdio consultant --env OPENAI_API_KEY=YOUR_KEY -- npx -y @effatico/kortx-mcp

# Using global install
npm install -g @effatico/kortx-mcp
claude mcp add --transport stdio consultant --env OPENAI_API_KEY=YOUR_KEY -- kortx-mcp
```

That's it! Claude Code will now have access to MCP Consultant's tools.

---

## Advanced Configuration

The recommended way to configure MCP servers is using the `claude mcp add` command shown above. However, if you need to understand the underlying configuration or manually edit settings, here's how the configuration is structured.

Claude Code stores MCP server configurations in JSON format. When you use `claude mcp add`, it automatically manages this configuration for you. The configuration file location depends on your operating system:

- **macOS/Linux**: `~/.config/claude/mcp.json`
- **Windows**: `%APPDATA%\Claude\mcp.json`

After running the `claude mcp add` command, your configuration will look like this:

```json
{
  "mcpServers": {
    "consultant": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@effatico/kortx-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

You can verify your configuration using:

```bash
# List all configured MCP servers
claude mcp list

# Get details for a specific server
claude mcp get consultant
```

---

## Configuration Options

### Basic Configuration (Recommended)

For most users, the basic setup command works best:

```bash
claude mcp add --transport stdio consultant --env OPENAI_API_KEY=YOUR_KEY -- npx -y @effatico/kortx-mcp
```

This uses:

- `gpt-5-mini` model (fastest, cost-effective)
- `minimal` reasoning effort (quick responses)
- Default context gathering (Serena, memory, cclsp)

### Advanced Configuration

For more control over behavior, you can add multiple environment variables:

```bash
claude mcp add --transport stdio consultant \
  --env OPENAI_API_KEY=YOUR_KEY \
  --env OPENAI_MODEL=gpt-5 \
  --env OPENAI_REASONING_EFFORT=high \
  --env OPENAI_VERBOSITY=high \
  --env OPENAI_MAX_TOKENS=4096 \
  --env LOG_LEVEL=debug \
  --env ENABLE_SERENA=true \
  --env ENABLE_MEMORY=true \
  --env ENABLE_CCLSP=true \
  --env MAX_CONTEXT_TOKENS=32000 \
  -- npx -y @effatico/kortx-mcp
```

### Using Environment Variables

For better security, set environment variables in your shell profile and reference them:

```bash
# Add to your ~/.bashrc, ~/.zshrc, or equivalent
export OPENAI_API_KEY="sk-your-api-key-here"
```

Then use the basic command without exposing the key:

```bash
claude mcp add --transport stdio consultant --env OPENAI_API_KEY=$OPENAI_API_KEY -- npx -y @effatico/kortx-mcp
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

You can set up multiple consultant configurations with different models:

```bash
# Fast consultant for quick tasks
claude mcp add --transport stdio consultant-mini \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5-mini \
  --env OPENAI_REASONING_EFFORT=minimal \
  -- npx -y @effatico/kortx-mcp

# Deep consultant for complex tasks
claude mcp add --transport stdio consultant-pro \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5 \
  --env OPENAI_REASONING_EFFORT=high \
  -- npx -y @effatico/kortx-mcp
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

```bash
# Change OPENAI_REASONING_EFFORT to low, medium, or high as needed
claude mcp add --transport stdio consultant \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5-mini \
  --env OPENAI_REASONING_EFFORT=minimal \
  -- npx -y @effatico/kortx-mcp
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

```bash
claude mcp add --transport stdio consultant \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env ENABLE_SERENA=true \
  --env ENABLE_MEMORY=true \
  --env ENABLE_CCLSP=true \
  --env INCLUDE_FILE_CONTENT=true \
  --env INCLUDE_GIT_HISTORY=false \
  --env MAX_CONTEXT_TOKENS=32000 \
  -- npx -y @effatico/kortx-mcp
```

### Privacy Considerations

Be aware that enabling context gathering sends code to OpenAI's API:

- ✅ **Enable** for private repositories or non-sensitive code
- ⚠️ **Consider disabling** for sensitive codebases
- 🔒 **Always disable** for compliance-restricted projects (HIPAA, PCI-DSS, etc.)

To disable context gathering:

```bash
claude mcp add --transport stdio consultant \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env ENABLE_SERENA=false \
  --env ENABLE_MEMORY=false \
  --env ENABLE_CCLSP=false \
  --env INCLUDE_FILE_CONTENT=false \
  -- npx -y @effatico/kortx-mcp
```

---

## Troubleshooting

### MCP Consultant Not Available

**Problem**: Claude Code doesn't show consultant tools

**Solutions**:

1. Check the MCP configuration file exists and is valid JSON
2. Verify the API key is set correctly
3. Restart Claude Code
4. Check logs: `~/.kortx-mcp/logs/kortx-mcp.log`

```bash
# Validate JSON syntax
cat ~/.config/claude/mcp.json | jq .

# Check if npx can find kortx-mcp
npx -y @effatico/kortx-mcp --help
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

```bash
# Reconfigure for faster responses
claude mcp remove consultant
claude mcp add --transport stdio consultant \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5-mini \
  --env OPENAI_REASONING_EFFORT=minimal \
  --env MAX_CONTEXT_TOKENS=8000 \
  -- npx -y @effatico/kortx-mcp
```

### Context Gathering Errors

**Problem**: Errors related to Serena, Memory, or CCLSP

**Solutions**:

1. Verify those MCP servers are installed and configured
2. Disable context gathering if not needed
3. Check logs for specific errors

```bash
# Reconfigure without context gathering
claude mcp remove consultant
claude mcp add --transport stdio consultant \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env ENABLE_SERENA=false \
  --env ENABLE_MEMORY=false \
  --env ENABLE_CCLSP=false \
  -- npx -y @effatico/kortx-mcp
```

### High API Costs

**Problem**: OpenAI API costs are too high

**Solutions**:

1. Switch to `gpt-5-mini` or `gpt-5-nano`
2. Use `minimal` reasoning effort
3. Reduce max tokens
4. Disable context gathering

```bash
# Reconfigure for minimal costs
claude mcp remove consultant
claude mcp add --transport stdio consultant \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5-nano \
  --env OPENAI_REASONING_EFFORT=minimal \
  --env OPENAI_MAX_TOKENS=512 \
  --env ENABLE_SERENA=false \
  --env ENABLE_MEMORY=false \
  --env ENABLE_CCLSP=false \
  -- npx -y @effatico/kortx-mcp
```

---

## Advanced Topics

### Running Local Development Version

For testing changes or development:

```bash
# Clone and build
git clone https://github.com/effatico/kortx-mcp.git
cd kortx-mcp
npm install
npm run build

# Configure Claude Code to use local version
claude mcp add --transport stdio consultant-dev \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env LOG_LEVEL=debug \
  -- node /path/to/kortx-mcp/build/index.js
```

### Multiple Consultant Configurations

Run different configurations for different purposes:

```bash
# Fast consultant for quick tasks
claude mcp add --transport stdio consultant-fast \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5-nano \
  --env OPENAI_REASONING_EFFORT=minimal \
  -- npx -y @effatico/kortx-mcp

# Deep consultant for complex analysis
claude mcp add --transport stdio consultant-deep \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5 \
  --env OPENAI_REASONING_EFFORT=high \
  -- npx -y @effatico/kortx-mcp
```

### Custom Logging

For debugging or monitoring:

```bash
claude mcp add --transport stdio consultant \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env LOG_LEVEL=debug \
  --env LOG_FILE=/custom/path/kortx-mcp.log \
  -- npx -y @effatico/kortx-mcp
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
- 💬 Join the [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)

---

## Getting Help

- 📖 [Troubleshooting Guide](../troubleshooting.md)
- 💬 [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)
- 🐛 [Report an Issue](https://github.com/effatico/kortx-mcp/issues)
- 📧 [Email Support](mailto:info@effati.se)
