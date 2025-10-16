# Production Deployment Guide

This guide covers security best practices and production configuration for deploying LLM Consultants MCP Server.

## Security Configuration

### Environment Variables

Configure these security settings for production deployment:

```bash
# Required
OPENAI_API_KEY=your-production-key

# Production Environment
NODE_ENV=production
LOG_LEVEL=warn  # or 'info' for more verbose logging

# Security Settings
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_HOUR=100
MAX_TOKENS_PER_REQUEST=50000
MAX_TOKENS_PER_HOUR=500000
REQUEST_TIMEOUT_MS=60000
MAX_INPUT_SIZE=100000  # 100KB

# Model Configuration (cost optimization)
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=low
OPENAI_VERBOSITY=low
OPENAI_MAX_TOKENS=1024
```

### Rate Limiting

Rate limiting protects against abuse and helps control costs:

- **Requests per hour**: Limits total number of tool calls per client
- **Tokens per request**: Prevents single requests from consuming excessive tokens
- **Tokens per hour**: Controls total token usage per client within the time window
- **Input size limits**: Prevents large payloads that could cause memory issues

To disable rate limiting (not recommended for production):

```bash
ENABLE_RATE_LIMITING=false
```

### Context Gathering

For production environments with sensitive codebases, consider limiting context gathering:

```bash
# Disable specific context sources
ENABLE_SERENA=false
ENABLE_MEMORY=false
ENABLE_CCLSP=false

# Limit context size
MAX_CONTEXT_TOKENS=8000

# Disable file content inclusion
INCLUDE_FILE_CONTENT=false
INCLUDE_GIT_HISTORY=false
```

## Docker Deployment

### Build Production Image

```bash
# Build with security audit
docker build -t llm-consultants:latest .

# The build will fail if high-severity vulnerabilities are found
```

### Run with Docker

```bash
# Run with environment file
docker run -d \
  --name llm-consultants \
  --env-file .env.production \
  --read-only \
  --security-opt=no-new-privileges:true \
  llm-consultants:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  llm-consultants:
    build: .
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
      - LOG_LEVEL=warn
      - ENABLE_RATE_LIMITING=true
      - MAX_REQUESTS_PER_HOUR=100
    read_only: true
    security_opt:
      - no-new-privileges:true
    restart: unless-stopped
```

### Docker Secrets

For enhanced security with Docker Swarm:

```bash
# Create secret
echo "your-api-key" | docker secret create openai_api_key -

# Deploy with secrets
docker service create \
  --name llm-consultants \
  --secret openai_api_key \
  --env OPENAI_API_KEY_FILE=/run/secrets/openai_api_key \
  llm-consultants:latest
```

## Performance Optimization

### Recommended Production Settings

```bash
# Use smaller model for cost-efficiency
OPENAI_MODEL=gpt-5-mini

# Reduce reasoning effort
OPENAI_REASONING_EFFORT=low

# Limit output verbosity
OPENAI_VERBOSITY=low

# Cap token usage
OPENAI_MAX_TOKENS=1024

# Reduce context gathering
MAX_CONTEXT_TOKENS=8000
```

### Expected Performance Metrics

- **Response time**: < 5s for 95th percentile
- **Memory usage**: < 512MB under normal load
- **Context gathering timeout**: 10s
- **LLM call timeout**: 60s

## Monitoring

### Log Files

Logs are written to `llm-consultants.log` in the working directory.

```bash
# Set restrictive permissions
chmod 600 llm-consultants.log

# Configure log rotation (example with logrotate)
cat > /etc/logrotate.d/llm-consultants << EOF
/path/to/llm-consultants.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0600 node node
}
EOF
```

### Health Monitoring

Monitor these log events for production health:

```json
{
  "event": "llm_response",
  "model": "gpt-5-mini",
  "tokens": { "total": 1500 },
  "durationMs": 2500
}
```

Key metrics to track:

- **Token usage**: Monitor `tokens.total` to track costs
- **Response times**: Track `durationMs` for performance
- **Error rates**: Count `event: "error"` occurrences
- **Rate limit hits**: Watch for rate limit errors

## Security Checklist

Before deploying to production:

- [ ] API keys stored securely (environment variables or secrets manager)
- [ ] Environment variables configured for production
- [ ] Log level set to `warn` or `info` (not `debug`)
- [ ] Rate limiting enabled
- [ ] Input size limits configured
- [ ] Context gathering reviewed and configured appropriately
- [ ] Docker container runs as non-root user
- [ ] Dependencies audited (`npm audit` passing)
- [ ] Security workflow enabled in GitHub
- [ ] Log files have restrictive permissions (600)
- [ ] Secrets rotation schedule established

## Incident Response

### Rate Limit Exceeded

If clients hit rate limits:

1. Review `MAX_REQUESTS_PER_HOUR` and `MAX_TOKENS_PER_HOUR` settings
2. Check for unusual usage patterns in logs
3. Consider increasing limits or implementing per-user quotas

### High Token Usage

If token usage exceeds expectations:

1. Reduce `MAX_CONTEXT_TOKENS` to limit context gathering
2. Switch to smaller model (`gpt-5-nano` or `gpt-5-mini`)
3. Reduce `OPENAI_MAX_TOKENS` for responses
4. Set `OPENAI_VERBOSITY=low` for concise outputs

### Security Alerts

If security vulnerabilities are detected:

1. Review GitHub Security Advisories
2. Run `npm audit fix` to update dependencies
3. Test thoroughly before deploying
4. Monitor logs for exploitation attempts

## Cost Optimization

### Token Budget Management

```bash
# Minimize context gathering
ENABLE_SERENA=false
ENABLE_MEMORY=false
MAX_CONTEXT_TOKENS=4000

# Use smallest viable model
OPENAI_MODEL=gpt-5-nano

# Reduce output verbosity
OPENAI_VERBOSITY=low
OPENAI_MAX_TOKENS=512
```

### Model Selection

- **gpt-5-nano**: Best for simple tasks, lowest cost
- **gpt-5-mini**: Balanced performance and cost (recommended default)
- **gpt-5**: Best for complex reasoning, highest cost
- **gpt-5-codex**: Optimized for code tasks

## Support

For production issues:

- Review logs at `llm-consultants.log`
- Check [SECURITY.md](../SECURITY.md) for security guidance
- Open issues at [GitHub Issues](https://github.com/amsv01/llm-consultants/issues)
- Email security concerns to [amin@effati.se](mailto:amin@effati.se)

## Additional Resources

- [Security Policy](../SECURITY.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [Docker Security](https://docs.docker.com/engine/security/)
