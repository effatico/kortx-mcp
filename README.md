# MCP Consultant

> An open-source MCP server that enables AI assistants like Claude Code to consult with OpenAI GPT-5 for specialized tasks, with intelligent context gathering.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Status

**Current Phase**: Phase 0 - Research and Documentation Complete

**Next Steps**: Core implementation (Phases 1-14)

## Features

- 🧠 **Multi-Model Support** - GPT-5, GPT-5-mini, and GPT-5-nano with configurable reasoning effort
- 📚 **Smart Context Gathering** - Integrates with Serena, graph-memory, and cclsp MCPs
- 🔧 **Four Core Tools** - Strategic planning, alternatives, copy improvement, problem-solving
- 🐳 **Docker Ready** - Containerized for secure deployment
- 📦 **NPX Support** - Install and run with a single command
- 🔒 **Secure** - OAuth 2.1 support and security best practices
- 📊 **Observable** - Comprehensive logging with Pino

## Quick Start

### Prerequisites

- Node.js >= 22.18.0
- npm >= 9.0.0
- OpenAI API key

### Installation (Coming Soon)

```bash
# Via NPX (recommended)
npx mcp-consultant

# Via NPM
npm install -g mcp-consultant
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/amsv01/mcp-consultant.git
cd mcp-consultant

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your OpenAI API key to .env
# OPENAI_API_KEY=your-api-key-here

# Build the project
npm run build

# Run in development mode
npm run dev
```

## Integration

### Claude Code

```bash
# Using npx (when published)
claude mcp add consultant -- npx mcp-consultant

# Local development
claude mcp add consultant-dev -s local -- node /path/to/mcp-consultant/build/index.js
```

### Copliot

```json
{
  "mcp": {
    "servers": {
      "consultant": {
        "command": "npx",
        "args": ["mcp-consultant"],
        "env": {
          "OPENAI_API_KEY": "your-api-key-here"
        }
      }
    }
  }
}
```

## Core Tools

### 1. think-about-plan

Get strategic feedback on your plan from GPT-5

**Input**: Plan description, optional context
**Output**: Feedback, suggestions, risks

### 2. suggest-alternative

Request alternative approaches to your current solution

**Input**: Current approach, constraints, goals
**Output**: Alternative solutions with trade-offs

### 3. improve-copy

Improve text, documentation, or messaging

**Input**: Original text, purpose, target audience
**Output**: Improved version with explanations

### 4. solve-problem

Debug and problem-solving assistance

**Input**: Problem description, attempted solutions, error messages
**Output**: Root cause analysis and solutions

## Configuration

See [.env.example](./.env.example) for all available configuration options.

Key environment variables:

```bash
# Required
OPENAI_API_KEY=your-api-key-here

# Optional
OPENAI_MODEL=gpt-5                    # gpt-5, gpt-5-mini, gpt-5-nano
OPENAI_REASONING_EFFORT=medium        # minimal, low, medium, high
OPENAI_MAX_TOKENS=4096
TRANSPORT=stdio                        # stdio, streaming
LOG_LEVEL=info
```

## Documentation

- [MCP Specification Notes](./docs/mcp-spec-notes.md) - OAuth 2.1, transports, security
- [OpenAI API Notes](./docs/openai-api-notes.md) - GPT-5 reasoning effort, models
- [SDK Patterns](./docs/sdk-patterns.md) - TypeScript SDK best practices
- [Integration Patterns](./docs/integration-patterns.md) - Deployment and integration guides

## Development

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Testing
npm test
npm run test:coverage

# Debug with MCP Inspector
npm run inspector
```

## Project Structure

```
mcp-consultant/
├── src/
│   ├── index.ts              # Entry point with shebang
│   ├── server.ts             # Main server setup
│   ├── config/               # Configuration management
│   ├── llm/                  # OpenAI client
│   ├── context/              # Context gathering
│   ├── tools/                # MCP tool implementations
│   └── utils/                # Utilities and helpers
├── docs/                     # Technical documentation
├── .github/workflows/        # CI/CD pipelines
├── examples/                 # Usage examples
└── build/                    # Compiled output
```

## Tech Stack

- **Runtime**: Node.js 22.18+
- **Language**: TypeScript with strict mode
- **MCP SDK**: @modelcontextprotocol/sdk v1.10.0+
- **LLM**: OpenAI GPT-5 series
- **Validation**: Zod
- **Logging**: Pino
- **Server**: Express.js (for HTTP transport)
- **Testing**: Vitest

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

[MIT License](./LICENSE)

## Links

- **Linear Project**: https://linear.app/effati/project/llm-consultant-mcp-server-ca23faa6a9e9
- **GitHub**: https://github.com/amsv01/mcp-consultant
- **Issues**: https://github.com/amsv01/mcp-consultant/issues

## Acknowledgments

Inspired by the archviz-ai project workflow and development practices.

Built with the Model Context Protocol by Anthropic.
