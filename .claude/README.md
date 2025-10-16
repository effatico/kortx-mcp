# LLM Consultants - Claude Code Implementation Guide

Open-source MCP server enabling AI assistants to consult with GPT-5 for specialized tasks with intelligent context gathering.

## Project Overview

This MCP server provides four specialized consultation tools that leverage GPT-5 models for strategic planning, alternative suggestions, copy improvement, and problem solving. It integrates with other MCP servers to gather relevant context from your codebase automatically.

### Key Features

- Multi-model support: GPT-5, GPT-5-mini, GPT-5-nano, and GPT-5-codex
- Smart context gathering from Serena, graph-memory, and cclsp
- Specialized consultation tools optimized for different tasks
- Production-ready with Docker support and NPX distribution

## Implementation Order

This project was built in phases. If you're implementing similar features or need to understand the architecture:

1. **Phase 0**: Research - Review MCP specification, OpenAI API docs, and best practices
2. **Phase 1**: Project structure - Set up TypeScript, build tools, and initial files
3. **Phase 2-3**: Core config and logging - Zod validation, env parsing, Pino structured logging
4. **Phase 4**: OpenAI client - Responses API integration with streaming support
5. **Phase 5**: Context gathering - Multi-source context orchestration (Serena, memory, cclsp)
6. **Phase 6**: MCP tools - Four specialized tools with parameter validation
7. **Phase 7**: Server setup - MCP SDK integration and transport handling
8. **Phase 8**: Docker support - Containerization with security best practices
9. **Phase 9**: NPX distribution - Package.json configuration for global/npx usage
10. **Phase 10**: Tests - Vitest with 80%+ coverage
11. **Phase 11**: Documentation - Comprehensive guides and API docs
12. **Phase 12**: Claude Code optimization - This guide and testing scripts

## Key Integration Points

### Serena MCP

Used for semantic code search and symbol navigation. Enable with `ENABLE_SERENA=true`.

**Use cases:**

- Finding relevant code snippets for context
- Symbol definitions and relationships
- Semantic search within codebase

### graph-memory MCP

Used for knowledge graph persistence and project memory. Enable with `ENABLE_MEMORY=true`.

**Use cases:**

- Storing and retrieving project context
- Building knowledge about codebase patterns
- Maintaining conversation history

### cclsp MCP

Used for language server features and code intelligence. Enable with `ENABLE_CCLSP=true`.

**Use cases:**

- Type information and definitions
- Code completion context
- Diagnostics and validation

## Testing Strategy

### Unit Tests

Run after implementing or modifying features:

```bash
npm test                 # Run all tests
npm run test:coverage    # With coverage report
```

### Build Verification

Always verify the build succeeds:

```bash
npm run build           # TypeScript compilation
npm run type-check      # Type checking only
```

### Code Quality

Before committing:

```bash
npm run lint            # ESLint checks
npm run format:check    # Prettier formatting
```

### Integration Testing

Test with Claude Code using the local development version:

```bash
./scripts/test-with-claude-code.sh
```

## Common Pitfalls

### Configuration Issues

**Don't**: Mix up environment variable names

```bash
# Wrong
OPENAI_KEY=sk-...
MODEL=gpt-5
```

**Do**: Use exact variable names from `.env.example`

```bash
# Correct
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5
```

### Schema Validation

**Don't**: Skip Zod validation at runtime

```typescript
// Wrong - no validation
const config = process.env;
```

**Do**: Always validate with Zod schemas

```typescript
// Correct - validated
const config = configSchema.parse(process.env);
```

### Module System

**Don't**: Use CommonJS syntax in this ES modules project

```typescript
// Wrong
const express = require('express');
module.exports = server;
```

**Do**: Use ES modules throughout

```typescript
// Correct
import express from 'express';
export { server };
```

### Transport Handling

**Don't**: Assume a specific transport

```typescript
// Wrong - assumes stdio
process.stdin.pipe(server);
```

**Do**: Handle both stdio and streaming transports

```typescript
// Correct - check TRANSPORT env variable
if (transport === 'stdio') {
  /* ... */
}
```

### Context Gathering

**Don't**: Gather all possible context for every request

```typescript
// Wrong - excessive context
const context = await gatherAllContext();
```

**Do**: Gather only relevant context based on the task

```typescript
// Correct - selective gathering
const context = await gatherRelevantContext(toolName, params);
```

### Error Handling

**Don't**: Let errors crash the server

```typescript
// Wrong - uncaught errors
const result = await openai.chat();
```

**Do**: Handle errors gracefully with logging

```typescript
// Correct - proper error handling
try {
  const result = await openai.chat();
} catch (error) {
  logger.error({ error }, 'OpenAI API call failed');
  throw new Error('Consultation failed');
}
```

### Logging

**Don't**: Use console.log for debugging

```typescript
// Wrong
console.log('Processing request:', request);
```

**Do**: Use structured Pino logging

```typescript
// Correct
logger.info({ request }, 'Processing consultation request');
```

### Node.js Version

**Don't**: Use Node.js < 22.12.0

- Type stripping requires Node.js 22.12+
- Some ES module features need recent Node.js

**Do**: Specify in package.json and verify

```json
"engines": {
  "node": ">=22.12.0"
}
```

### API Keys

**Don't**: Commit API keys or hardcode them

```typescript
// Wrong
const apiKey = 'sk-proj-abc123...';
```

**Do**: Always use environment variables

```typescript
// Correct
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY required');
```

## Quick Reference

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint and format
npm run lint:fix
npm run format

# Debug with MCP Inspector
npm run inspector
```

### Project Structure

```
src/
├── index.ts              # Entry point with shebang
├── server.ts             # Main MCP server setup
├── config/               # Zod validation, env parsing
├── llm/                  # OpenAI GPT-5 integration
│   ├── openai-client.ts  # Responses API client
│   └── types.ts
├── context/              # Context gathering system
│   ├── gatherer.ts       # Main orchestrator
│   └── sources/          # Serena, memory, cclsp
├── tools/                # MCP tool implementations
│   ├── think-about-plan.ts
│   ├── suggest-alternative.ts
│   ├── improve-copy.ts
│   └── solve-problem.ts
└── utils/
    └── logger.ts         # Pino structured logging
```

### Important Files

- `.env.example` - Template for environment variables
- `package.json` - Dependencies and build config
- `tsconfig.json` - TypeScript compiler options
- `vitest.config.ts` - Test configuration
- `Dockerfile` - Container build instructions
- `docs/` - Comprehensive documentation

## Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Project Documentation](../docs/)
- [Integration Guides](../docs/integration/)
- [API Documentation](../docs/api/)

## Getting Help

- Read the [Troubleshooting Guide](../docs/troubleshooting.md)
- Check [GitHub Discussions](https://github.com/amsv01/llm-consultants/discussions)
- Review [Integration Examples](../examples/)
- Consult the [Claude Code Integration Guide](../docs/integration/claude-code.md)
