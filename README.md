# LLM Consultants

[![npm version](https://badge.fury.io/js/llm-consultants.svg)](https://www.npmjs.com/package/llm-consultants)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/amsv01/llm-consultants/workflows/Test/badge.svg)](https://github.com/amsv01/llm-consultants/actions)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.12.0-brightgreen)](https://nodejs.org)

A lightweight, open-source MCP server that enables AI assistants like Claude Code to consult GPT-5 models for specialized tasks while automatically gathering relevant context from your codebase.

[Quick Start](#quick-start) • [Documentation](./docs) • [Examples](./examples) • [Contributing](./CONTRIBUTING.md)

---

## Who Should Use This

This tool is designed for AI researchers, tool builders, and platform engineers who want to add specialized consultation capabilities to AI assistants and enable intelligent, automated context gathering from codebases.

---

## Features

The server supports multiple GPT-5 models (gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-pro, gpt-5-codex) with dynamic model selection. AI assistants can automatically choose the most appropriate model variant for each consultation based on task complexity and requirements. It automatically integrates with Serena, graph-memory, and cclsp MCPs to surface relevant code and metadata through smart context gathering.

Four specialized tools handle strategic planning, alternative solutions, copy improvement, and problem solving. Each tool accepts an optional `preferredModel` parameter, allowing the AI assistant to optimize model selection per task. The server ships production-ready with Docker support, non-root execution, sensitive-data redaction, and comprehensive structured logging via Pino.

You can install and run it with a single npx command. The defaults optimize for fast time-to-first-token using gpt-5-mini with minimal reasoning. The codebase maintains 80%+ test coverage with 46 passing unit tests.

---

## Quick Start

Get started in seconds with a single command:

```bash
npx llm-consultants
```

You can also install globally via npm or run it in Docker. For a global installation, use `npm install -g llm-consultants` and then run `llm-consultants`. To run in Docker, use `docker run -e OPENAI_API_KEY=your-key ghcr.io/amsv01/llm-consultants:latest`.

---

## Integration with AI Assistants

### Claude Code

The simplest setup uses npx:

```bash
claude mcp add --transport stdio consultant --env OPENAI_API_KEY=YOUR_KEY -- npx -y llm-consultants
```

If you've installed the package globally, replace `npx -y llm-consultants` with just `llm-consultants`. You can customize the server by adding environment variables like `OPENAI_MODEL=gpt-5-mini` or `LOG_LEVEL=info` to the command above.

[Detailed Claude Code setup guide →](./docs/integration/claude-code.md)

### Copliot

Add to your Copliot configuration:

```json
{
  "mcp": {
    "servers": {
      "consultant": {
        "command": "npx",
        "args": ["-y", "llm-consultants"],
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
    "args": ["-y", "llm-consultants"],
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
      "command": "npx -y llm-consultants",
      "env": {
        "OPENAI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

[Detailed Cursor setup guide →](./docs/integration/cursor.md)

---

## Configuration

Create a `.env` file or set environment variables:

```bash
# Required
OPENAI_API_KEY=sk-your-api-key-here

# Optional - Model Selection
OPENAI_MODEL=gpt-5-mini              # gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-codex
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

The server defaults to **gpt-5-mini** for cost-optimized performance with balanced speed and capability. AI assistants can override this default by specifying a `preferredModel` parameter in each tool invocation:

- **gpt-5**: Complex reasoning, broad world knowledge, and multi-step tasks
- **gpt-5-mini**: Balanced performance and cost (default)
- **gpt-5-nano**: High-throughput simple tasks
- **gpt-5-pro**: Advanced reasoning and specialized domains
- **gpt-5-codex**: Code generation, refactoring, debugging, and code explanations

The AI assistant automatically selects the most appropriate model based on task complexity when no preference is specified.

### Reasoning Effort Guide

The default **minimal** setting uses very few reasoning tokens for fastest time-to-first-token. Set to **low** when you favor speed with fewer tokens, **medium** for balanced reasoning and speed, or **high** for thorough reasoning on complex tasks.

[Full configuration reference →](./docs/configuration.md)

---

## Docker Deployment

The server ships production-ready with a multi-stage Docker build optimized for security and size. The image runs as a non-root user (nodejs:1001) with comprehensive security scanning during build.

### Quick Docker Start

Build and run the Docker image:

```bash
# Build the image
docker build -t llm-consultants .

# Run with environment variables
# Note: -i flag is required for stdio transport
docker run -i --rm \
  -e OPENAI_API_KEY=your-api-key \
  llm-consultants
```

### Using Docker Compose

The project includes a tested docker-compose.yml with resource limits and volume mounting support:

```bash
# Copy environment configuration
cp .env.example .env.docker
# Edit .env.docker with your API key

# Run with docker-compose
docker-compose up
```

### Docker Configuration

Environment variables can be passed to the container:

```yaml
services:
  llm-consultants:
    image: llm-consultants:latest
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_MODEL=${OPENAI_MODEL:-gpt-5-mini}
      - NODE_ENV=production
      - LOG_LEVEL=info
    volumes:
      - ./workspace:/workspace:ro # Optional: mount project files
    stdin_open: true
    tty: true
```

### Resource Limits

Production deployment includes sensible resource limits:

- **CPU**: 1 core limit, 0.5 core reservation
- **Memory**: 512MB limit, 256MB reservation
- **Image Size**: ~273MB (optimized Node.js 22 Alpine base)

### Testing Docker Setup

Run the comprehensive test suite:

```bash
# Run automated Docker tests
chmod +x scripts/test-docker.sh
./scripts/test-docker.sh
```

The test script verifies:

- Multi-stage build process
- Image size optimization
- Non-root user configuration (nodejs:1001)
- Security audit execution
- Container startup and stdio transport
- Environment variable handling
- File permissions and ownership
- Docker Compose configuration
- Resource limits

### Docker Security

The Dockerfile implements security best practices:

- Multi-stage build to minimize attack surface
- Runs as non-root user (nodejs:1001)
- Security audits during build (npm audit --audit-level=high)
- Production-only dependencies in final image
- Alpine Linux base for minimal footprint
- No unnecessary packages or build tools in production image

### Troubleshooting Docker

**Container exits immediately:** This is expected behavior for stdio transport. The MCP server requires an active stdin connection. Use the `-i` flag for interactive mode or connect via MCP client.

**Permission errors:** Ensure files are readable by the nodejs user (UID 1001). The Dockerfile sets proper ownership with `--chown=nodejs:nodejs`.

**Image size concerns:** The base Node.js 22 Alpine image contributes ~226MB (necessary for full runtime features). Production dependencies add ~46MB, resulting in a total size of ~273MB. This exceeds the original 200MB optimization target but remains practical for a full-featured MCP server with comprehensive Node.js capabilities.

---

## Available Tools

All tools support dynamic model selection through an optional `preferredModel` parameter. The AI assistant can automatically choose the most appropriate GPT-5 model variant (gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-pro, or gpt-5-codex) based on task complexity and requirements.

### 1. think-about-plan

Get strategic feedback on plans and approaches. The tool analyzes clarity, feasibility, risks, and dependencies while suggesting alternatives and providing actionable recommendations.

**Parameters:**

- `plan` (required): Description of the plan to analyze
- `context` (optional): Additional context about the plan
- `preferredModel` (optional): GPT-5 model variant to use

**Example Usage:**

```
"I'm planning to refactor our authentication system to use OAuth 2.0
with JWT tokens and refresh token rotation. What do you think?"
```

The response includes a clarity assessment, feasibility analysis, risk evaluation, dependencies identification, recommendations, and alternative approaches.

[API documentation →](./docs/api/think-about-plan.md)

### 2. suggest-alternative

Request alternative approaches or solutions. The tool considers different paradigms, simpler solutions, proven patterns, and trade-offs to provide multiple viable options.

**Parameters:**

- `currentApproach` (required): Description of the current approach
- `constraints` (optional): List of constraints or limitations
- `goals` (optional): List of goals or objectives
- `preferredModel` (optional): GPT-5 model variant to use

**Example Usage:**

```
"I'm using WebSockets for real-time notifications on mobile.
Can you suggest better approaches considering battery life and intermittent connectivity?"
```

The response presents multiple alternative approaches with pros and cons for each, trade-off analysis, and specific recommendations.

[API documentation →](./docs/api/suggest-alternative.md)

### 3. improve-copy

Improve text, documentation, or user-facing messages with a focus on clarity, conciseness, appropriate tone, logical structure, and accessibility.

**Parameters:**

- `originalText` (required): The text to improve
- `purpose` (required): Purpose of the text (e.g., "technical documentation", "error message")
- `targetAudience` (optional): Target audience (e.g., "developers", "end users")
- `preferredModel` (optional): GPT-5 model variant to use

**Example Usage:**

```
"Can you improve this error message:
'Error 500: Internal server error occurred. Contact administrator.'"
```

The response provides an improved version with an explanation of changes and reasoning for each improvement.

[API documentation →](./docs/api/improve-copy.md)

### 4. solve-problem

Get debugging and problem-solving assistance. The tool performs root cause analysis and provides diagnosis steps, proposed solutions, testing guidance, and prevention strategies.

**Parameters:**

- `problem` (required): Description of the problem
- `attemptedSolutions` (optional): List of solutions that have been tried
- `errorMessages` (optional): List of error messages or stack traces
- `relevantCode` (optional): Relevant code snippets
- `preferredModel` (optional): GPT-5 model variant to use

**Example Usage:**

```
"Users experiencing intermittent 500 errors when uploading large files.
I've increased server memory and checked disk space, but it still happens.
Error: Request Entity Too Large, ETIMEDOUT: Socket timeout"
```

The response includes root cause analysis, diagnosis steps, proposed solutions, testing guidance, and prevention strategies.

[API documentation →](./docs/api/solve-problem.md)

---

## Documentation

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

## Development

### Prerequisites

- Node.js >= 22.12.0
- npm >= 9.0.0
- OpenAI API key

### Setup

```bash
# Clone the repository
git clone https://github.com/amsv01/llm-consultants.git
cd llm-consultants

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

## Project Structure

```
llm-consultants/
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

## Contributing

We welcome contributions. Please see our [Contributing Guide](./CONTRIBUTING.md) for details on reporting bugs, requesting features, improving documentation, and submitting pull requests.

---

## Security

Security is a top priority. See our [Security Policy](./SECURITY.md) for details on reporting vulnerabilities, security best practices, API key management, and Docker security.

Never commit your OpenAI API key to version control. Always use environment variables or secrets management.

---

## Tech Stack

- **Runtime**: Node.js 22.20+
- **Language**: TypeScript with strict mode
- **MCP SDK**: @modelcontextprotocol/sdk v1.10.0+
- **LLM**: OpenAI GPT-5 Responses API
- **Validation**: Zod for schema validation
- **Logging**: Pino for structured logging
- **Testing**: Vitest with 80%+ coverage
- **CI/CD**: GitHub Actions

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

- Built with the [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- Powered by [OpenAI GPT-5](https://openai.com)
- Inspired by the MCP community

---

## Project Status

**Current Version**: 1.0.0

This project is actively maintained and production-ready. Core functionality is complete with comprehensive testing (46 tests passing), CI/CD pipeline configured, Docker containerization, and NPX distribution ready. Additional model support including gpt-5-pro and gpt-5-codex is planned.

[View roadmap →](https://linear.app/effati/project/llm-consultant-mcp-server-ca23faa6a9e9)

---

## Support

- 📖 [Documentation](./docs)
- 💬 [GitHub Discussions](https://github.com/amsv01/llm-consultants/discussions)
- 🐛 [Issue Tracker](https://github.com/amsv01/llm-consultants/issues)
- 📧 [Email Support](mailto:amin@effati.se)

---

## Star History

If you find this project useful, please consider giving it a star on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=amsv01/llm-consultants&type=Date)](https://star-history.com/#amsv01/llm-consultants&Date)
