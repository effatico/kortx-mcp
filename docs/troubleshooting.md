# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with MCP Consultant.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Problems](#configuration-problems)
- [Connection Issues](#connection-issues)
- [API and Authentication](#api-and-authentication)
- [Performance Problems](#performance-problems)
- [Tool Execution Issues](#tool-execution-issues)
- [Context Gathering Problems](#context-gathering-problems)
- [Logging and Debugging](#logging-and-debugging)

## Installation Issues

### "command not found: kortx-mcp"

**Symptoms**: Running `kortx-mcp` shows "command not found"

**Solutions**:

1. Install globally:

   ```bash
   npm install -g kortx-mcp
   ```

2. Use npx instead (no installation needed):

   ```bash
   npx -y kortx-mcp
   ```

3. Check your PATH includes npm global bin:
   ```bash
   npm config get prefix
   # Add to PATH: export PATH="$(npm config get prefix)/bin:$PATH"
   ```

### "npx: command not found"

**Symptoms**: npx command not recognized

**Solutions**:

1. Update npm:

   ```bash
   npm install -g npm@latest
   ```

2. Reinstall Node.js from [nodejs.org](https://nodejs.org)

### "Node.js version too old"

**Symptoms**: Error about Node.js version requirement

**Solutions**:

1. Check current version:

   ```bash
   node --version
   ```

2. Upgrade to Node.js >= 22.12.0:
   - Visit [nodejs.org](https://nodejs.org)
   - Or use nvm:
     ```bash
     nvm install 22
     nvm use 22
     ```

### "permission denied" errors

**Symptoms**: EACCES or permission errors during install

**Solutions**:

1. Fix npm permissions:

   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   export PATH=~/.npm-global/bin:$PATH
   ```

2. Use npx instead (recommended):
   ```bash
   npx -y kortx-mcp
   ```

## Configuration Problems

### "Cannot find .env file"

**Symptoms**: Server starts but can't find configuration

**Solutions**:

1. Environment variables don't require a .env file. Set directly:

   ```bash
   export OPENAI_API_KEY="sk-your-key"
   ```

2. If using .env file, ensure it's in the right location:
   - Current working directory, OR
   - Project root directory

3. Check file permissions:
   ```bash
   chmod 600 .env
   ```

### Configuration not taking effect

**Symptoms**: Changes to environment variables don't work

**Solutions**:

1. Restart your AI assistant after configuration changes

2. Verify environment variables are set:

   ```bash
   echo $OPENAI_API_KEY
   ```

3. Check MCP config file syntax (must be valid JSON)

4. For Claude Code, verify config file location:
   - macOS/Linux: `~/.config/claude/mcp.json`
   - Windows: `%APPDATA%\Claude\mcp.json`

### "Invalid configuration" errors

**Symptoms**: Server won't start due to config validation

**Solutions**:

1. Check for typos in environment variable names

2. Verify enum values:
   - OPENAI_MODEL: gpt-5, gpt-5-mini, or gpt-5-nano
   - OPENAI_REASONING_EFFORT: minimal, low, medium, or high
   - OPENAI_VERBOSITY: low, medium, or high
   - LOG_LEVEL: debug, info, warn, or error

3. Ensure numeric values are numbers:
   ```bash
   OPENAI_MAX_TOKENS=1024  # Not "1024"
   MAX_CONTEXT_TOKENS=32000
   ```

## Connection Issues

### Server not starting in AI assistant

**Symptoms**: MCP server doesn't appear or connect

**Solutions**:

1. Check server logs:

   ```bash
   # Claude Code logs
   tail -f ~/.config/claude/logs/mcp-*.log

   # Copliot logs
   tail -f ~/.config/copliot/logs/mcp-*.log
   ```

2. Test server manually:

   ```bash
   OPENAI_API_KEY=sk-your-key npx -y kortx-mcp
   ```

3. Verify JSON syntax in MCP config:

   ```bash
   # macOS/Linux
   cat ~/.config/claude/mcp.json | jq .

   # Should output formatted JSON, not errors
   ```

4. Restart the AI assistant completely

5. Check for port conflicts (though MCP Consultant uses stdio, not HTTP)

### "Transport error" messages

**Symptoms**: Connection drops or transport errors

**Solutions**:

1. MCP Consultant uses stdio transport by default. Verify:

   ```bash
   echo $TRANSPORT  # Should be empty or "stdio"
   ```

2. Don't set TRANSPORT=http (not fully supported yet)

3. Check for stdout pollution:
   - Ensure no `console.log` in user code
   - Use `LOG_LEVEL=warn` to reduce noise

### Tools not appearing in AI assistant

**Symptoms**: Server connects but tools don't show up

**Solutions**:

1. Verify server registration:
   - Ask your AI assistant: "List available MCP tools"
   - You should see: think-about-plan, suggest-alternative, improve-copy, solve-problem

2. Check for initialization errors in logs

3. Restart AI assistant

4. Verify npx is using latest version:
   ```bash
   npx -y kortx-mcp --version
   ```

## API and Authentication

### "Invalid API key" errors

**Symptoms**: Authentication errors with OpenAI

**Solutions**:

1. Verify API key format:
   - Must start with `sk-`
   - No extra spaces, quotes, or newlines

   ```bash
   echo "[$OPENAI_API_KEY]"  # Check for hidden characters
   ```

2. Test API key directly:

   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

3. Check key status at [platform.openai.com](https://platform.openai.com/api-keys)

4. Ensure key has correct permissions

5. Try regenerating the API key

### "Rate limit exceeded" errors

**Symptoms**: 429 Too Many Requests from OpenAI

**Solutions**:

1. Check your OpenAI usage at [platform.openai.com/usage](https://platform.openai.com/usage)

2. Reduce request frequency

3. Use lower token limits:

   ```bash
   OPENAI_MAX_TOKENS=512
   MAX_CONTEXT_TOKENS=16000
   ```

4. Upgrade your OpenAI plan

5. The server has automatic retry with exponential backoff

### "Insufficient quota" errors

**Symptoms**: Out of credits or quota exhausted

**Solutions**:

1. Add credits at [platform.openai.com/billing](https://platform.openai.com/billing)

2. Check your usage limits and tier

3. Use cheaper model:
   ```bash
   OPENAI_MODEL=gpt-5-nano
   ```

### "Model not found" errors

**Symptoms**: Specified model not available

**Solutions**:

1. Verify model name:
   - Valid: `gpt-5`, `gpt-5-mini`, `gpt-5-nano`
   - Invalid: `gpt-4`, `gpt-5-turbo`

2. Check model availability for your account tier

3. Use default (gpt-5-mini) by not setting OPENAI_MODEL

## Performance Problems

### Slow response times

**Symptoms**: Tools take too long to respond

**Solutions**:

1. Use faster configuration:

   ```bash
   OPENAI_MODEL=gpt-5-mini
   OPENAI_REASONING_EFFORT=minimal
   OPENAI_VERBOSITY=low
   OPENAI_MAX_TOKENS=1024
   ```

2. Reduce context gathering:

   ```bash
   MAX_CONTEXT_TOKENS=16000
   ENABLE_SERENA=false
   ENABLE_MEMORY=false
   ENABLE_CCLSP=false
   ```

3. Check network latency to OpenAI

4. Monitor server logs for bottlenecks:
   ```bash
   LOG_LEVEL=debug
   ```

### High token usage / costs

**Symptoms**: Using more tokens than expected

**Solutions**:

1. Lower max tokens:

   ```bash
   OPENAI_MAX_TOKENS=512
   ```

2. Reduce reasoning effort:

   ```bash
   OPENAI_REASONING_EFFORT=minimal
   ```

3. Use cheaper model:

   ```bash
   OPENAI_MODEL=gpt-5-nano
   ```

4. Limit context:

   ```bash
   MAX_CONTEXT_TOKENS=8000
   ```

5. Monitor usage in logs (shows token counts)

### Memory usage growing

**Symptoms**: Server using lots of RAM over time

**Solutions**:

1. This is normal for Node.js but shouldn't grow unbounded

2. Restart the server periodically (AI assistant does this automatically)

3. Reduce context limits:

   ```bash
   MAX_CONTEXT_TOKENS=16000
   ```

4. Check for memory leaks by monitoring:
   ```bash
   # Watch memory usage
   ps aux | grep kortx-mcp
   ```

## Tool Execution Issues

### "Tool execution failed" errors

**Symptoms**: Generic tool execution errors

**Solutions**:

1. Check logs for specific error:

   ```bash
   LOG_LEVEL=debug
   ```

2. Verify OpenAI API is accessible:

   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

3. Check for timeout issues (server retries 3 times)

4. Ensure adequate token limits:
   ```bash
   OPENAI_MAX_TOKENS=2048
   ```

### "Invalid tool input" errors

**Symptoms**: Tool rejects the input

**Solutions**:

1. Tools validate input with Zod schemas

2. Check required fields:
   - think-about-plan: `plan`
   - suggest-alternative: `current_approach`
   - improve-copy: `text`
   - solve-problem: `problem`

3. Ensure all fields are strings

### Tools returning empty responses

**Symptoms**: Tool succeeds but returns no content

**Solutions**:

1. Check token limits aren't too low:

   ```bash
   OPENAI_MAX_TOKENS=1024  # Minimum recommended
   ```

2. Verify context is being gathered:

   ```bash
   LOG_LEVEL=debug  # Shows context gathering
   ```

3. Check OpenAI API status

4. Try with increased verbosity:
   ```bash
   OPENAI_VERBOSITY=medium
   ```

## Context Gathering Problems

### Serena context not working

**Symptoms**: Serena MCP integration not providing context

**Solutions**:

1. Verify Serena is installed and running

2. Enable Serena explicitly:

   ```bash
   ENABLE_SERENA=true
   ```

3. Check Serena is registered in your AI assistant's MCP config

4. Check logs for Serena-related errors

### Graph memory not accessible

**Symptoms**: graph-memory MCP not providing data

**Solutions**:

1. Verify graph-memory MCP is installed

2. Enable memory:

   ```bash
   ENABLE_MEMORY=true
   ```

3. Ensure graph-memory is in AI assistant's MCP config

4. Check memory location is accessible

### CCLSP not providing context

**Symptoms**: CCLSP integration not working

**Solutions**:

1. Verify cclsp MCP is installed and configured

2. Enable explicitly:

   ```bash
   ENABLE_CCLSP=true
   ```

3. Check CCLSP server is running for your project

### "Context too large" errors

**Symptoms**: Gathered context exceeds limits

**Solutions**:

1. Reduce context limit:

   ```bash
   MAX_CONTEXT_TOKENS=16000
   ```

2. Disable some context sources:

   ```bash
   ENABLE_SERENA=false
   ```

3. Be more specific in queries (smaller context window)

## Logging and Debugging

### Enabling debug logs

To get detailed debugging information:

```bash
LOG_LEVEL=debug
```

Or in your MCP config:

```json
{
  "mcpServers": {
    "consultant": {
      "env": {
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Finding log files

**Claude Code**:

```bash
~/.config/claude/logs/mcp-*.log
```

**Copliot**:

```bash
~/.config/copliot/logs/mcp-*.log
```

**Manual testing**:

```bash
# Logs to stderr
OPENAI_API_KEY=sk-key npx -y kortx-mcp 2> debug.log
```

### Understanding log output

Key log events to look for:

- `event: "server:started"` - Server initialized successfully
- `event: "llm:request"` - Making request to OpenAI
- `event: "llm:response"` - Received response from OpenAI
- `event: "context:gathered"` - Context collection completed
- `event: "tool:executed"` - Tool finished execution
- `level: "error"` - Something went wrong

### Testing manually

Run the server manually to see all output:

```bash
# Set environment
export OPENAI_API_KEY="sk-your-key"
export LOG_LEVEL="debug"

# Run server
npx -y kortx-mcp
```

The server will wait for stdio input (MCP protocol messages).

### Using MCP Inspector

For interactive debugging:

```bash
npm install -g @modelcontextprotocol/inspector

# Run inspector
npx @modelcontextprotocol/inspector \
  npx -y kortx-mcp
```

This provides a web UI to test tools interactively.

## Docker-Specific Issues

### Container not starting

**Symptoms**: Docker run fails or exits immediately

**Solutions**:

1. Check you passed the API key:

   ```bash
   docker run -e OPENAI_API_KEY=sk-your-key \
     ghcr.io/effatico/kortx-mcp:latest
   ```

2. View container logs:

   ```bash
   docker logs <container-id>
   ```

3. Try interactive mode:
   ```bash
   docker run -it -e OPENAI_API_KEY=sk-key \
     ghcr.io/effatico/kortx-mcp:latest
   ```

### "Image not found" errors

**Symptoms**: Can't pull Docker image

**Solutions**:

1. Pull explicitly:

   ```bash
   docker pull ghcr.io/effatico/kortx-mcp:latest
   ```

2. Check image name spelling

3. Ensure you have internet connectivity

## Still Having Issues?

If none of these solutions help:

### 1. Check GitHub Issues

Search existing issues: [github.com/effatico/kortx-mcp/issues](https://github.com/effatico/kortx-mcp/issues)

### 2. Gather Diagnostic Information

When reporting issues, include:

- Node.js version: `node --version`
- npm version: `npm --version`
- Package version: `npx -y kortx-mcp --version`
- Operating system
- AI assistant (Claude Code, Copliot, etc.)
- Full error messages
- Relevant log output (with LOG_LEVEL=debug)
- Configuration (redact API keys!)

### 3. Report the Issue

Create a new issue: [github.com/effatico/kortx-mcp/issues/new](https://github.com/effatico/kortx-mcp/issues/new)

Or reach out:

- 💬 [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)
- 📧 [Email Support](mailto:amin@effati.se)

### 4. Community Help

Join the discussion:

- MCP Community Discord
- GitHub Discussions
- Stack Overflow (tag: kortx-mcp)

## Related Documentation

- [Getting Started Guide](./getting-started.md)
- [Configuration Reference](./configuration.md)
- [API Documentation](./api/)
- [Development Guide](./development/)
