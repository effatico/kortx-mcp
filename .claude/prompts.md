# Helpful Prompts for LLM Consultants Development

This file contains useful prompts to help you work efficiently with this project.

## Starting a New Task

### Implementing a New Phase

```
Let's implement [Phase Name]. First, read the task description in Linear issue PLA-X,
then create the necessary files following the structure outlined in the project documentation.
```

### Adding a New Tool

```
I want to add a new consultation tool called [tool-name].
Please review the existing tools in src/tools/ and follow the same pattern.
The tool should [describe functionality].
```

### Modifying Existing Features

```
I need to modify [feature name] to [describe changes].
First, let's locate the relevant code and understand the current implementation.
```

## When You're Stuck

### Understanding the Codebase

```
Can you explain how [specific feature] works in this codebase?
Let's trace through the code flow starting from [entry point].
```

### Reviewing Documentation

```
Let's review the relevant documentation:
1. Check MCP best practices in docs/
2. Review similar implementations in existing MCP servers
3. Consider security implications from the spec
```

### Finding Similar Implementations

```
Are there similar implementations of [feature] in other MCP servers?
Let's search the codebase for [search term] to find related code.
```

### Debugging Issues

```
I'm seeing [error message]. Can you help me debug this?
The error occurs when [describe scenario].
Here's the relevant code: [paste code]
```

## Before Committing

### Pre-commit Checklist

```
Run the following checks before committing:
- npm test (verify all tests pass)
- npm run build (ensure clean build)
- npm run lint (check code style)
- npm run format:check (verify formatting)
- Review all Zod schemas for correctness
- Check for security issues
- Update documentation if needed
```

### Verifying Changes

```
Let's verify my changes:
1. Run the test suite
2. Check the build output
3. Test with Claude Code locally
4. Review the diff for any unintended changes
```

### Documentation Updates

```
I've made changes to [feature].
What documentation needs to be updated?
Please check:
- README.md
- API documentation in docs/api/
- Integration guides in docs/integration/
- Examples in examples/
```

## Testing and Validation

### Local Testing with Claude Code

```
Let's test these changes with Claude Code.
Please run the test script and verify the tools work correctly.
```

### Running Specific Tests

```
Run tests for [specific feature]:
npm test -- [test-file-pattern]
```

### Integration Testing

```
Let's do an end-to-end test:
1. Build the project
2. Add to Claude Code as a local MCP server
3. Test each tool with sample inputs
4. Verify context gathering works correctly
```

## Architecture and Design

### Understanding the Architecture

```
Can you explain the overall architecture of this MCP server?
How do the different components interact?
```

### Design Decisions

```
Why was [specific design choice] made?
Let's review the relevant documentation and code comments.
```

### Context Gathering Flow

```
Walk me through how context gathering works:
1. How is it triggered?
2. What sources does it query?
3. How is the context formatted?
4. How is it sent to OpenAI?
```

## Configuration and Environment

### Environment Variables

```
What environment variables are available and what do they do?
Let's review .env.example and the config validation schema.
```

### Model Selection

```
Which GPT-5 model should I use for [use case]?
Compare the trade-offs between gpt-5, gpt-5-mini, gpt-5-nano, and gpt-5-codex.
```

### Optimizing Performance

```
How can I optimize the performance for [specific scenario]?
Should I adjust reasoning effort, max tokens, or context gathering settings?
```

## Common Development Tasks

### Adding a New Environment Variable

```
I need to add a new environment variable for [purpose].
Please:
1. Add it to the config schema in src/config/index.ts
2. Update .env.example
3. Document it in docs/configuration.md
4. Update relevant integration guides
```

### Adding a New Context Source

```
I want to integrate a new context source: [source name].
Please create a new file in src/context/sources/ following the pattern
of existing sources like serena.ts and memory.ts.
```

### Updating Dependencies

```
Let's update [dependency] to the latest version.
First, check for breaking changes in the changelog,
then update package.json and test thoroughly.
```

### Improving Error Messages

```
The error message "[current message]" isn't clear enough.
Let's improve it to be more actionable and user-friendly.
```

## Documentation

### Generating API Documentation

```
I've modified the [tool-name] tool.
Please update its API documentation in docs/api/[tool-name].md
with the new parameters and examples.
```

### Writing Integration Guides

```
Create an integration guide for [platform].
Follow the structure of existing guides in docs/integration/
and include setup instructions, configuration examples, and troubleshooting.
```

### Adding Examples

```
Create an example workflow demonstrating [use case].
Add it to examples/ with clear explanations and expected outputs.
```

## Release Preparation

### Pre-release Checklist

```
Before releasing version [x.y.z]:
1. Run full test suite
2. Update CHANGELOG.md
3. Verify all documentation is current
4. Test Docker build
5. Test NPX installation
6. Review security considerations
```

### Version Bumping

```
Bump the version to [x.y.z]:
1. Update package.json
2. Update package-lock.json
3. Update CHANGELOG.md
4. Create git tag
```

## Troubleshooting

### Common Issues

#### TypeScript Errors

```
I'm seeing TypeScript errors: [error message]
Let's check:
1. Is the type definition correct?
2. Are all imports properly typed?
3. Does the Zod schema match the type?
```

#### Test Failures

```
Tests are failing: [test name]
Let's debug by:
1. Running the test in isolation
2. Checking recent changes that might affect it
3. Reviewing test mocks and fixtures
```

#### Build Issues

```
The build is failing: [error message]
Let's check:
1. TypeScript configuration in tsconfig.json
2. Import/export statements
3. Node.js version compatibility
```

#### MCP Server Not Starting

```
The MCP server won't start: [error message]
Let's verify:
1. Environment variables are set correctly
2. Dependencies are installed
3. Build is up to date
4. Transport configuration is correct
```

## Advanced Topics

### Performance Optimization

```
Analyze the performance of [feature] and suggest optimizations.
Consider:
1. Token usage
2. API call latency
3. Context gathering efficiency
4. Memory usage
```

### Security Review

```
Review the security of [feature].
Check for:
1. Input validation
2. API key handling
3. Error message sanitization
4. Dependency vulnerabilities
```

### Scaling Considerations

```
What should we consider for scaling this MCP server?
Discuss:
1. Rate limiting
2. Caching strategies
3. Context size management
4. Cost optimization
```

## Remember

When working with Claude Code on this project:

- Always check existing implementations before creating new patterns
- Follow the TypeScript strict mode guidelines
- Validate all inputs with Zod schemas
- Use structured logging with Pino
- Write tests for new features
- Update documentation alongside code changes
- Consider security implications
- Test with Claude Code locally before committing
