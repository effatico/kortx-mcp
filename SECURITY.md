# Security Policy

## Reporting a Vulnerability

We take the security of MCP Consultant seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please DO NOT open public issues for security vulnerabilities.**

Instead, please email security reports to: **amin@effati.se**

Include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if available)
- Your contact information

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Investigation**: We will investigate and validate the vulnerability
- **Updates**: We will keep you informed of our progress
- **Fix Timeline**: We aim to address critical vulnerabilities within 7 days
- **Credit**: We will credit you in the release notes (unless you prefer to remain anonymous)

---

## Supported Versions

We provide security updates for the following versions:

| Version | Supported |
| ------- | --------- |
| 1.x.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

---

## Security Best Practices

### API Key Management

#### ⚠️ NEVER commit API keys to version control

**DO:**

- ✅ Use environment variables for API keys
- ✅ Use `.env` files (already in `.gitignore`)
- ✅ Use secrets management services (AWS Secrets Manager, HashiCorp Vault, etc.)
- ✅ Rotate API keys regularly
- ✅ Use read-only or scoped API keys when possible

**DON'T:**

- ❌ Hard-code API keys in source code
- ❌ Commit `.env` files with real keys
- ❌ Share API keys in chat, email, or documentation
- ❌ Use production keys in development or testing

#### Example: Safe API Key Configuration

```bash
# .env (never commit this file)
OPENAI_API_KEY=sk-your-actual-api-key-here
```

```json
// Claude Code MCP config (~/.config/claude/mcp.json)
{
  "mcpServers": {
    "consultant": {
      "command": "npx",
      "args": ["-y", "mcp-consultant"],
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}" // Reference from environment
      }
    }
  }
}
```

---

## Docker Security

### Running Securely

The official Docker image follows security best practices:

```bash
# Run with non-root user (built-in)
docker run -e OPENAI_API_KEY=your-key ghcr.io/amsv01/mcp-consultant:latest

# Use Docker secrets (recommended for production)
echo "your-api-key" | docker secret create openai_api_key -
docker service create \
  --name mcp-consultant \
  --secret openai_api_key \
  ghcr.io/amsv01/mcp-consultant:latest
```

### Security Features

- ✅ **Non-root execution**: Container runs as user `node` (UID 1000)
- ✅ **Minimal base image**: Alpine Linux for reduced attack surface
- ✅ **No sensitive data in logs**: API keys are redacted from logs
- ✅ **Read-only filesystem**: Application doesn't require write access
- ✅ **Multi-stage build**: Build dependencies not included in final image

---

## Data Privacy

### What Data is Sent to OpenAI

When using MCP Consultant, the following data is sent to OpenAI's API:

- User's question or request
- Context gathered from your codebase (if context gathering is enabled)
- File contents (if `INCLUDE_FILE_CONTENT=true`)
- Git history (if `INCLUDE_GIT_HISTORY=true`)

### What Data is NOT Sent

- Your OpenAI API key (only used for authentication)
- Files outside the project directory
- Environment variables (except those explicitly configured)

### Minimizing Data Exposure

```bash
# Disable context gathering
ENABLE_SERENA=false
ENABLE_MEMORY=false
ENABLE_CCLSP=false
INCLUDE_FILE_CONTENT=false
INCLUDE_GIT_HISTORY=false

# Limit context size
MAX_CONTEXT_TOKENS=8000  # Smaller = less data sent
```

---

## Logging and Sensitive Data

### Automatic Redaction

MCP Consultant automatically redacts sensitive data from logs:

- API keys are replaced with `[REDACTED]`
- Authentication tokens are sanitized
- Structured logging prevents accidental key exposure

### Log Levels

```bash
LOG_LEVEL=info  # Default - recommended for production
LOG_LEVEL=warn  # Minimal logging
LOG_LEVEL=error # Only errors
LOG_LEVEL=debug # Verbose - DO NOT use in production with sensitive data
```

### Log File Security

Logs are written to:

- `~/.mcp-consultant/logs/mcp-consultant.log` (global install)
- `./logs/mcp-consultant.log` (local development)

**Secure your log files:**

```bash
# Set restrictive permissions
chmod 600 ~/.mcp-consultant/logs/mcp-consultant.log

# Rotate logs regularly
# Use logrotate or similar tools to prevent log files from growing indefinitely
```

---

## Network Security

### TLS/SSL

All communication with OpenAI's API is encrypted via HTTPS (TLS 1.2+).

### Proxy Support

If you need to use a proxy:

```bash
# HTTP proxy
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080

# Authenticated proxy
export HTTP_PROXY=http://user:pass@proxy.example.com:8080
```

---

## Dependency Security

### Audit Dependencies

We regularly audit dependencies for vulnerabilities:

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check for outdated packages
npm outdated
```

### GitHub Actions Security

Our CI/CD pipeline includes:

- ✅ Automated dependency audits on every push
- ✅ Dependabot security updates
- ✅ npm provenance for published packages
- ✅ SARIF security scanning

---

## Compliance

### Data Residency

- OpenAI's API processes data in their data centers
- Review [OpenAI's Privacy Policy](https://openai.com/policies/privacy-policy) for data handling details
- Consider using OpenAI's Azure offering for specific compliance requirements

### GDPR Compliance

If you're subject to GDPR:

- Ensure you have a Data Processing Agreement with OpenAI
- Implement data minimization (disable unnecessary context gathering)
- Consider anonymizing code before sending to the API
- Review OpenAI's [GDPR compliance documentation](https://openai.com/policies/privacy-policy)

### SOC 2 Compliance

- OpenAI maintains SOC 2 Type II certification
- Implement access controls for API keys
- Enable audit logging
- Use secrets management solutions

---

## Security Checklist

Before deploying to production:

- [ ] API keys stored securely (not in code)
- [ ] Environment variables properly configured
- [ ] Log level set appropriately (not `debug`)
- [ ] Docker container runs as non-root user
- [ ] Dependencies audited (`npm audit`)
- [ ] Context gathering configured appropriately
- [ ] File content inclusion reviewed
- [ ] Git history inclusion reviewed
- [ ] Log files have restrictive permissions
- [ ] TLS/SSL enabled for all network communication
- [ ] Secrets rotation schedule established

---

## Known Security Considerations

### Context Gathering

**Risk**: Sensitive code or data may be sent to OpenAI's API

**Mitigation**:

- Review files before enabling `INCLUDE_FILE_CONTENT=true`
- Use `.gitignore` patterns to exclude sensitive files
- Disable context gathering for projects with sensitive data
- Consider using OpenAI's Azure offering with customer-managed keys

### Third-Party MCPs

**Risk**: Other MCP servers may have different security practices

**Mitigation**:

- Only use trusted MCP servers
- Review MCP server source code when possible
- Isolate MCP servers with sensitive access
- Monitor logs for unexpected behavior

---

## Security Updates

We will announce security updates through:

- GitHub Security Advisories
- Release notes with `[SECURITY]` prefix
- Email notifications to security@effati.se subscribers

Subscribe to security updates:

- Watch this repository for security advisories
- Follow release notes for security patches
- Enable GitHub Dependabot alerts

---

## Additional Resources

- [OpenAI Security Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [Model Context Protocol Security](https://modelcontextprotocol.io/docs/security)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

---

## Questions?

For security-related questions that are not vulnerabilities, please:

- Open a [GitHub Discussion](https://github.com/amsv01/mcp-consultant/discussions)
- Email amin@effati.se with subject "Security Question: [Your Topic]"

Thank you for helping keep MCP Consultant secure! 🔒
