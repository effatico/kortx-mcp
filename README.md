# Kortx

[![npm version](https://badge.fury.io/js/%40effatico%2Fkortx-mcp.svg)](https://www.npmjs.com/package/@effatico/kortx-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/effatico/kortx-mcp/workflows/CI/badge.svg)](https://github.com/effatico/kortx-mcp/actions)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.12.0-brightgreen)](https://nodejs.org)

A lightweight, open-source MCP server that enables AI assistants like Claude Code to consult GPT-5 models for strategic planning, code improvement, and problem-solving, plus real-time web search with Perplexity Sonar and visual content creation with GPT Image, while automatically gathering relevant context from your codebase.

[Quick Start](#quick-start) • [Documentation](./docs) • [Examples](./examples) • [Contributing](./CONTRIBUTING.md)

---

## Who Should Use This

This tool is designed for software development teams and individual developers who use AI assistants like Claude Code, Cursor, or Copliot. If you make technical decisions about architecture, debugging, technology selection, or visual content creation and want your AI assistant to provide context-aware recommendations backed by current research, kortx-mcp enhances your workflow.

Kortx-mcp is also valuable for AI researchers, tool builders, and platform engineers who want to add specialized consultation capabilities and intelligent context gathering to AI assistant integrations.

---

## Features

The server provides multiple GPT-5 variants (gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-pro, gpt-5-codex) for consultation tasks, Perplexity Sonar models (sonar, sonar-pro, sonar-deep-research, sonar-reasoning, sonar-reasoning-pro) for real-time web search, and GPT Image (gpt-image-1) for visual content creation. It integrates with Serena, graph-memory, and cclsp MCPs to fetch relevant code and metadata for context.

Six specialized tools handle strategic planning, alternative solutions, copy improvement, problem solving, real-time web search with citations, and visual content creation with multi-turn conversational editing. Each consultation tool accepts an optional `preferredModel` parameter, allowing assistants to request specific models while the system optimizes selection based on task complexity. The server ships production-ready with Docker support, non-root execution, sensitive-data redaction, and comprehensive structured logging via Pino.

You can install and run it with a single npx command. The defaults optimize for fast time-to-first-token using gpt-5-mini with minimal reasoning. The codebase maintains 80%+ test coverage with 86 passing unit tests.

---

## Quick Start

Get started in seconds with a single command:

```bash
npx @effatico/kortx-mcp
```

You can also install globally via npm or run it in Docker. For a global installation, use `npm install -g @effatico/kortx-mcp` and then run `kortx-mcp`. To run in Docker, use `docker run -e OPENAI_API_KEY=your-key ghcr.io/effatico/kortx-mcp:latest`.

---

## Integration with AI Assistants

### Claude Code

The simplest setup uses npx:

```bash
claude mcp add --transport stdio kortx-consultant \
  --env OPENAI_API_KEY=YOUR_KEY \
  --env PERPLEXITY_API_KEY=YOUR_PERPLEXITY_KEY \
  -- npx -y @effatico/kortx-mcp@latest
```

If you've installed the package globally, replace `npx -y @effatico/kortx-mcp@latest` with just `kortx-mcp`. You can customize the server by adding environment variables like `OPENAI_MODEL=gpt-5-mini` or `LOG_LEVEL=info` to the command above.

Note: The `PERPLEXITY_API_KEY` is optional but required for the `search-content` tool. You can obtain one from [Perplexity AI](https://www.perplexity.ai/settings/api).

[Detailed Claude Code setup guide →](./docs/integration/claude-code.md)

### Copliot

Add to your Copliot configuration:

```json
{
  "mcp": {
    "servers": {
      "consultant": {
        "command": "npx",
        "args": ["-y", "@effatico/kortx-mcp"],
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
    "args": ["-y", "@effatico/kortx-mcp"],
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
      "command": "npx -y @effatico/kortx-mcp",
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
PERPLEXITY_API_KEY=pplx-your-api-key-here

# Optional - Model Selection
OPENAI_MODEL=gpt-5-mini              # gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-codex
OPENAI_REASONING_EFFORT=minimal      # minimal, low, medium, high
OPENAI_VERBOSITY=low                 # low, medium, high
OPENAI_MAX_TOKENS=1024               # Output token limit

# Optional - Server
LOG_LEVEL=info                       # debug, info, warn, error
AUDIT_LOGGING=false                  # Enable logging to .audit/kortx-mcp.log
TRANSPORT=stdio                      # stdio, streaming

# Optional - GPT Image Configuration
GPT_IMAGE_TIMEOUT=120000             # API timeout in ms (2 minutes default)
GPT_IMAGE_SIZE=auto                  # 1024x1024, 1536x1024, 1024x1536, auto
GPT_IMAGE_QUALITY=auto               # low, medium, high, auto
GPT_IMAGE_FORMAT=png                 # png, jpeg, webp
GPT_IMAGE_COMPRESSION=85             # 0-100 (JPEG/WebP only, PNG always lossless)

# Optional - Context Gathering
ENABLE_SERENA=true                   # Semantic code search
ENABLE_MEMORY=true                   # Knowledge graph persistence
ENABLE_CCLSP=true                    # Language server features
MAX_CONTEXT_TOKENS=32000             # Context limit
```

### Model Selection Guide

The server uses **gpt-5-mini** as the default model for a cost-optimized balance of speed and capability. Assistants can override this by passing a `preferredModel` parameter with each tool call. If no `preferredModel` is provided, the assistant automatically selects an appropriate model based on task complexity.

**Available models:**

- **gpt-5** — Complex reasoning, broad knowledge, and multi-step tasks
- **gpt-5-mini** — Balanced performance and cost (default)
- **gpt-5-nano** — High-throughput, simple tasks
- **gpt-5-pro** — Advanced reasoning and specialized domains
- **gpt-5-codex** — Code generation, refactoring, debugging, and code explanations

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
docker build -t kortx-mcp .

# Run with environment variables
# Note: -i flag is required for stdio transport
docker run -i --rm \
  -e OPENAI_API_KEY=your-api-key \
  kortx-mcp
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
  kortx-mcp:
    image: kortx-mcp:latest
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
- **Image Size**: ~273MB (Node.js 22 Alpine base required for full MCP runtime)

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

### Troubleshooting Docker

**Container exits immediately:** This is expected behavior for stdio transport. The MCP server requires an active stdin connection. Use the `-i` flag for interactive mode or connect via MCP client.

**Permission errors:** Ensure files are readable by the nodejs user (UID 1001). The Dockerfile sets proper ownership with `--chown=nodejs:nodejs`.

**Image size concerns:** The final image size (~273MB) exceeds the original 200MB optimization target. This is a deliberate trade-off: the Node.js 22 Alpine base contributes ~226MB (required for full MCP runtime capabilities), and production dependencies add ~46MB. While larger than initially targeted, this remains practical and necessary for comprehensive Node.js MCP server functionality.

---

## Available Tools

Consultation tools (think-about-plan, suggest-alternative, improve-copy, solve-problem) accept an optional `preferredModel` parameter. When set, the assistant treats it as a preference but may override it to select the most suitable GPT-5 variant (gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-pro, or gpt-5-codex) based on task complexity and requirements.

The search-content tool uses Perplexity Sonar models for real-time web search with citations. The create-visual tool uses GPT Image for visual content creation and Perplexity for visual research.

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

### 5. search-content

Perform real-time web search using Perplexity's Sonar models. Returns comprehensive, well-sourced answers with citations from the web.

**Parameters:**

- `query` (required): Search query
- `model` (optional): Perplexity model (sonar, sonar-pro, sonar-deep-research, sonar-reasoning, sonar-reasoning-pro)
- `searchMode` (optional): Search mode - web for general search, academic for research papers, sec for SEC filings
- `searchRecencyFilter` (optional): Filter by recency (week, month, year)
- `searchDomainFilter` (optional): Array of domains to filter (e.g., ["github.com", "stackoverflow.com"])
- `returnImages` (optional): Include image results
- `returnRelatedQuestions` (optional): Include related follow-up questions
- `reasoningEffort` (optional): Reasoning level for sonar-deep-research model (low, medium, high)

**Example Usage:**

```
"What are the latest best practices for implementing WebAuthn in 2025?"
```

The response includes comprehensive search results with citations, sources, and optional related questions for deeper exploration.

### 6. create-visual

Generate, edit, and search for images using GPT Image and Perplexity. Supports three modes: generate new images from text descriptions, edit existing images through multi-turn conversational refinement, and search the web for visual inspiration.

**Parameters:**

- `mode` (required): Operation mode - "generate", "edit", or "search"
- `prompt` (required): Text description or search query
- `quality` (optional): Image quality - auto, low, medium, high
- `size` (optional): Image dimensions - auto, square, landscape, portrait
- `background` (optional): Background type - auto, opaque, transparent
- `outputFormat` (optional): Image format - png, jpeg, webp
- `n` (optional): Number of images to generate (1-4)
- `inputImages` (edit mode): Array of input images as base64 or file IDs
- `inputFidelity` (edit mode): Detail preservation - low or high
- `searchMode` (search mode): Search domain - web or academic
- `searchRecencyFilter` (search mode): Time filter - week, month, year

**Example Usage (Generate):**

```
"Create a modern minimalist logo for a tech startup,
featuring geometric shapes in blue and white with transparent background"
```

**Example Usage (Edit):**

```
"Change the sky to a dramatic sunset with orange and purple clouds,
preserving the faces and details in the foreground"
```

**Example Usage (Search):**

```
"Find examples of modern Scandinavian interior design
with natural wood and neutral colors from the past month"
```

The response includes generated images with revised prompts, search results with image URLs and citations, token usage breakdown, and cost estimation.

**Key Capabilities:**

- **Multi-turn editing**: Iteratively refine images through conversational prompts
- **High fidelity preservation**: Maintain faces, logos, and fine details during edits
- **Streaming support**: Receive partial images during generation
- **Transparency control**: Generate images with transparent backgrounds
- **Inpainting**: Edit specific regions using mask images
- **Visual research**: Find inspiration through web and academic search

[API documentation →](./docs/api/create-visual.md)

---

## When Kortx-MCP Delivers Superior Results

Kortx-MCP excels in specific scenarios where its unique combination of multiple GPT-5 models, real-time web search, codebase context gathering, and memory integration produces better outcomes than alternatives.

### 1. When Decisions Require Both Deep Reasoning and Current Information

**The Problem**:
Using ChatGPT or Claude directly gives you reasoning but misses recent developments. Google search gives you current information but no analysis. Doing both manually is slow and you lose the synthesis between research and reasoning.

**Why Kortx-MCP Wins**:

A single workflow combines Perplexity search (with citations) for current information and GPT-5 reasoning for analysis. When evaluating a technology migration, `search-content` finds 2025 case studies and performance benchmarks, then `think-about-plan` analyzes them against your specific constraints with GPT-5 strategic reasoning. The context gatherer adds your existing codebase patterns to ensure recommendations fit your architecture.

**Concrete Comparison**:

- **Without kortx-mcp**: Spend 2 days searching Stack Overflow, blogs, GitHub issues → manually synthesize → ask ChatGPT for analysis → manually reconcile with your codebase → still miss how it fits your patterns
- **With kortx-mcp**: `search-content` finds current adoption patterns with citations → `suggest-alternative` analyzes options with your constraints → context gatherer checks your existing code → get integrated recommendation in 30 minutes

**Real Example**: Team evaluating database options. Search-content found recent PostgreSQL 16 performance improvements and Supabase real-time features (2024-2025 information ChatGPT doesn't have). Think-about-plan analyzed this against their serverless architecture and scaling needs. Suggest-alternative compared PostgreSQL, MongoDB, and DynamoDB with specific constraints. Result: Chose PostgreSQL with pgvector instead of MongoDB, saving $40k/year in atlas costs based on current pricing they researched.

### 2. When Problems Need Root Cause Analysis with Codebase Context

**The Problem**:
ChatGPT can suggest debugging approaches but doesn't see your code. Manual debugging requires deep codebase knowledge and time. Stack Overflow answers are generic, not tailored to your architecture.

**Why Kortx-MCP Wins**:

`solve-problem` gets GPT-5 root cause analysis while the context gatherer automatically pulls relevant code from your codebase through Serena (semantic search) and CCLSP (language server). When debugging performance issues, it sees your actual database queries, caching setup, and related code without you manually copying it.

**Concrete Comparison**:

- **Without kortx-mcp**: Copy error messages to ChatGPT → get generic advice → manually find relevant code → paste code → get more advice → manually check if it fits your setup → repeat 4-5 times
- **With kortx-mcp**: Describe problem → context gatherer finds relevant code automatically → GPT-5 analyzes with actual codebase context → get specific solution for your setup → memory search shows if team solved this before

**Real Example**: Developer facing N+1 query problem. ChatGPT suggested "use eager loading" (generic). With kortx-mcp, solve-problem saw their actual ORM setup through context gathering, identified they were using Sequelize (not ActiveRecord), and provided the specific Sequelize `include` syntax for their models. Also found two similar past solutions in memory where team already solved N+1 in other services, showing the exact pattern to follow.

### 3. When You Need Different AI Capabilities in One Workflow

**The Problem**:
Complex tasks need different AI strengths: strategic planning needs reasoning depth, documentation needs writing expertise, research needs web search. Using multiple AI tools separately loses context between steps.

**Why Kortx-MCP Wins**:

Kortx-MCP orchestrates GPT-5 (reasoning), GPT-5-codex (code), GPT-5-pro (complex analysis), and Perplexity (search) in coordinated workflows. Planning a migration: `search-content` researches current patterns → `think-about-plan` validates strategy → `suggest-alternative` explores approaches → `improve-copy` drafts migration docs → `solve-problem` handles technical blockers. Each step references previous results.

**Concrete Comparison**:

- **Without kortx-mcp**: Use ChatGPT for planning → switch to Perplexity for research → copy results back to ChatGPT → use different tool for code → manually track what each said → lose context between tools
- **With kortx-mcp**: Sequential workflow where each tool references previous steps → context persists → memory stores the full decision trail → one coherent output

**Real Example**: API versioning strategy. Search-content found how Stripe and Twilio handle versioning (current practices). Think-about-plan validated their sunset timeline against customer impact. Suggest-alternative compared URL versioning vs header versioning vs content negotiation. Improve-copy drafted the migration guide for customers. All in one session, each step building on previous. Resulted in complete strategy in 2 hours vs. 2 days of fragmented research.

### 4. When Organizational Memory Improves Future Decisions

**The Problem**:
AI tools give one-time answers. Past decisions live in Slack/wikis where you forget to search them. You repeatedly ask similar questions, getting similar advice without learning patterns.

**Why Kortx-MCP Wins**:

Every consultation can be stored in graph memory with relationships. When planning a new service, memory search finds past service designs, their outcomes, and lessons learned. Future AI consultations reference this accumulated knowledge. Decisions compound instead of resetting.

**Concrete Comparison**:

- **Without kortx-mcp**: Ask ChatGPT for advice → implement → 6 months later, different team member asks similar question → ChatGPT gives different advice → no institutional learning
- **With kortx-mcp**: Ask GPT-5 for advice → store decision with rationale in memory → 6 months later, memory search finds past decision → new consultation references it → consistency and learning compound

**Real Example**: Team used kortx-mcp for 6 months, storing architectural decisions. When planning a notification service, memory search found past decisions about async processing (chose SQS), rate limiting patterns, and retry logic from three previous services. Think-about-plan analyzed new service against these patterns, identifying where to stay consistent and where this service's requirements differed. New service launched with 40% fewer design iterations because they learned from past services.

### 5. When Code Context Changes the Answer

**The Problem**:
Generic AI advice doesn't account for your team's patterns, existing abstractions, or codebase conventions. Implementing "best practices" that conflict with your architecture creates technical debt.

**Why Kortx-MCP Wins**:

Context gatherer integrates with Serena (semantic code search), graph-memory (past decisions), and CCLSP (language server) to automatically provide codebase-specific context. Recommendations align with your existing patterns rather than forcing you to adapt generic advice.

**Concrete Comparison**:

- **Without kortx-mcp**: Ask ChatGPT "how to add caching" → get Redis examples → your team uses Memcached → manually translate advice → doesn't account for your existing cache abstraction layer
- **With kortx-mcp**: Ask about caching → context gatherer sees you use Memcached through Serena → sees your cache wrapper class through CCLSP → GPT-5 provides solution using your existing patterns

**Real Example**: Adding rate limiting to API. Without context, ChatGPT suggested express-rate-limit (generic). With kortx-mcp, context gatherer found team already had a custom rate-limiter middleware for other endpoints, stored in graph memory from past decision. Suggest-alternative proposed extending existing middleware vs new library, showing how to reuse the existing pattern. Saved introducing another dependency and maintained consistency across API endpoints.

### 6. When Visual Content Creation Needs Research and Iteration

**The Problem**:
Creating visual content typically requires separate tools for research (Google Images, Pinterest), generation (DALL-E, Midjourney), and iteration. You lose context between research and creation, manually transferring ideas between tools. Multi-turn refinement means multiple separate requests without conversational flow.

**Why Kortx-MCP Wins**:

One workflow combines Perplexity visual search for inspiration and reference gathering with GPT Image's multi-turn conversational editing. Research design trends with `create-visual` search mode, then generate variations using those insights, then iteratively refine through natural conversation without losing context or starting over.

**Concrete Comparison**:

- **Without kortx-mcp**: Search Pinterest for logo inspiration → screenshot examples → describe to DALL-E → regenerate entire image for each change → no conversation history → manually track what worked
- **With kortx-mcp**: `create-visual` search mode finds current logo trends with citations → generate initial concepts → "make the icon more geometric" → "change blue to navy" → "add subtle gradient" → each edit builds on previous, preserving context

**Real Example**: Designing marketing graphics for product launch. Used create-visual search mode to find current SaaS dashboard design trends (2025 examples with citations). Generated hero image with specific style references. Through 4 conversational turns, refined: changed color scheme to match brand, adjusted composition for text overlay, increased contrast for readability, added transparent background for flexible placement. Final result in 30 minutes vs 3 hours of back-and-forth with separate tools. High fidelity mode preserved brand logo perfectly across all edits.

## Bottom Line

Kortx-MCP delivers superior results when you need:

- **Current information + deep reasoning** in one workflow
- **Codebase context** for accurate, specific advice
- **Multiple AI capabilities** orchestrated together (reasoning, search, visual creation)
- **Organizational learning** that compounds over time
- **Recommendations that fit your architecture**, not generic patterns
- **Visual content creation** with research-backed iteration and conversational refinement

Use ChatGPT/Claude directly for quick questions. Use kortx-mcp when the quality of the decision justifies the integration setup.

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
- [create-visual](./docs/api/create-visual.md)

### Examples

- [Strategic Planning Workflow](./examples/strategic-planning.md)
- [Code Review Workflow](./examples/code-review.md)
- [Documentation Improvement](./examples/documentation-improvement.md)
- [Debugging Session](./examples/debugging-session.md)

### Developer Documentation

Developer documentation is available in the [docs/](./docs/) directory.

---

## Development

### Prerequisites

- Node.js >= 22.12.0
- npm >= 9.0.0
- OpenAI API key

### Setup

```bash
# Clone the repository
git clone https://github.com/effatico/kortx-mcp.git
cd kortx-mcp

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

---

## Contributing

We welcome contributions. Please see our [Contributing Guide](./CONTRIBUTING.md) for details on reporting bugs, requesting features, improving documentation, and submitting pull requests.

---

## Security

Security is a top priority. See our [Security Policy](./SECURITY.md) for details on reporting vulnerabilities, security best practices, API key management, and Docker security.

Never commit your OpenAI API key to version control. Always use environment variables or secrets management.

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Support

- 📖 [Documentation](./docs)
- 💬 [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)
- 🐛 [Issue Tracker](https://github.com/effatico/kortx-mcp/issues)
- 📧 [Email Support](mailto:info@effati.se)

---

## Star History

If you find this project useful, please consider giving it a star on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=effatico/kortx-mcp&type=Date)](https://star-history.com/#effatico/kortx-mcp&Date)
