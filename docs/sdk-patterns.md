# MCP TypeScript SDK Patterns

## Overview

Best practices and patterns for implementing MCP servers using the official TypeScript SDK (v1.10.0+).

## Server Initialization

### High-Level API (Recommended)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const server = new McpServer({
  name: 'your-server-name',
  version: '1.0.0',
});
```

### Low-Level API (Advanced Control)

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server(
  {
    name: 'your-server-name',
    version: '1.0.0',
  },
  {
    capabilities: {
      prompts: {},
      resources: {},
      tools: {},
    },
  }
);
```

## Transport Patterns

### Stdio Transport (Local Integration)

**Use Cases:**

- Claude Code integration
- CLI tools
- Spawned processes

**Implementation:**

```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Characteristics:**

- Simplest setup
- Parent-child process communication
- stdin/stdout message passing
- No HTTP overhead

### Streamable HTTP Transport (Remote Integration)

#### Stateless Mode (Recommended for Serverless)

**Use Cases:**

- Serverless deployments (AWS Lambda, Vercel, etc.)
- Infinite horizontal scaling
- No session management overhead

**Implementation:**

```typescript
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  // Create fresh transport per request
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
    enableJsonResponse: true,
  });

  // Cleanup on connection close
  res.on('close', () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000);
```

**Key Points:**

- `sessionIdGenerator: undefined` enables stateless mode
- Fresh transport per request prevents ID collisions
- Always close transport to prevent memory leaks

#### Stateful Mode (Session Management)

**Use Cases:**

- Long-running sessions
- State persistence required
- WebSocket-like behavior

**Implementation:**

```typescript
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing session
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New session initialization
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: id => {
        transports[id] = transport;
      },
      onsessionclosed: id => {
        delete transports[id];
      },
    });

    const server = new McpServer({ name: 'server', version: '1.0.0' });
    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Invalid session' },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});
```

## Tool Registration Patterns

### Basic Tool

```typescript
import { z } from 'zod';

server.registerTool(
  'tool-name',
  {
    title: 'Tool Display Name',
    description: 'Clear description of what this tool does',
    inputSchema: {
      param1: z.string().describe('Parameter description'),
      param2: z.number().optional().describe('Optional parameter'),
    },
    outputSchema: {
      result: z.string(),
    },
  },
  async ({ param1, param2 }) => {
    // Implementation
    const result = `Processed ${param1}`;

    return {
      content: [{ type: 'text', text: result }],
      structuredContent: { result },
    };
  }
);
```

### Tool with Error Handling

```typescript
server.registerTool(
  'safe-tool',
  {
    title: 'Safe Tool',
    description: 'Tool with comprehensive error handling',
    inputSchema: { input: z.string() },
    outputSchema: { result: z.string() },
  },
  async ({ input }) => {
    try {
      // Validate input
      if (!input || input.trim() === '') {
        throw new Error('Input cannot be empty');
      }

      // Process
      const result = processInput(input);

      return {
        content: [{ type: 'text', text: result }],
        structuredContent: { result },
      };
    } catch (error) {
      // Log detailed error internally
      logger.error({ error, input }, 'Tool execution failed');

      // Return sanitized error to client
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);
```

### Tool with LLM Sampling

```typescript
server.registerTool(
  'llm-assisted-tool',
  {
    title: 'LLM Assisted Tool',
    description: 'Uses LLM sampling for complex tasks',
    inputSchema: { text: z.string() },
    outputSchema: { summary: z.string() },
  },
  async ({ text }) => {
    // Call LLM through MCP sampling
    const response = await server.server.createMessage({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Summarize: ${text}`,
          },
        },
      ],
      maxTokens: 500,
    });

    const summary =
      response.content.type === 'text' ? response.content.text : 'Unable to generate summary';

    return {
      content: [{ type: 'text', text: summary }],
      structuredContent: { summary },
    };
  }
);
```

## Resource Registration Patterns

### Static Resource

```typescript
server.registerResource(
  'static-resource',
  new ResourceTemplate('resource://static', { list: undefined }),
  {
    title: 'Static Resource',
    description: 'A fixed resource',
  },
  async uri => ({
    contents: [
      {
        uri: uri.href,
        text: 'Static content',
      },
    ],
  })
);
```

### Dynamic Resource with Parameters

```typescript
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

server.registerResource(
  'dynamic-resource',
  new ResourceTemplate('resource://{category}/{id}', { list: undefined }),
  {
    title: 'Dynamic Resource',
    description: 'Parameterized resource access',
  },
  async (uri, { category, id }) => {
    const content = await fetchResource(category, id);

    return {
      contents: [
        {
          uri: uri.href,
          text: content,
          mimeType: 'text/plain',
        },
      ],
    };
  }
);
```

## Security Patterns

### DNS Rebinding Protection

```typescript
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
  enableDnsRebindingProtection: true,
  allowedHosts: ['127.0.0.1', 'localhost', 'yourdomain.com'],
  allowedOrigins: ['https://yourdomain.com', 'https://www.yourdomain.com'],
});
```

### Input Validation

```typescript
import { z } from 'zod';

const StrictInputSchema = z
  .object({
    text: z.string().min(1, 'Text cannot be empty').max(10000, 'Text too long'),
    options: z
      .object({
        language: z.enum(['en', 'es', 'fr']).default('en'),
        format: z.enum(['json', 'text']).default('text'),
      })
      .optional(),
  })
  .strict(); // Reject unknown properties
```

### Token/Secret Sanitization

```typescript
function sanitizeForLogs(data: any): any {
  const sensitiveKeys = ['apiKey', 'token', 'password', 'secret', 'authorization'];

  if (typeof data !== 'object' || data === null) return data;

  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogs(sanitized[key]);
    }
  }
  return sanitized;
}
```

## Error Handling Patterns

### Structured Error Responses

```typescript
class McpError extends Error {
  constructor(
    message: string,
    public code: number,
    public data?: any
  ) {
    super(message);
    this.name = 'McpError';
  }
}

// Usage
throw new McpError('Resource not found', -32001, { resourceId: 'xyz' });
```

### Graceful Degradation

```typescript
async function gatherContextSafely(sources: ContextSource[]): Promise<Context> {
  const results = await Promise.allSettled(sources.map(source => source.gather()));

  const context = {
    gathered: [],
    failed: [],
  };

  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      context.gathered.push(result.value);
    } else {
      logger.warn({ source: sources[index].name, error: result.reason }, 'Context source failed');
      context.failed.push(sources[index].name);
    }
  }

  return context;
}
```

## Testing Patterns

### MCP Inspector

```bash
# Debug server interactively
npx @modelcontextprotocol/inspector build/index.js
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('MCP Server', () => {
  it('should register tools correctly', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    server.registerTool(
      'test-tool',
      {
        title: 'Test',
        description: 'Test tool',
        inputSchema: { a: z.number() },
        outputSchema: { result: z.number() },
      },
      async ({ a }) => ({
        content: [{ type: 'text', text: String(a * 2) }],
        structuredContent: { result: a * 2 },
      })
    );

    // Test tool execution
    // ... implementation
  });
});
```

## Performance Patterns

### Request ID Collision Prevention

Always create fresh transport per request in stateless mode:

```typescript
// ✅ CORRECT
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  // ...
});

// ❌ WRONG - Reusing transport causes ID collisions
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

app.post('/mcp', async (req, res) => {
  // Reusing same transport!
});
```

### Memory Leak Prevention

```typescript
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  // ✅ Always cleanup
  res.on('close', () => {
    transport.close();
  });

  // ✅ Cleanup on error
  res.on('error', () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

## References

- [TypeScript SDK Repository](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://modelcontextprotocol.io)
- [Streamable HTTP Guide](https://blog.fka.dev/blog/2025-06-06-why-mcp-deprecated-sse-and-go-with-streamable-http/)
