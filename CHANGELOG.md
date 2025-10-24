## [1.2.4](https://github.com/effatico/kortx-mcp/compare/v1.2.3...v1.2.4) (2025-10-24)

### Bug Fixes

- Parse OpenAI Responses API output array correctly ([569a1f3](https://github.com/effatico/kortx-mcp/commit/569a1f316dd0be2479028c72f717f594a32d22ca))

### Features

- Add circuit breakers, fallback chains, and connection pooling ([#74](https://github.com/effatico/kortx-mcp/issues/74)) ([fffc004](https://github.com/effatico/kortx-mcp/commit/fffc004ecbc2625df0a2ad63b29b93dfa08f2000)), closes [#70](https://github.com/effatico/kortx-mcp/issues/70)
- Multi-Agent & Parallel Execution Support (Issue [#71](https://github.com/effatico/kortx-mcp/issues/71)) ([#75](https://github.com/effatico/kortx-mcp/issues/75)) ([77c18ad](https://github.com/effatico/kortx-mcp/commit/77c18addadc3ea60382c5c37c90c4b1f9980e942))
- Response Caching & Token Optimization ([#73](https://github.com/effatico/kortx-mcp/issues/73)) ([ecd3bec](https://github.com/effatico/kortx-mcp/commit/ecd3becd09aaa9eb1a1d757a1aae4166c1eb7eda)), closes [#69](https://github.com/effatico/kortx-mcp/issues/69) [#69](https://github.com/effatico/kortx-mcp/issues/69)
- Streaming & Advanced Performance Features (Issue [#72](https://github.com/effatico/kortx-mcp/issues/72)) ([#77](https://github.com/effatico/kortx-mcp/issues/77)) ([7896d2c](https://github.com/effatico/kortx-mcp/commit/7896d2cb9d1e716a55eb9c5ff0ceb979d5807170))
- Update package description to reflect all capabilities ([#58](https://github.com/effatico/kortx-mcp/issues/58)) ([55afbe2](https://github.com/effatico/kortx-mcp/commit/55afbe2705bd1909921d041114f309d53da97711))

## [1.2.3](https://github.com/effatico/kortx-mcp/compare/v1.2.2...v1.2.3) (2025-10-19)

### Features

- Add debug logging for image generation troubleshooting ([0230a04](https://github.com/effatico/kortx-mcp/commit/0230a0409ed7c7b90c78847c1f6948143fe52c2b))

## [1.2.2](https://github.com/effatico/kortx-mcp/compare/v1.2.1...v1.2.2) (2025-10-19)

## [1.2.1](https://github.com/effatico/kortx-mcp/compare/v1.2.0...v1.2.1) (2025-10-19)

### Bug Fixes

- PNG compression, audit logging, and timeout handling ([#53](https://github.com/effatico/kortx-mcp/issues/53)) ([854c6fa](https://github.com/effatico/kortx-mcp/commit/854c6fa19378a85c57a384ccd1937d538df73396))

# [1.2.0](https://github.com/effatico/kortx-mcp/compare/v1.1.3...v1.2.0) (2025-10-19)

### Features

- add comprehensive open source community files ([#11](https://github.com/effatico/kortx-mcp/issues/11)) ([361e19d](https://github.com/effatico/kortx-mcp/commit/361e19d2bee89e9f60347168b1594e4d9f350292))
- add GPT Image configuration support ([#47](https://github.com/effatico/kortx-mcp/issues/47)) ([4c6d2be](https://github.com/effatico/kortx-mcp/commit/4c6d2be939a01bf818b7be9f89bcbd6a7596bf91)), closes [#35](https://github.com/effatico/kortx-mcp/issues/35)
- add GPT Image types for Responses API integration ([#44](https://github.com/effatico/kortx-mcp/issues/44)) ([6fbc96d](https://github.com/effatico/kortx-mcp/commit/6fbc96dec0111704e81e0562df73de95b7cee408)), closes [#33](https://github.com/effatico/kortx-mcp/issues/33)
- implement CreateVisualTool for image generation and editing ([#49](https://github.com/effatico/kortx-mcp/issues/49)) ([2580e44](https://github.com/effatico/kortx-mcp/commit/2580e44eee7ad35af3dff857700e4e48cd0f811e)), closes [#37](https://github.com/effatico/kortx-mcp/issues/37)
- implement GPT Image client methods ([#45](https://github.com/effatico/kortx-mcp/issues/45)) ([e52560c](https://github.com/effatico/kortx-mcp/commit/e52560cb57acde489f818fbb800c52ab5d29ddb3)), closes [#34](https://github.com/effatico/kortx-mcp/issues/34)
- implement Perplexity client infrastructure with official SDK ([#26](https://github.com/effatico/kortx-mcp/issues/26)) ([ca4ec2d](https://github.com/effatico/kortx-mcp/commit/ca4ec2d625eed82d85f6adae35215f136980840f)), closes [#25](https://github.com/effatico/kortx-mcp/issues/25)
- implement search-content tool with Perplexity integration ([#28](https://github.com/effatico/kortx-mcp/issues/28)) ([78b7461](https://github.com/effatico/kortx-mcp/commit/78b7461fda05be84d11db025201db71c2faadb0c)), closes [#24](https://github.com/effatico/kortx-mcp/issues/24)
- integrate Perplexity image search into create-visual tool ([#50](https://github.com/effatico/kortx-mcp/issues/50)) ([c962415](https://github.com/effatico/kortx-mcp/commit/c9624153b52d9f9d4e5da95f5cdc9cc50739da12)), closes [#38](https://github.com/effatico/kortx-mcp/issues/38) [#38](https://github.com/effatico/kortx-mcp/issues/38)
- register create-visual tool in MCP server ([#51](https://github.com/effatico/kortx-mcp/issues/51)) ([7c382d6](https://github.com/effatico/kortx-mcp/commit/7c382d676aacf6969a73c53f951cc6caa33779b6)), closes [#39](https://github.com/effatico/kortx-mcp/issues/39)
- **tools:** Add create-visual input schema with mode validation ([#48](https://github.com/effatico/kortx-mcp/issues/48)) ([1637899](https://github.com/effatico/kortx-mcp/commit/16378992a3b2be3215bf71432782c61cbeb99e5e)), closes [#35](https://github.com/effatico/kortx-mcp/issues/35) [#36](https://github.com/effatico/kortx-mcp/issues/36)

## [1.1.4](https://github.com/effatico/kortx-mcp/compare/v1.1.3...v1.1.4) (2025-10-17)

### Features

- add comprehensive open source community files ([#11](https://github.com/effatico/kortx-mcp/issues/11)) ([361e19d](https://github.com/effatico/kortx-mcp/commit/361e19d2bee89e9f60347168b1594e4d9f350292))
- implement Perplexity client infrastructure with official SDK ([#26](https://github.com/effatico/kortx-mcp/issues/26)) ([ca4ec2d](https://github.com/effatico/kortx-mcp/commit/ca4ec2d625eed82d85f6adae35215f136980840f)), closes [#25](https://github.com/effatico/kortx-mcp/issues/25)
- implement search-content tool with Perplexity integration ([#28](https://github.com/effatico/kortx-mcp/issues/28)) ([78b7461](https://github.com/effatico/kortx-mcp/commit/78b7461fda05be84d11db025201db71c2faadb0c)), closes [#24](https://github.com/effatico/kortx-mcp/issues/24)

## [1.1.3](https://github.com/effatico/kortx-mcp/compare/v1.1.2...v1.1.3) (2025-10-17)

### Bug Fixes

- remove postpublish script to prevent tag conflicts in CI/CD ([233c2f6](https://github.com/effatico/kortx-mcp/commit/233c2f65665aeb70e60b64fd38930aa4a52d0d5a))

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

- **Create Visual Tool**: Visual content creation and research using GPT Image and Perplexity with three integrated modes
  - **Generate Mode**: Create images from text descriptions using GPT Image (gpt-image-1) via Responses API
    - Quality settings (auto, low, medium, high) with token-aware cost estimation
    - Size options (auto, square, landscape, portrait)
    - Background control (auto, opaque, transparent) for logos and UI elements
    - Format selection (PNG, JPEG, WebP) with configurable compression
    - Streaming support with partial images (0-3 progressive previews)
    - Generate up to 4 images per request
  - **Edit Mode**: Modify existing images through multi-turn conversational refinement
    - Input fidelity control (low/high) for preserving faces, logos, and fine details
    - Inpainting with a single optional mask image for precise regional edits
    - Multi-turn workflows where each edit builds on previous results
    - High fidelity preservation across multiple edit rounds
    - Support for multiple input images with one optional mask
  - **Search Mode**: Find visual inspiration using Perplexity web and academic search
    - Image URL results with dimensions and source citations
    - Search recency filters (week, month, year)
    - Web and academic search domains
    - Integration with search-content infrastructure
  - Comprehensive API documentation with usage examples for all three modes
  - Token usage tracking and cost estimation for both GPT Image and Perplexity
  - Full test coverage for mode validation, parameter handling, and error cases
- **Search Content Tool**: Real-time web search using Perplexity Sonar models with comprehensive citation support
  - Five Perplexity models: sonar, sonar-pro, sonar-deep-research, sonar-reasoning, sonar-reasoning-pro
  - Advanced search modes: web (general), academic (research papers), sec (SEC filings)
  - Search filters: recency (week/month/year), domain filtering, images, related questions
  - Reasoning effort control for deep-research model (low/medium/high)
  - Cost calculation for all Perplexity pricing tiers
  - Comprehensive test coverage (19 tests) for all search parameters
- **GPT-5-codex Model Support**: Added `gpt-5-codex` to supported models for code generation, refactoring, debugging, and code explanations
  - Updated configuration schema validation
  - Updated documentation across README, configuration guide, and integration guides
  - Model remains opt-in with `gpt-5-mini` as the default

### Enhanced

- **Documentation**: Added visual content creation workflow to business case scenarios demonstrating integrated research, generation, and iterative refinement advantages over separate tools
- **README**: Updated features section to highlight six specialized tools including visual content creation with multi-turn conversational editing capabilities

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
