# Integration Patterns

## Overview

Best practices for integrating the kortx-mcp server with AI assistants and external context sources.

## Claude Code Integration

### Installation

```bash
# Using npx (recommended for published package)
claude mcp add consultant -- npx kortx-mcp

# Using local development build
claude mcp add consultant-dev -s local -- node /absolute/path/to/kortx-mcp/build/index.js
```

### Configuration

Manual configuration in `~/.config/claude/mcp.json`:

```json
{
  "mcpServers": {
    "consultant": {
      "command": "npx",
      "args": ["kortx-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-api-key-here",
        "OPENAI_MODEL": "gpt-5",
        "OPENAI_REASONING_EFFORT": "medium",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Development Testing

During development, rebuild before testing:

```bash
npm run build
claude mcp add consultant-dev -s local -- node $(pwd)/build/index.js
```

## Copliot Integration

Configuration in Copliot settings:

```json
{
  "mcp": {
    "servers": {
      "consultant": {
        "command": "npx",
        "args": ["kortx-mcp"],
        "env": {
          "OPENAI_API_KEY": "your-api-key-here",
          "OPENAI_MODEL": "gpt-5",
          "ENABLE_SERENA": "true",
          "ENABLE_MEMORY": "true",
          "ENABLE_CCLSP": "true"
        }
      }
    }
  }
}
```

## Context Source Integration

### Serena MCP (Semantic Code Search)

**Purpose**: Provides semantic code understanding and LSP features

**Integration**:

```typescript
import { ContextSource } from '../context/gatherer.js';

class SerenaContextSource implements ContextSource {
  name = 'serena';

  async gather(query: string): Promise<ContextChunk[]> {
    // Call Serena MCP to get semantic code results
    const results = await callSerenaMcp({
      query,
      maxResults: 10,
    });

    return results.map(result => ({
      source: 'serena',
      content: result.code,
      relevance: result.score,
      metadata: {
        filePath: result.path,
        language: result.language,
      },
    }));
  }

  estimateTokens(): number {
    return 5000; // Approximate
  }
}
```

### Graph Memory MCP (Project Context)

**Purpose**: Provides project history, decisions, and architectural patterns

**Integration**:

```typescript
class GraphMemoryContextSource implements ContextSource {
  name = 'graph-memory';

  async gather(query: string): Promise<ContextChunk[]> {
    // Search graph-memory for relevant entities and relations
    const nodes = await searchGraphMemory({
      query,
      context: 'project-name',
    });

    return nodes.map(node => ({
      source: 'graph-memory',
      content: formatNode(node),
      relevance: node.relevance,
      metadata: {
        entityType: node.type,
        relations: node.relations,
      },
    }));
  }

  estimateTokens(): number {
    return 3000;
  }
}
```

### CCLSP MCP (Language Server Features)

**Purpose**: Provides language server protocol features (definitions, references, symbols)

**Integration**:

```typescript
class CclspContextSource implements ContextSource {
  name = 'cclsp';

  async gather(query: string): Promise<ContextChunk[]> {
    // Get LSP features from CCLSP
    const symbols = await callCclspMcp({
      action: 'workspace/symbol',
      query,
    });

    return symbols.map(symbol => ({
      source: 'cclsp',
      content: symbol.definition,
      relevance: computeRelevance(query, symbol.name),
      metadata: {
        symbolKind: symbol.kind,
        location: symbol.location,
      },
    }));
  }

  estimateTokens(): number {
    return 2000;
  }
}
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:22.20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production image
FROM node:22.20-alpine

# Security: Run as non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/build ./build
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs

# Default to stdio transport
CMD ["node", "build/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  kortx-mcp:
    build: .
    image: kortx-mcp:latest
    container_name: kortx-mcp
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_MODEL=${OPENAI_MODEL:-gpt-5}
      - NODE_ENV=production
      - LOG_LEVEL=info
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## HTTP Server Deployment

### Express Server Setup

```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/mcp', limiter);

// JSON parsing
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MCP endpoint
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on('close', () => transport.close());

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
  console.log(`MCP Server running on http://localhost:${port}`);
});
```

### Serverless Deployment (Vercel/AWS Lambda)

```typescript
// api/mcp.ts (Vercel)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const server = new McpServer({ name: 'consultant', version: '1.0.0' });
  // Register tools...

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  await transport.handleRequest(req as any, res as any, req.body);
}
```

## Environment-Based Configuration

### Development

```bash
NODE_ENV=development
TRANSPORT=stdio
LOG_LEVEL=debug
ENABLE_API_DOCS=true
```

### Staging

```bash
NODE_ENV=staging
TRANSPORT=streaming
PORT=3000
LOG_LEVEL=info
ENABLE_API_DOCS=true
```

### Production

```bash
NODE_ENV=production
TRANSPORT=streaming
PORT=3000
LOG_LEVEL=warn
ENABLE_API_DOCS=false
```

## Monitoring and Observability

### Structured Logging

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true },
        }
      : undefined,
});

// Log tool calls
logger.info(
  {
    event: 'tool_call',
    tool: 'think-about-plan',
    tokensUsed: 1234,
    duration: 2500,
  },
  'Tool executed'
);
```

### Metrics Collection

```typescript
interface Metrics {
  toolCalls: number;
  tokensUsed: number;
  errors: number;
  avgResponseTime: number;
}

class MetricsCollector {
  private metrics: Metrics = {
    toolCalls: 0,
    tokensUsed: 0,
    errors: 0,
    avgResponseTime: 0,
  };

  recordToolCall(tokens: number, duration: number) {
    this.metrics.toolCalls++;
    this.metrics.tokensUsed += tokens;
    this.updateAvgResponseTime(duration);
  }

  recordError() {
    this.metrics.errors++;
  }

  private updateAvgResponseTime(duration: number) {
    const n = this.metrics.toolCalls;
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime * (n - 1) + duration) / n;
  }

  getMetrics(): Metrics {
    return { ...this.metrics };
  }
}
```

## Security Best Practices

### API Key Management

```typescript
// Never hardcode API keys
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

// Use secure storage in production
// - AWS Secrets Manager
// - Azure Key Vault
// - Google Cloud Secret Manager
// - HashiCorp Vault
```

### Input Validation

```typescript
import { z } from 'zod';

const ToolInputSchema = z
  .object({
    plan: z.string().min(10, 'Plan too short').max(50000, 'Plan too long'),
    context: z.string().optional(),
  })
  .strict(); // Reject unknown properties

// Validate all inputs
const validated = ToolInputSchema.parse(input);
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const mcpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/mcp', mcpLimiter);
```

## Testing Integration

### Local Testing

```bash
# Build project
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector build/index.js

# Test with Claude Code
claude mcp add consultant-dev -s local -- node $(pwd)/build/index.js
```

### CI/CD Testing

```yaml
# .github/workflows/test.yml
name: Test MCP Server

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npx @modelcontextprotocol/inspector build/index.js --test
```

## References

- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)
- [MCP Server Examples](https://github.com/modelcontextprotocol)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
