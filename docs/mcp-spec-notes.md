# MCP Specification Notes

## Overview

The Model Context Protocol (MCP) is an open standard for enabling AI assistants to securely interact with data sources and tools. This document summarizes key findings from the latest MCP specification (March 2025 update with June 2025 clarifications).

## Latest Updates

- **Current Version**: March 26, 2025
- **Latest Clarifications**: June 18, 2025
- **Next Version**: Release Candidate November 11, 2025 | Final November 25, 2025

## OAuth 2.1 Authorization (March 2025)

### Key Requirements

1. **MCP Server Classification**
   - MCP servers are officially classified as **OAuth Resource Servers**
   - Enables standardized delegation of authorization using OAuth 2.1

2. **OAuth 2.1 Implementation**
   - MUST implement OAuth 2.1 with appropriate security measures
   - MUST support PKCE (Proof Key for Code Exchange) for public clients
   - SHOULD support OAuth 2.0 Dynamic Client Registration Protocol (RFC7591)
   - MUST implement OAuth 2.0 Authorization Server Metadata (RFC8414)

3. **Resource Indicators (RFC 8707)** - June 2025 Clarification
   - MCP clients MUST implement Resource Indicators
   - Clients explicitly state the intended recipient (audience) of access tokens
   - Authorization Server issues tokens tightly scoped to specific MCP servers
   - Prevents malicious servers from obtaining access tokens for other services

### Security Best Practices

- **Token Storage**: Clients MUST securely store tokens following OAuth 2.0 best practices
- **Token Expiration**: Servers SHOULD enforce token expiration and rotation
- **HTTPS Only**: All authorization endpoints MUST be served over HTTPS
- **DNS Rebinding Protection**: Available for local server deployments

### Authorization Flow

1. Client receives HTTP 401 Unauthorized from MCP server
2. Client initiates OAuth 2.1 authorization flow with PKCE
3. User authorizes application at Authorization Server
4. Client receives access token with Resource Indicator specifying MCP server
5. Client includes token in subsequent MCP server requests

## Transport Protocols

### Streamable HTTP (Recommended - March 2025)

Replaced Server-Sent Events (SSE) as the preferred transport mechanism.

**Benefits:**

- On-demand resource allocation
- Eliminates unnecessary persistent connections
- Better scaling in serverless environments
- More efficient for stateless operations
- Improved reliability and compatibility

**Implementation Notes:**

- SDK Version 1.10.0+ (April 17, 2025) supports Streamable HTTP
- Create fresh transport per request to prevent request ID collisions
- Use `sessionIdGenerator: undefined` for stateless mode
- Use `enableJsonResponse: true` for better compatibility

### Stdio Transport

Standard input/output communication for local integrations.

**Use Cases:**

- Claude Code integration
- Local MCP server execution
- Spawned process communication
- CLI-based tools

**Implementation:**

- Suitable for parent-child process communication
- Uses stdin/stdout for message passing
- Simpler setup for local development

## Server Capabilities

MCP servers can expose three types of capabilities:

1. **Resources**: Data sources and content (files, databases, APIs)
2. **Tools**: Executable functions with defined schemas
3. **Prompts**: Reusable prompt templates

## TypeScript SDK Patterns

### Tool Registration

```typescript
server.registerTool(
  'tool-name',
  {
    title: 'Human Readable Title',
    description: 'Clear description of what the tool does',
    inputSchema: zodSchema,
    outputSchema: zodSchema,
  },
  async input => {
    // Implementation
    return {
      content: [{ type: 'text', text: result }],
      structuredContent: data,
    };
  }
);
```

### Resource Registration

```typescript
server.registerResource(
  'resource-name',
  new ResourceTemplate('scheme://{param}', { list: undefined }),
  {
    title: 'Resource Title',
    description: 'Resource description',
  },
  async (uri, params) => ({
    contents: [{ uri: uri.href, text: content }],
  })
);
```

## Error Handling Best Practices

1. **Fail-Fast Policy**: Report predictable errors immediately with specific codes
2. **No-Leaks Policy**: Sanitize unexpected errors to prevent internal detail exposure
3. **Protocol-Compliant Codes**: Use JSON-RPC 2.0 error codes
4. **Detailed Logging**: Log comprehensive error details internally with Pino
5. **User-Friendly Messages**: Return sanitized, helpful error messages to clients

## Cleanup and Resource Management

Always implement proper cleanup:

```typescript
res.on('close', () => {
  transport.close();
  server.close();
});
```

## DNS Rebinding Protection (Production)

Enable for production deployments:

```typescript
const transport = new StreamableHTTPServerTransport({
  enableDnsRebindingProtection: true,
  allowedHosts: ['127.0.0.1', 'your-domain.com'],
  allowedOrigins: ['https://yourdomain.com'],
});
```

## Testing

- Use MCP Inspector for debugging: `npx @modelcontextprotocol/inspector build/index.js`
- Test both stdio and HTTP transports
- Validate OAuth flows in staging environment
- Test error scenarios and edge cases

## References

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization)
- [OAuth 2.1 Spec Updates - Auth0 Blog](https://auth0.com/blog/mcp-specs-update-all-about-auth/)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Resource Indicators RFC 8707](https://datatracker.ietf.org/doc/html/rfc8707)
