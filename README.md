# 🤖 MCP Consultant

[![npm version](https://badge.fury.io/js/mcp-consultant.svg)](https://www.npmjs.com/package/mcp-consultant)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/amsv01/mcp-consultant/workflows/Test/badge.svg)](https://github.com/amsv01/mcp-consultant/actions)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.18.0-brightgreen)](https://nodejs.org)

> An open-source MCP server that enables AI assistants like Claude Code to consult with GPT-5 for specialized tasks, with intelligent context gathering from your codebase.

[Quick Start](#-quick-start) • [Documentation](./docs) • [Examples](./examples) • [Contributing](./CONTRIBUTING.md)

---

## ✨ Features

- 🧠 **Multi-Model Support** - GPT-5, GPT-5-mini, and GPT-5-nano with configurable reasoning effort
- 📚 **Smart Context Gathering** - Automatically integrates with Serena, graph-memory, and cclsp MCPs
- 🔧 **Four Specialized Tools** - Strategic planning, alternative solutions, copy improvement, problem-solving
- 🐳 **Docker Ready** - Containerized deployment with security best practices
- 📦 **NPX Support** - Install and run with a single command
- 🔒 **Production Secure** - Non-root execution, sensitive data redaction, comprehensive logging
- 📊 **Observable** - Structured Pino logging with request/response tracking
- ⚡ **Optimized Defaults** - Fast time-to-first-token with gpt-5-mini and minimal reasoning
- 🧪 **Well Tested** - 46 passing unit tests with 80%+ coverage

---

## 🚀 Quick Start

### Install via NPX (Recommended)

```bash
npx mcp-consultant
```

### Install via NPM

```bash
npm install -g mcp-consultant
mcp-consultant
```

### Using Docker

```bash
docker run -e OPENAI_API_KEY=your-key ghcr.io/amsv01/mcp-consultant:latest
```

---

## 📦 Integration with AI Assistants

### Claude Code

**Quick Setup:**

```bash
# Using npx (recommended)
claude mcp add consultant -- npx -y mcp-consultant

# Using global install
npm install -g mcp-consultant
claude mcp add consultant -- mcp-consultant
```

**Manual Configuration:**

Add to your Claude Code MCP config file (`~/.config/claude/mcp.json` on macOS/Linux, `%APPDATA%\Claude\mcp.json` on Windows):

```json
{
  "mcpServers": {
    "consultant": {
      "command": "npx",
      "args": ["-y", "mcp-consultant"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key-here",
        "OPENAI_MODEL": "gpt-5-mini",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

[Detailed Claude Code setup guide →](./docs/integration/claude-code.md)

### Copliot

Add to your Copliot configuration:

```json
{
  "mcp": {
    "servers": {
      "consultant": {
        "command": "npx",
        "args": ["-y", "mcp-consultant"],
        "env": {
          "OPENAI_API_KEY": "your-api-key-here"
        }
      }
    }
  }
}
```

[Detailed Copliot setup guide →](./docs/integration/copliot.md)

### VS Code with MCP Extension

1. Install the MCP extension for VS Code
2. Add to `.vscode/mcp-config.json`:

```json
{
  "consultant": {
    "command": "npx",
    "args": ["-y", "mcp-consultant"],
    "env": {
      "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
    }
  }
}
```

[Detailed VS Code setup guide →](./docs/integration/vscode.md)

### Cursor

Add to Cursor's MCP settings:

```json
{
  "mcp-servers": {
    "consultant": {
      "command": "npx -y mcp-consultant",
      "env": {
        "OPENAI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

[Detailed Cursor setup guide →](./docs/integration/cursor.md)

---

## ⚙️ Configuration

Create a `.env` file or set environment variables:

```bash
# Required
OPENAI_API_KEY=sk-your-api-key-here

# Optional - Model Selection
OPENAI_MODEL=gpt-5-mini              # gpt-5, gpt-5-mini, gpt-5-nano
OPENAI_REASONING_EFFORT=minimal      # minimal, low, medium, high
OPENAI_VERBOSITY=low                 # low, medium, high
OPENAI_MAX_TOKENS=1024               # Output token limit

# Optional - Server
LOG_LEVEL=info                       # debug, info, warn, error
TRANSPORT=stdio                      # stdio, streaming

# Optional - Context Gathering
ENABLE_SERENA=true                   # Semantic code search
ENABLE_MEMORY=true                   # Knowledge graph persistence
ENABLE_CCLSP=true                    # Language server features
MAX_CONTEXT_TOKENS=32000             # Context limit
```

### Model Selection Guide

- **gpt-5**: Best for complex reasoning, broad world knowledge, multi-step tasks
- **gpt-5-mini** (default): Cost-optimized, balanced speed/capability
- **gpt-5-nano**: High-throughput, simple tasks

### Reasoning Effort Guide

- **minimal** (default): Very few reasoning tokens, fastest time-to-first-token
- **low**: Favors speed and fewer tokens
- **medium**: Balanced reasoning and speed
- **high**: Thorough reasoning for complex tasks

[Full configuration reference →](./docs/configuration.md)

---

## 🎯 Available Tools

### 1. think-about-plan

Get strategic feedback on plans and approaches. Analyzes clarity, feasibility, risks, dependencies, and suggests alternatives.

**Example Usage:**

```
"I'm planning to refactor our authentication system to use OAuth 2.0
with JWT tokens and refresh token rotation. What do you think?"
```

**Returns:**

- Clarity assessment
- Feasibility analysis
- Risk evaluation
- Dependencies identification
- Recommendations
- Alternative approaches

[API documentation →](./docs/api/think-about-plan.md)

### 2. suggest-alternative

Request alternative approaches or solutions. Considers different paradigms, simpler solutions, proven patterns, and trade-offs.

**Example Usage:**

```
"I'm using WebSockets for real-time notifications on mobile.
Can you suggest better approaches considering battery life and intermittent connectivity?"
```

**Returns:**

- Multiple alternative approaches
- Pros and cons for each
- Trade-off analysis
- Recommendations

[API documentation →](./docs/api/suggest-alternative.md)

### 3. improve-copy

Improve text, documentation, or user-facing messages. Focuses on clarity, conciseness, tone, structure, and accessibility.

**Example Usage:**

```
"Can you improve this error message:
'Error 500: Internal server error occurred. Contact administrator.'"
```

**Returns:**

- Improved version
- Explanation of changes
- Reasoning for improvements

[API documentation →](./docs/api/improve-copy.md)

### 4. solve-problem

Debug and problem-solving assistance. Performs root cause analysis, provides diagnosis steps, solutions, and prevention strategies.

**Example Usage:**

```
"Users experiencing intermittent 500 errors when uploading large files.
I've increased server memory and checked disk space, but it still happens.
Error: Request Entity Too Large, ETIMEDOUT: Socket timeout"
```

**Returns:**

- Root cause analysis
- Diagnosis steps
- Proposed solutions
- Testing guidance
- Prevention strategies

[API documentation →](./docs/api/solve-problem.md)

---

## 📖 Documentation

### Getting Started

- [Installation Guide](./docs/getting-started.md)
- [Configuration Guide](./docs/configuration.md)
- [Troubleshooting](./docs/troubleshooting.md)

### Integration Guides

- [Claude Code Setup](./docs/integration/claude-code.md)
- [Copliot Setup](./docs/integration/copliot.md)
- [VS Code Setup](./docs/integration/vscode.md)
- [Cursor Setup](./docs/integration/cursor.md)

### API Documentation

- [think-about-plan](./docs/api/think-about-plan.md)
- [suggest-alternative](./docs/api/suggest-alternative.md)
- [improve-copy](./docs/api/improve-copy.md)
- [solve-problem](./docs/api/solve-problem.md)

### Examples

- [Strategic Planning Workflow](./examples/strategic-planning.md)
- [Code Review Workflow](./examples/code-review.md)
- [Documentation Improvement](./examples/documentation-improvement.md)
- [Debugging Session](./examples/debugging-session.md)

### Developer Documentation

- [Architecture Overview](./docs/development/architecture.md)
- [Context Gathering Deep Dive](./docs/development/context-gathering.md)
- [Adding New Tools](./docs/development/adding-tools.md)
- [Testing Guide](./docs/development/testing.md)
- [Release Process](./docs/development/release-process.md)

---

## 🔧 Development

### Prerequisites

- Node.js >= 22.18.0
- npm >= 9.0.0
- OpenAI API key

### Setup

```bash
# Clone the repository
git clone https://github.com/amsv01/mcp-consultant.git
cd mcp-consultant

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your OpenAI API key

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev              # Run with hot reload
npm run build            # Build TypeScript
npm run type-check       # Type checking only

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Testing
npm test                 # Run tests
npm run test:coverage    # Run with coverage

# Tools
npm run inspector        # Debug with MCP Inspector
```

[Read the development guide →](./docs/development/)

---

## 🏗️ Project Structure

```
mcp-consultant/
├── src/
│   ├── index.ts              # Entry point with shebang
│   ├── server.ts             # Main MCP server setup
│   ├── config/               # Configuration management
│   │   └── index.ts          # Zod validation, env parsing
│   ├── llm/                  # OpenAI GPT-5 integration
│   │   ├── openai-client.ts  # Responses API client
│   │   └── types.ts          # LLM types
│   ├── context/              # Context gathering system
│   │   ├── gatherer.ts       # Main orchestrator
│   │   └── sources/          # Context source integrations
│   │       ├── file.ts       # File system
│   │       ├── serena.ts     # Semantic code search
│   │       ├── memory.ts     # Knowledge graph
│   │       └── cclsp.ts      # Language server
│   ├── tools/                # MCP tool implementations
│   │   ├── think-about-plan.ts
│   │   ├── suggest-alternative.ts
│   │   ├── improve-copy.ts
│   │   └── solve-problem.ts
│   └── utils/                # Utilities
│       └── logger.ts         # Pino structured logging
├── docs/                     # Documentation
├── examples/                 # Usage examples
├── .github/workflows/        # CI/CD pipelines
└── build/                    # Compiled output
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

- 🐛 [Report a Bug](https://github.com/amsv01/mcp-consultant/issues/new?template=bug_report.md)
- 💡 [Request a Feature](https://github.com/amsv01/mcp-consultant/issues/new?template=feature_request.md)
- 📖 [Improve Documentation](./CONTRIBUTING.md#documentation)
- 🔧 [Submit a Pull Request](./CONTRIBUTING.md#pull-requests)

---

## 🔒 Security

Security is a top priority. See our [Security Policy](./SECURITY.md) for:

- Reporting vulnerabilities
- Security best practices
- API key management
- Docker security

**⚠️ Important:** Never commit your OpenAI API key to version control! Always use environment variables or secrets management.

---

## 📊 Tech Stack

- **Runtime**: Node.js 22.18+
- **Language**: TypeScript with strict mode
- **MCP SDK**: @modelcontextprotocol/sdk v1.10.0+
- **LLM**: OpenAI GPT-5 Responses API
- **Validation**: Zod for schema validation
- **Logging**: Pino for structured logging
- **Testing**: Vitest with 80%+ coverage
- **CI/CD**: GitHub Actions

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with the [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- Powered by [OpenAI GPT-5](https://openai.com)
- Inspired by the MCP community

---

## 📊 Project Status

**Current Version**: 1.0.0

This project is actively maintained and production-ready:

- ✅ Core functionality complete
- ✅ Comprehensive testing (46 tests passing)
- ✅ CI/CD pipeline configured
- ✅ Docker containerization
- ✅ NPX distribution ready
- 🚧 Additional model support (gpt-5-pro, gpt-5-codex) planned

[View roadmap →](https://linear.app/effati/project/llm-consultant-mcp-server-ca23faa6a9e9)

---

## 💬 Support

- 📖 [Documentation](./docs)
- 💬 [GitHub Discussions](https://github.com/amsv01/mcp-consultant/discussions)
- 🐛 [Issue Tracker](https://github.com/amsv01/mcp-consultant/issues)
- 📧 [Email Support](mailto:amin@effati.se)

---

## ⭐ Star History

If you find this project useful, please consider giving it a star on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=amsv01/mcp-consultant&type=Date)](https://star-history.com/#amsv01/mcp-consultant&Date)
