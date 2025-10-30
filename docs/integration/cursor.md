# Cursor Integration Guide

This guide will help you set up MCP Consultant with Cursor, the AI-first code editor.

---

## Prerequisites

- Cursor installed ([Download here](https://cursor.sh))
- Node.js >= 22.12.0
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

---

## Quick Setup

### 1. Open Cursor Settings

- **macOS**: `Cmd+,`
- **Windows/Linux**: `Ctrl+,`

### 2. Navigate to MCP Settings

1. Search for "MCP" in settings
2. Or navigate to: `Settings → Extensions → Model Context Protocol`

### 3. Add MCP Consultant Configuration

Add to Cursor's MCP configuration:

```json
{
  "mcp-servers": {
    "kortx-consultant": {
      "command": "npx -y @effatico/kortx-mcp",
      "env": {
        "OPENAI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 4. Restart Cursor

Restart Cursor to load the new configuration.

---

## Configuration Options

### Basic Configuration (Recommended)

```json
{
  "mcp-servers": {
    "kortx-consultant": {
      "command": "npx -y @effatico/kortx-mcp",
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
      }
    }
  }
}
```

### Advanced Configuration

```json
{
  "mcp-servers": {
    "kortx-consultant": {
      "command": "npx -y @effatico/kortx-mcp",
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
}
```

### Alternative: Separate Command and Args

```json
{
  "mcp-servers": {
    "kortx-consultant": {
      "command": "npx",
      "args": ["-y", "@effatico/kortx-mcp"],
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
      }
    }
  }
}
```

---

## Using Environment Variables

### Set Environment Variable

**macOS/Linux** (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export OPENAI_API_KEY="sk-your-api-key-here"
```

**Windows PowerShell**:

```powershell
$env:OPENAI_API_KEY="sk-your-api-key-here"
```

**Windows Command Prompt**:

```cmd
set OPENAI_API_KEY=sk-your-api-key-here
```

### Reference in Configuration

```json
{
  "mcp-servers": {
    "kortx-consultant": {
      "command": "npx -y @effatico/kortx-mcp",
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
      }
    }
  }
}
```

---

## Verifying Installation

### 1. Check MCP Status

In Cursor:

1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Type "MCP: Status"
3. Verify `kortx-consultant` appears in the list

### 2. Test the Tools

Use Cursor's chat interface:

```
@mcp:kortx-consultant What do you think about implementing GraphQL?
```

### 3. Check Available Tools

kortx-consultant provides:

- `think-about-plan`
- `suggest-alternative`
- `improve-copy`
- `solve-problem`
- `search-content`
- `create-visual`
- `batch-consult`

---

## Usage in Cursor

### Using Chat Interface

Cursor's AI chat can invoke MCP tools automatically:

```
I'm thinking about refactoring our API to use GraphQL instead of REST.
We have 50+ endpoints and want to reduce over-fetching.
Can you help me think through this plan?
```

Cursor will automatically use the `think-about-plan` tool.

### Direct Tool Invocation

Use the `@mcp` prefix to explicitly invoke MCP tools:

```
@mcp:kortx-consultant think-about-plan
I want to implement caching with Redis for our user sessions...
```

### In-Editor Usage

1. Select code or text
2. Right-click → "Ask AI"
3. Type your question/request
4. Cursor will use kortx-consultant when appropriate

---

## Usage Examples

### Strategic Planning

```text
@mcp:kortx-consultant

I'm planning to migrate our PostgreSQL database to a multi-region setup.
Current: Single region, 2TB data, 10k queries/sec
Target: 3 regions (US, EU, APAC) with read replicas
Timeline: 3 months
Budget: $50k/month additional infrastructure cost

What do you think about this plan?
```

### Getting Alternatives

```text
@mcp:kortx-consultant

I'm using AWS Lambda for background job processing.
Current issue: Cold starts causing 2-3 second delays
Budget: $1000/month
Volume: 100k jobs/day

Can you suggest alternatives?
```

### Improving Copy

```text
@mcp:kortx-consultant

Improve this error message for our SaaS application:
"Error: Request failed. Try again later or contact support."

Target audience: Non-technical business users
```

### Problem Solving

```text
@mcp:kortx-consultant

Problem: Next.js application showing inconsistent hydration errors in production
Frequency: 5-10% of page loads
Environment: Vercel, Next.js 14, React 18
Steps taken:
- Verified no mismatched HTML structure
- Checked for browser extensions (disabled)
- Reviewed server/client data fetching

What could be causing this?
```

### Web Research

```text
@mcp:kortx-consultant search-content

Query: Latest CDN latency benchmarks for 2025 comparing Cloudflare, Fastly, and Akamai
```

Cursor will trigger `search-content` and return Perplexity results with citations.

### Visual Content

```text
@mcp:kortx-consultant create-visual

Prompt: Generate a 16:9 hero illustration of engineers collaborating in a neon-lit operations center
```

Use `create-visual` to generate new imagery or iterate on existing assets.

### Batch Requests

```text
@mcp:kortx-consultant batch-consult

Requests:
- {"toolName":"think-about-plan","input":{"plan":"Migrate monolith to services over 3 quarters"}}
- {"toolName":"suggest-alternative","input":{"currentApproach":"Use Redis pub/sub for notifications"}}
- {"toolName":"improve-copy","input":{"originalText":"We are currently experiencing downtime","purpose":"status page"}}
```

`batch-consult` lets you execute multiple tool calls in parallel from a single command.

---

## Model Selection

Configure in MCP settings:

```json
{
  "mcp-servers": {
    "kortx-consultant": {
      "env": {
        "OPENAI_MODEL": "gpt-5-mini"
      }
    }
  }
}
```

### Model Options

| Model      | Best For                        | Speed     | Cost     |
| ---------- | ------------------------------- | --------- | -------- |
| gpt-5-mini | General use, quick feedback     | Fast      | Low      |
| gpt-5      | Complex reasoning, architecture | Moderate  | Medium   |
| gpt-5-nano | High-throughput, simple tasks   | Very Fast | Very Low |

---

## Reasoning Effort

Control thinking depth:

```json
{
  "mcp-servers": {
    "kortx-consultant": {
      "env": {
        "OPENAI_REASONING_EFFORT": "minimal"
      }
    }
  }
}
```

### Effort Levels

- **minimal** (default): Fastest, immediate responses
- **low**: Quick with light reasoning
- **medium**: Balanced approach
- **high**: Thorough analysis, takes longer

---

## Context Gathering

Configure what code context is sent:

```json
{
  "mcp-servers": {
    "kortx-consultant": {
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
}
```

**Privacy Note**: Context gathering sends code to OpenAI's API. Review and disable for sensitive projects.

---

## Multiple Consultant Profiles

Configure different profiles for different needs:

```json
{
  "mcp-servers": {
    "kortx-consultant-fast": {
      "command": "npx -y @effatico/kortx-mcp",
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
        "OPENAI_MODEL": "gpt-5-nano",
        "OPENAI_REASONING_EFFORT": "minimal"
      }
    },
    "kortx-consultant-pro": {
      "command": "npx -y @effatico/kortx-mcp",
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
        "OPENAI_MODEL": "gpt-5",
        "OPENAI_REASONING_EFFORT": "high"
      }
    }
  }
}
```

Use them in chat:

```
@mcp:kortx-consultant-fast Quick question about this approach...
@mcp:kortx-consultant-pro Need deep analysis of this architecture...
```

---

## Troubleshooting

### kortx-consultant Not Available

**Problem**: Cursor doesn't show kortx-consultant in MCP servers

**Solutions**:

1. Verify MCP configuration syntax (must be valid JSON)
2. Check API key is set correctly
3. Restart Cursor completely
4. Check Cursor's output panel for errors

```bash
# Test npx can find kortx-mcp
npx -y @effatico/kortx-mcp --help

# Verify Node.js version
node --version  # Should be >= 22.12.0
```

### API Key Errors

**Problem**: Authentication failed or invalid API key

**Solutions**:

1. Verify key starts with `sk-`
2. Check environment variable is set: `echo $OPENAI_API_KEY`
3. Test key directly:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

4. Verify sufficient quota in OpenAI dashboard

### Slow Responses

**Problem**: kortx-consultant takes too long

**Solutions**:

```json
{
  "mcp-servers": {
    "kortx-consultant": {
      "env": {
        "OPENAI_MODEL": "gpt-5-mini",
        "OPENAI_REASONING_EFFORT": "minimal",
        "MAX_CONTEXT_TOKENS": "8000"
      }
    }
  }
}
```

### Command Not Found

**Problem**: `npx: command not found`

**Solutions**:

```bash
# Install Node.js and npm
# macOS
brew install node

# Windows
# Download from nodejs.org

# Linux
sudo apt install nodejs npm

# Verify installation
node --version
npx --version
```

### Cursor Not Recognizing MCP

**Problem**: MCP settings not available in Cursor

**Solutions**:

1. Update Cursor to the latest version
2. Check if MCP is enabled in Cursor settings
3. Verify Cursor supports MCP (version 0.30+)

---

## Best Practices

### 1. Use Environment Variables

Never hardcode API keys:

```json
{
  "env": {
    "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
  }
}
```

### 2. Start with Defaults

Begin with `gpt-5-mini` and `minimal` reasoning. Optimize later.

### 3. Monitor API Usage

Track costs in [OpenAI Dashboard](https://platform.openai.com/usage).

### 4. Secure Your API Key

- ✅ Use environment variables
- ✅ Never commit keys to git
- ✅ Rotate keys regularly
- ❌ Don't share keys in screenshots or docs

### 5. Review Privacy

Be mindful of what code context is sent to OpenAI's API.

---

## Integration with Cursor Features

### Using with Cursor's AI Features

Cursor's built-in AI and MCP Consultant work together:

1. **Cursor AI** for code generation and inline editing
2. **MCP Consultant** for strategic planning and consultation

Example workflow:

```
1. Use @mcp:kortx-consultant to plan architecture
2. Use Cursor AI (Cmd+K) to implement the plan
3. Use @mcp:kortx-consultant to review the implementation
```

### Keyboard Shortcuts

Create custom shortcuts for common consultations:

1. Open Cursor settings
2. Navigate to Keyboard Shortcuts
3. Add custom commands for MCP invocation

---

## Advanced Topics

### Using Local Development Version

For testing or development:

```json
{
  "mcp-servers": {
    "kortx-consultant": {
      "command": "node",
      "args": ["/absolute/path/to/kortx-mcp/build/index.js"],
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Custom Logging

```json
{
  "mcp-servers": {
    "kortx-consultant": {
      "env": {
        "LOG_LEVEL": "debug",
        "LOG_FILE": "/custom/path/kortx-mcp.log"
      }
    }
  }
}
```

### Disabling Specific Features

For privacy or performance:

```json
{
  "mcp-servers": {
    "kortx-consultant": {
      "env": {
        "ENABLE_SERENA": "false",
        "ENABLE_MEMORY": "false",
        "ENABLE_CCLSP": "false",
        "INCLUDE_FILE_CONTENT": "false"
      }
    }
  }
}
```

---

## Tips & Tricks

### 1. Use Descriptive Server Names

```json
{
  "mcp-servers": {
    "gpt5-kortx-consultant": {
      "command": "npx -y @effatico/kortx-mcp",
      "env": {
        "OPENAI_MODEL": "gpt-5"
      }
    },
    "gpt5-mini-kortx-consultant": {
      "command": "npx -y @effatico/kortx-mcp",
      "env": {
        "OPENAI_MODEL": "gpt-5-mini"
      }
    }
  }
}
```

### 2. Context-Aware Consulting

Provide more context for better answers:

```
@mcp:kortx-consultant

Context: E-commerce platform, 100k daily users, Node.js backend
Question: Should we implement server-side rendering or stick with CSR?
Constraints: Small team (3 devs), tight timeline (2 months)
```

### 3. Iterative Consultation

Build on previous consultations:

```
@mcp:kortx-consultant think-about-plan
Plan: Migrate to microservices

[Review response]

@mcp:kortx-consultant suggest-alternative
Based on your feedback about our timeline, what are simpler alternatives?
```

---

## Next Steps

- 📖 Read the [API Documentation](../api/)
- 🎯 Check out [Example Workflows](../../examples/)
- 🔧 Explore [Configuration Options](../configuration.md)
- 💬 Join [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)

---

## Getting Help

- 📖 [Troubleshooting Guide](../troubleshooting.md)
- 💬 [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)
- 🐛 [Report an Issue](https://github.com/effatico/kortx-mcp/issues)
- 📧 [Email Support](mailto:info@effati.se)
