## [1.1.2](https://github.com/effatico/kortx-mcp/compare/v1.1.1...v1.1.2) (2025-10-17)

### Bug Fixes

- remove coverage threshold enforcement from release workflow ([c0f93e6](https://github.com/effatico/kortx-mcp/commit/c0f93e6d76a7e591866d777d369b158d2973428f))

## [1.1.1](https://github.com/effatico/kortx-mcp/compare/v1.1.0...v1.1.1) (2025-10-17)

### Bug Fixes

- correct binary name in package.json and fix OpenAI API response test mocks ([4df3b50](https://github.com/effatico/kortx-mcp/commit/4df3b506044399eb9c45946bd18a29f85fceded0))
- resolve TypeScript lint warnings with proper type assertions ([bc61756](https://github.com/effatico/kortx-mcp/commit/bc61756fa84db99d5e84ca2d8dfcadbf268dfdc1))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **GPT-5-codex Model Support**: Added `gpt-5-codex` to supported models for code generation, refactoring, debugging, and code explanations
  - Updated configuration schema validation
  - Updated documentation across README, configuration guide, and integration guides
  - Model remains opt-in with `gpt-5-mini` as the default

## [1.0.0] - 2025-10-15

### Added

#### Core Features

- **MCP Server**: Full implementation with stdio transport for Claude Code integration
- **GPT-5 Integration**: Support for GPT-5, GPT-5-mini, GPT-5-nano, and GPT-5-codex via OpenAI Responses API
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
- **NPX Distribution**: Ready for `npx llm-consultants` execution

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
