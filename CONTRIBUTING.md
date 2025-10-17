# Contributing to MCP Consultant

Thank you for your interest in contributing to MCP Consultant. This document provides guidelines and instructions for contributing, including the code of conduct, getting started steps, development workflow, pull request process, coding standards, testing guidelines, documentation, bug reporting, and feature requests.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 22.12.0
- npm >= 9.0.0
- OpenAI API key (for testing)
- Git

### Fork and Clone

Fork the repository on GitHub, then clone your fork locally with `git clone https://github.com/YOUR_USERNAME/llm-consultants.git` and `cd llm-consultants`. Add the upstream repository with `git remote add upstream https://github.com/effatico/kortx-mcp.git`.

### Initial Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your OpenAI API key

# Build the project
npm run build

# Run tests
npm test
```

## Development Workflow

### Creating a Branch

Always create a feature branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `test/` - Test additions or modifications
- `refactor/` - Code refactoring

### Making Changes

Make your changes in your feature branch, write or update tests as needed, and update documentation if required. Ensure all tests pass with `npm test`, check code quality with `npm run lint` and `npm run format:check`, and verify the build succeeds with `npm run build`.

### Commit Messages

Follow Conventional Commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

**Examples:**

```
feat(tools): add code analysis tool

Implements a new tool for analyzing code quality and suggesting improvements.

Closes #42
```

```
fix(config): handle missing environment variables

Improves error messages when required env vars are not set.
```

## Pull Request Process

### Before Submitting

Ensure your PR passes all tests, linting, and formatting checks. Verify it builds successfully, includes tests for new functionality, updates relevant documentation, has a clear descriptive title, and references any related issues.

### Submitting a Pull Request

1. Push your branch to your fork:

```bash
git push origin feature/your-feature-name
```

2. Open a Pull Request on GitHub
3. Fill out the PR template completely
4. Link any related issues
5. Request review from maintainers

### PR Review Process

- Maintainers will review your PR
- Address any requested changes
- Keep your PR up to date with the main branch
- Once approved, a maintainer will merge your PR

### Keeping Your Fork Updated

```bash
git checkout master
git fetch upstream
git merge upstream/master
git push origin master
```

## Coding Standards

### TypeScript Guidelines

- Use TypeScript strict mode
- Provide type annotations for function parameters and return types
- Avoid `any` types when possible
- Use interfaces for object shapes
- Use enums for fixed sets of values

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format
```

### File Organization

- Keep files focused and single-purpose
- Use clear, descriptive file names
- Group related functionality in directories
- Export only what's necessary

### Error Handling

- Use proper error types
- Provide meaningful error messages
- Log errors appropriately
- Handle edge cases

## Testing Guidelines

### Test Structure

- Unit tests: Test individual functions/classes in isolation
- Integration tests: Test component interactions
- Use Vitest testing framework
- Follow AAA pattern (Arrange, Act, Assert)

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = someFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test Coverage

- Aim for >80% line coverage
- Cover edge cases and error conditions
- Test both happy paths and error paths
- Run `npm run test:coverage` to check coverage

## Documentation

### What to Document

- New features and APIs
- Configuration options
- Breaking changes
- Migration guides
- Examples and use cases

### Documentation Style

- Use clear, concise language
- Provide code examples
- Include expected inputs/outputs
- Add links to related documentation

### README Updates

If your changes affect:

- Installation process
- Configuration
- Available features
- Usage examples

Update the README.md accordingly.

## Reporting Bugs

### Before Reporting

- Check existing issues
- Verify it's not a configuration issue
- Test with the latest version

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:

1. ...
2. ...

**Expected Behavior**
What you expected to happen

**Actual Behavior**
What actually happened

**Environment**

- OS: [e.g., macOS 13.0]
- Node.js: [e.g., 22.12.0]
- Package version: [e.g., 1.0.0]

**Additional Context**
Any other relevant information
```

## Requesting Features

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why this feature would be useful

**Proposed Solution**
How you think it could be implemented

**Alternatives**
Other solutions you've considered

**Additional Context**
Any other relevant information
```

## Questions?

- 📖 Check the [documentation](./docs)
- 💬 Ask in [GitHub Discussions](https://github.com/effatico/kortx-mcp/discussions)
- 📧 Email: amin@effati.se

Thank you for contributing to MCP Consultant! 🎉
