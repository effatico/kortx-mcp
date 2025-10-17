# Getting Started with MCP Consultant

This guide explains how to set up MCP Consultant and integrate it with your AI assistant.

## Prerequisites

You'll need Node.js 22.12.0 or newer (download from [nodejs.org](https://nodejs.org)), which includes npm 9.0.0 or newer. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys). You'll also need an AI assistant like Claude Code, Copliot, VS Code with the MCP extension, or Cursor.

## Installation Options

The fastest way to get started uses npx with no installation required. Run `npx -y @effatico/kortx-mcp` to download and run the latest version automatically, which works well for trying it out or occasional use.

For regular use, install globally with `npm install -g @effatico/kortx-mcp` and then run `kortx-mcp` anytime.

For containerized deployments, pull the Docker image with `docker pull ghcr.io/effatico/kortx-mcp:latest` and run it with `docker run -e OPENAI_API_KEY=sk-your-key ghcr.io/effatico/kortx-mcp:latest`.

## Configuration

### Setting Up Your API Key

MCP Consultant needs an OpenAI API key to function. The recommended approach sets it in your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) with `export OPENAI_API_KEY="sk-your-actual-api-key-here"`.

You can also create a `.env` file in your project or home directory containing `OPENAI_API_KEY=sk-your-actual-api-key-here`, or pass it directly in your AI assistant's MCP configuration (shown in the integration guides below).

### Basic Configuration

The server works with sensible defaults, but you can customize behavior:

```bash
# Model selection (default: gpt-5-mini)
OPENAI_MODEL=gpt-5-mini

# Reasoning effort (default: minimal)
OPENAI_REASONING_EFFORT=minimal

# Verbosity (default: low)
OPENAI_VERBOSITY=low

# Max output tokens (default: 1024)
OPENAI_MAX_TOKENS=1024

# Log level (default: info)
LOG_LEVEL=info
```

See the [Configuration Reference](./configuration.md) for all available options.

## Integration with AI Assistants

Choose your AI assistant and follow the integration guide:

### Claude Code

The simplest integration:

```bash
# Add the server
claude mcp add consultant -- npx -y @effatico/kortx-mcp
```

Or manually edit `~/.config/claude/mcp.json`:

```json
{
  "mcpServers": {
    "consultant": {
      "command": "npx",
      "args": ["-y", "@effatico/kortx-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here"
      }
    }
  }
}
```

[Full Claude Code guide →](./integration/claude-code.md)

### Copliot

Edit your Copliot configuration file:

```json
{
  "mcp": {
    "servers": {
      "consultant": {
        "command": "npx",
        "args": ["-y", "@effatico/kortx-mcp"],
        "env": {
          "OPENAI_API_KEY": "your-key-here"
        }
      }
    }
  }
}
```

[Full Copliot guide →](./integration/copliot.md)

### VS Code

Install the MCP extension, then add to `.vscode/mcp-config.json`:

```json
{
  "consultant": {
    "command": "npx",
    "args": ["-y", "@effatico/kortx-mcp"],
    "env": {
      "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
    }
  }
}
```

[Full VS Code guide →](./integration/vscode.md)

### Cursor

Add to Cursor's MCP settings:

```json
{
  "mcp-servers": {
    "consultant": {
      "command": "npx -y @effatico/kortx-mcp",
      "env": {
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

[Full Cursor guide →](./integration/cursor.md)

## Verifying the Installation

After setting up, verify the server is working:

### Check Server Status

In Claude Code or your AI assistant, try asking:

```
Can you list available MCP tools?
```

You should see four consultant tools:

- `think-about-plan`
- `suggest-alternative`
- `improve-copy`
- `solve-problem`

### Test with a Simple Query

Try a basic consultation:

```
Can you think about my plan to add user authentication using JWT tokens?
```

If you get a thoughtful response analyzing the plan, congratulations! The server is working correctly.

## First Steps

Now that you're set up, here are some things to try:

### 1. Get Strategic Feedback

Ask for thoughts on a plan or approach:

```
I'm planning to migrate our database from PostgreSQL to MongoDB.
What do you think about this plan?
```

### 2. Explore Alternatives

Request different approaches to a problem:

```
I'm using polling to check for updates every 5 seconds.
Can you suggest alternative approaches?
```

### 3. Improve Copy

Enhance user-facing text:

```
Improve this error message: "Error: Something went wrong"
```

### 4. Debug Problems

Get help with issues:

```
My app crashes with "Cannot read property 'map' of undefined".
I've checked that the array exists. What could be wrong?
```

## Understanding Context Gathering

MCP Consultant automatically gathers relevant context from your workspace. It reads related files you mention from the file system, uses Serena MCP for semantic code search if installed, accesses knowledge graph data through Graph Memory if available, and leverages CCLSP for language server features when present. No additional setup is needed since the server detects and integrates with other MCPs automatically.

## Performance Tips

### Optimize for Speed

Use the fastest configuration for quick responses:

```bash
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=minimal
OPENAI_VERBOSITY=low
OPENAI_MAX_TOKENS=1024
```

### Optimize for Quality

Use maximum reasoning for complex tasks:

```bash
OPENAI_MODEL=gpt-5
OPENAI_REASONING_EFFORT=high
OPENAI_VERBOSITY=high
OPENAI_MAX_TOKENS=4096
```

### Balance Cost and Performance

The default configuration balances all factors:

```bash
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=minimal
OPENAI_VERBOSITY=low
OPENAI_MAX_TOKENS=1024
```

## Next Steps

Now that you're up and running, try each of the four tools with different queries to explore their capabilities. See real-world workflows in the [examples/](../examples) directory, fine-tune settings for your needs in the configuration guide, and check [troubleshooting.md](./troubleshooting.md) if you hit any issues.

## Common Issues

### "Command not found: kortx-mcp"

Install globally first:

```bash
npm install -g @effatico/kortx-mcp
```

### "Invalid API key"

Verify your key starts with `sk-`, ensure there are no extra spaces or quotes, and test it at [platform.openai.com](https://platform.openai.com).

### "Server not starting"

Check the logs:

```bash
# Claude Code logs
tail -f ~/.config/claude/logs/mcp-*.log

# Or check stderr
OPENAI_API_KEY=sk-your-key npx @effatico/kortx-mcp 2>&1 | head -20
```

### "Tools not appearing"

Restart your AI assistant after configuration changes.

For more detailed troubleshooting, see the [Troubleshooting Guide](./troubleshooting.md).

## Getting Help

If you need assistance:

- 📖 [Full Documentation](../README.md#-documentation)
- 🐛 [Report an Issue](https://github.com/effatico/kortx-mcp/issues)
- 💬 [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)
- 📧 [Email Support](mailto:info@effati.se)

## What's Next?

Ready to dive deeper? Check out:

- [Configuration Reference](./configuration.md) - All available options
- [API Documentation](./api/) - Detailed tool specifications
- [Example Workflows](../examples/) - Real-world use cases
- [Development Guide](./development/) - Contributing and extending
