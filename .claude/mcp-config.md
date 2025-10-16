# MCP Configuration for Testing

This guide explains how to test the LLM Consultants MCP server with Claude Code during development.

## Quick Setup

### Using Local Build (Recommended for Development)

When actively developing, use the local build to test your changes immediately:

```bash
# 1. Build the project
npm run build

# 2. Add to Claude Code with absolute path
claude mcp add --transport stdio llm-consultant-dev \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env LOG_LEVEL=debug \
  -- node /absolute/path/to/llm-consultants/build/index.js

# Example with actual path:
claude mcp add --transport stdio llm-consultant-dev \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env LOG_LEVEL=debug \
  -- node $(pwd)/build/index.js
```

### Using NPX from Local Directory

Alternatively, test using npx pointing to the local directory:

```bash
# 1. Build the project
npm run build

# 2. Add to Claude Code using npx
claude mcp add --transport stdio llm-consultant-dev \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env LOG_LEVEL=debug \
  -- npx --yes $(pwd)
```

## Development Workflow

### 1. Make Changes

Edit source files in `src/`:

```bash
# Example: modify a tool
vim src/tools/think-about-plan.ts
```

### 2. Rebuild

Always rebuild after making changes:

```bash
npm run build
```

The build process:

- Compiles TypeScript to JavaScript
- Adds executable permissions to `build/index.js`
- Generates type definitions

### 3. Test with Claude Code

Since Claude Code loads MCP servers on startup, you need to restart it to pick up changes:

```bash
# Remove the old configuration
claude mcp remove llm-consultant-dev

# Re-add with the updated build
claude mcp add --transport stdio llm-consultant-dev \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env LOG_LEVEL=debug \
  -- node $(pwd)/build/index.js

# Or use the test script (see below)
./scripts/test-with-claude-code.sh
```

### 4. Verify Tools Are Available

Check that your tools are registered:

```bash
claude mcp inspect llm-consultant-dev
```

You should see:

- `think-about-plan`
- `suggest-alternative`
- `improve-copy`
- `solve-problem`

## Configuration Options

### Basic Development Configuration

Minimal setup for testing:

```bash
claude mcp add --transport stdio llm-consultant-dev \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  -- node $(pwd)/build/index.js
```

### Full Development Configuration

With all options for comprehensive testing:

```bash
claude mcp add --transport stdio llm-consultant-dev \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5-mini \
  --env OPENAI_REASONING_EFFORT=minimal \
  --env OPENAI_VERBOSITY=high \
  --env OPENAI_MAX_TOKENS=2048 \
  --env LOG_LEVEL=debug \
  --env TRANSPORT=stdio \
  --env ENABLE_SERENA=true \
  --env ENABLE_MEMORY=true \
  --env ENABLE_CCLSP=true \
  --env MAX_CONTEXT_TOKENS=32000 \
  --env INCLUDE_FILE_CONTENT=true \
  --env INCLUDE_GIT_HISTORY=false \
  -- node $(pwd)/build/index.js
```

### Testing Different Models

Set up multiple configurations to test different models:

```bash
# Fast model for quick iterations
claude mcp add --transport stdio llm-consultant-nano \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5-nano \
  --env LOG_LEVEL=debug \
  -- node $(pwd)/build/index.js

# Standard model
claude mcp add --transport stdio llm-consultant-mini \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5-mini \
  --env LOG_LEVEL=debug \
  -- node $(pwd)/build/index.js

# Advanced model
claude mcp add --transport stdio llm-consultant-pro \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5 \
  --env OPENAI_REASONING_EFFORT=high \
  --env LOG_LEVEL=debug \
  -- node $(pwd)/build/index.js

# Code-optimized model
claude mcp add --transport stdio llm-consultant-codex \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env OPENAI_MODEL=gpt-5-codex \
  --env LOG_LEVEL=debug \
  -- node $(pwd)/build/index.js
```

## Testing Tools

### Test think-about-plan

Ask Claude Code:

```
Use the consultant to think about this plan:
I want to refactor our authentication system to use OAuth 2.0
with JWT tokens and refresh token rotation.
```

### Test suggest-alternative

Ask Claude Code:

```
Use the consultant to suggest alternatives to using Redis
for session storage in a distributed system.
```

### Test improve-copy

Ask Claude Code:

```
Use the consultant to improve this error message:
"Error 500: Internal server error. Try again later."
```

### Test solve-problem

Ask Claude Code:

```
Use the consultant to help solve this problem:
Users are experiencing intermittent 500 errors when uploading large files.
I've checked server memory and disk space, but the issue persists.
```

## Viewing Logs

### Log Locations

Logs are written to:

- Default: `./llm-consultants.log` in the project directory
- Custom: Set `LOG_FILE` environment variable

### Tailing Logs

Monitor logs in real-time:

```bash
tail -f llm-consultants.log
```

### Filtering Logs

```bash
# Show only errors
grep '"level":50' llm-consultants.log

# Show only warnings and errors
grep -E '"level":(40|50)' llm-consultants.log

# Show specific tool calls
grep 'think-about-plan' llm-consultants.log
```

### Using jq for Pretty Logs

If you have `jq` installed:

```bash
tail -f llm-consultants.log | jq '.'
```

## Debugging

### Enable Debug Logging

Set `LOG_LEVEL=debug` to see detailed information:

```bash
claude mcp add --transport stdio llm-consultant-dev \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env LOG_LEVEL=debug \
  -- node $(pwd)/build/index.js
```

### Using Node.js Debugger

For deeper debugging with breakpoints:

```bash
# Add to Claude Code with inspector
claude mcp add --transport stdio llm-consultant-dev \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  -- node --inspect $(pwd)/build/index.js

# Then attach with Chrome DevTools or VS Code debugger
```

### Testing with MCP Inspector

For interactive testing without Claude Code:

```bash
npm run inspector
```

This opens the MCP Inspector UI where you can:

- Call tools directly
- Inspect requests/responses
- Test without full Claude Code setup

## Cleanup

### Remove Test Configuration

After testing, remove the development MCP server:

```bash
claude mcp remove llm-consultant-dev
```

### Remove All Test Configurations

If you created multiple test configurations:

```bash
claude mcp remove llm-consultant-dev
claude mcp remove llm-consultant-nano
claude mcp remove llm-consultant-mini
claude mcp remove llm-consultant-pro
claude mcp remove llm-consultant-codex
```

### List All MCP Servers

See what's configured:

```bash
claude mcp list
```

## Automated Testing Script

Use the provided script for convenience:

```bash
# Run the test script
./scripts/test-with-claude-code.sh

# The script will:
# 1. Build the project
# 2. Add to Claude Code
# 3. Display usage instructions
# 4. Show how to remove after testing
```

See `scripts/test-with-claude-code.sh` for details.

## Troubleshooting

### Server Not Starting

**Problem**: MCP server doesn't start in Claude Code

**Check**:

1. Build succeeded: `npm run build`
2. Environment variables are set correctly
3. OpenAI API key is valid
4. Node.js version >= 22.12.0: `node --version`

### Tools Not Showing Up

**Problem**: Tools don't appear in Claude Code

**Check**:

1. MCP server is added: `claude mcp list`
2. Server started successfully (check logs)
3. Restart Claude Code after configuration changes

### API Errors

**Problem**: OpenAI API errors in logs

**Check**:

1. API key is correct: `echo $OPENAI_API_KEY`
2. API key has quota available
3. Model name is correct (gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-codex)

### Context Gathering Errors

**Problem**: Errors related to Serena/Memory/CCLSP

**Solutions**:

1. Disable context gathering: `ENABLE_SERENA=false ENABLE_MEMORY=false ENABLE_CCLSP=false`
2. Verify those MCP servers are installed
3. Check their logs for issues

## Best Practices

1. **Always rebuild** after code changes
2. **Use debug logging** during development
3. **Test incrementally** - one feature at a time
4. **Monitor logs** while testing
5. **Clean up** test configurations when done
6. **Use the test script** for consistency
7. **Test with different models** to verify compatibility
8. **Verify context gathering** if using Serena/Memory/CCLSP

## Next Steps

After successful local testing:

1. Run unit tests: `npm test`
2. Check code quality: `npm run lint && npm run format:check`
3. Update documentation if needed
4. Commit changes with descriptive message
5. Test the NPX installation: `npx .`
6. Test Docker build: `npm run docker:build`
