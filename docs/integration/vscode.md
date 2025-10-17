# VS Code MCP Extension Integration Guide

This guide will help you set up MCP Consultant with VS Code using the MCP Extension.

---

## Prerequisites

- Visual Studio Code
- [MCP Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=mcp.vscode-mcp) installed
- Node.js >= 22.12.0
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

---

## Quick Setup

### 1. Install MCP Extension

```bash
# Install via command line
code --install-extension mcp.vscode-mcp

# Or install from VS Code Marketplace
# Search for "Model Context Protocol" in Extensions
```

### 2. Create MCP Configuration File

Create `.vscode/mcp-config.json` in your project root:

```json
{
  "consultant": {
    "command": "npx",
    "args": ["-y", "kortx-mcp"],
    "env": {
      "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
    }
  }
}
```

### 3. Set Environment Variable

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export OPENAI_API_KEY="sk-your-api-key-here"
```

Or create a `.env` file in your project root:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

### 4. Reload VS Code

Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux) and run:

```
Developer: Reload Window
```

---

## Configuration Options

### Basic Configuration (Recommended)

`.vscode/mcp-config.json`:

```json
{
  "consultant": {
    "command": "npx",
    "args": ["-y", "kortx-mcp"],
    "env": {
      "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
    }
  }
}
```

### Advanced Configuration

```json
{
  "consultant": {
    "command": "npx",
    "args": ["-y", "kortx-mcp"],
    "env": {
      "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
      "OPENAI_MODEL": "gpt-5-mini",
      "OPENAI_REASONING_EFFORT": "minimal",
      "OPENAI_MAX_TOKENS": "2048",
      "LOG_LEVEL": "info",
      "ENABLE_SERENA": "true",
      "ENABLE_MEMORY": "true",
      "ENABLE_CCLSP": "true",
      "MAX_CONTEXT_TOKENS": "16000"
    }
  }
}
```

### Workspace vs. User Configuration

**Project-specific** (recommended):

- File: `.vscode/mcp-config.json`
- Scope: Current workspace only
- Commit to git: Yes (without API keys!)

**Global** (all projects):

- File: `~/.vscode/mcp-config.json`
- Scope: All VS Code workspaces
- Commit to git: No

---

## Verifying Installation

### 1. Check MCP Extension Status

1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Type "MCP: Show Status"
3. Verify `consultant` appears in the list

### 2. Test the Tools

Open the MCP panel in VS Code and try using the consultant tools.

### 3. Check Available Tools

The consultant should provide:

- `think-about-plan`
- `suggest-alternative`
- `improve-copy`
- `solve-problem`

---

## Usage in VS Code

### Using the MCP Panel

1. Open the MCP panel (usually in the sidebar)
2. Select the `consultant` server
3. Choose a tool to use
4. Enter your question/request

### Using Chat Integration

If your MCP extension supports chat:

```
@consultant think about my plan to implement caching with Redis
```

### Using Commands

Access via Command Palette:

1. `Cmd+Shift+P` or `Ctrl+Shift+P`
2. Type "MCP: "
3. Select the consultant tool you want to use

---

## Usage Examples

### Strategic Planning

```
I'm planning to split our monolith into microservices.
Current monolith: 100k LOC, 50 API endpoints, 5 developers.
Target: 5-7 microservices by domain.
Timeline: 6 months.
What do you think about this plan?
```

### Getting Alternatives

```
I'm using Elasticsearch for full-text search on product descriptions.
Cost is $500/month for our 100k products.
Can you suggest cost-effective alternatives?
```

### Improving Copy

```
Improve this README section:
"This tool does stuff with files. It's fast and works good."
```

### Problem Solving

```
CI/CD pipeline failing intermittently on the test stage.
Tests pass locally 100% of the time.
Error: "ECONNREFUSED connecting to localhost:5432"
Database service starts before tests in docker-compose.
What could be wrong?
```

---

## Model Selection

Configure the model in `.vscode/mcp-config.json`:

```json
{
  "consultant": {
    "env": {
      "OPENAI_MODEL": "gpt-5-mini"
    }
  }
}
```

### Model Options

- **gpt-5-mini** (default): Fast, cost-effective, general use
- **gpt-5**: Deep reasoning, complex analysis
- **gpt-5-nano**: Fastest, most economical, simple tasks

---

## Reasoning Effort

Control how much thinking the model does:

```json
{
  "consultant": {
    "env": {
      "OPENAI_REASONING_EFFORT": "minimal"
    }
  }
}
```

### Effort Levels

- **minimal** (default): Fastest, fewest tokens
- **low**: Quick with some reasoning
- **medium**: Balanced approach
- **high**: Thorough analysis, slower

---

## Context Gathering

Configure what context is sent:

```json
{
  "consultant": {
    "env": {
      "ENABLE_SERENA": "true",
      "ENABLE_MEMORY": "true",
      "ENABLE_CCLSP": "true",
      "INCLUDE_FILE_CONTENT": "false",
      "INCLUDE_GIT_HISTORY": "false",
      "MAX_CONTEXT_TOKENS": "16000"
    }
  }
}
```

**Privacy Consideration**: Context gathering sends code to OpenAI. Disable for sensitive projects.

---

## Multiple Profiles

Create different consultant configurations for different needs:

```json
{
  "consultant-fast": {
    "command": "npx",
    "args": ["-y", "kortx-mcp"],
    "env": {
      "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
      "OPENAI_MODEL": "gpt-5-nano",
      "OPENAI_REASONING_EFFORT": "minimal"
    }
  },
  "consultant-deep": {
    "command": "npx",
    "args": ["-y", "kortx-mcp"],
    "env": {
      "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
      "OPENAI_MODEL": "gpt-5",
      "OPENAI_REASONING_EFFORT": "high"
    }
  }
}
```

---

## Troubleshooting

### Consultant Not Found

**Problem**: VS Code doesn't see the consultant server

**Solutions**:

1. Verify `.vscode/mcp-config.json` exists
2. Check JSON syntax: `cat .vscode/mcp-config.json | jq .`
3. Reload VS Code window
4. Check MCP extension is installed and enabled

### API Key Issues

**Problem**: Authentication errors

**Solutions**:

1. Verify API key starts with `sk-`
2. Check environment variable: `echo $OPENAI_API_KEY`
3. Try hardcoding the key temporarily (for testing only!)
4. Verify sufficient API quota in OpenAI dashboard

### Extension Not Working

**Problem**: MCP extension not responding

**Solutions**:

1. Check extension is installed: Extensions panel → Search "MCP"
2. Restart VS Code completely
3. Check VS Code Developer Console for errors: `Help → Toggle Developer Tools`
4. Reinstall the MCP extension

### Slow Responses

**Problem**: Consultant takes too long to respond

**Solutions**:

```json
{
  "consultant": {
    "env": {
      "OPENAI_MODEL": "gpt-5-mini",
      "OPENAI_REASONING_EFFORT": "minimal",
      "MAX_CONTEXT_TOKENS": "8000"
    }
  }
}
```

### Permission Errors

**Problem**: Cannot execute npx or kortx-mcp

**Solutions**:

```bash
# Ensure npx is available
which npx

# Test kortx-mcp directly
npx -y kortx-mcp --help

# Check Node.js version
node --version  # Should be >= 22.12.0
```

---

## Best Practices

### 1. Project-Specific Configuration

Commit `.vscode/mcp-config.json` to git (without secrets):

```json
{
  "consultant": {
    "command": "npx",
    "args": ["-y", "kortx-mcp"],
    "env": {
      "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
    }
  }
}
```

Create `.env.example`:

```bash
OPENAI_API_KEY=sk-your-key-here
```

Add to `.gitignore`:

```
.env
```

### 2. Team Configuration

Document setup in project README:

```markdown
## MCP Consultant Setup

1. Copy `.env.example` to `.env`
2. Add your OpenAI API key to `.env`
3. Reload VS Code window
```

### 3. Security

- ✅ Use `${env:OPENAI_API_KEY}` in configs
- ✅ Never commit `.env` files with real keys
- ✅ Add `.env` to `.gitignore`
- ❌ Never hardcode API keys in JSON configs

### 4. Performance

- Start with `gpt-5-mini` and `minimal` effort
- Only enable context gathering if needed
- Monitor OpenAI API usage regularly

### 5. Privacy

- Review what code context is being sent
- Disable context for sensitive projects
- Consider OpenAI's Azure offering for compliance needs

---

## Advanced Topics

### Using Local Development Version

For testing changes:

```json
{
  "consultant": {
    "command": "node",
    "args": ["/absolute/path/to/kortx-mcp/build/index.js"],
    "env": {
      "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
      "LOG_LEVEL": "debug"
    }
  }
}
```

### Custom Logging

```json
{
  "consultant": {
    "env": {
      "LOG_LEVEL": "debug",
      "LOG_FILE": "${workspaceFolder}/logs/kortx-mcp.log"
    }
  }
}
```

### Integration with Tasks

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Consult on Architecture",
      "type": "shell",
      "command": "echo 'Use MCP panel to consult on architecture'"
    }
  ]
}
```

---

## Keyboard Shortcuts

Add to `.vscode/keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+c",
    "command": "mcp.openPanel",
    "when": "editorTextFocus"
  }
]
```

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
