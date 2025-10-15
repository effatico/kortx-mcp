# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-10-15

### Added

#### Core Features

- **MCP Server**: Full implementation with stdio transport for Claude Code integration
- **GPT-5 Integration**: Support for GPT-5, GPT-5-mini, and GPT-5-nano via OpenAI Responses API
- **Four Consultation Tools**:
  - `think-about-plan`: Strategic planning feedback with 6-point analysis framework
  - `suggest-alternative`: Alternative approaches with trade-off analysis
  - `improve-copy`: Text and documentation improvement
  - `solve-problem`: Debugging assistance with root cause analysis

#### Context Gathering

- Intelligent multi-source context collection:
  - File system analysis
  - Serena MCP integration (semantic code search)
  - graph-memory MCP integration (knowledge persistence)
  - cclsp MCP integration (language server features)

#### Infrastructure

- **Configuration Management**: Zod-based validation with environment variables
- **Structured Logging**: Production-ready Pino logging with:
  - Stdio transport file logging (non-interfering with MCP)
  - Log levels, custom formatters, sensitive data redaction
  - Request/response logging, tool execution tracking
- **Docker Support**:
  - Multi-stage Dockerfile with security best practices
  - Non-root user execution (nodejs:1001)
  - Docker Compose with resource limits
  - Automated build/run scripts (275MB final image)
- **NPX Distribution**: Ready for `npx mcp-consultant` execution

#### Development

- TypeScript with strict typing
- ESLint + Prettier with pre-commit hooks
- Vitest testing framework
- Comprehensive error handling with MCP error codes

### Technical Details

- **Node.js**: Requires >=22.12.0
- **Performance**: Optimized defaults (gpt-5-mini, minimal reasoning, 1024 tokens) to prevent MCP timeouts
- **Security**: Non-root Docker execution, sensitive data redaction, no secrets in images

### Dependencies

- @modelcontextprotocol/sdk ^1.10.0
- openai ^4.28.0
- zod ^3.22.4
- pino ^8.17.2
- express ^4.18.2
- dotenv ^16.3.1

## [0.1.0] - 2025-10-15

### Added

- Initial project structure and research
- Development environment setup
