# Contributing to Kortx MCP

Thank you for your interest in contributing! We welcome contributions from the community.

## Ways to Contribute

Reporting bugs, suggesting new features, improving documentation, submitting pull requests, starring the project, and participating in discussions are all valuable ways to help Kortx grow.

## Getting Started

### Prerequisites

Before you begin, ensure you have Node.js 22.12 or higher, npm or yarn, Git, and an OpenAI API key for testing. These tools are essential for working with the Kortx codebase.

### Setup Development Environment

Fork the repository and clone your fork to your local machine. Navigate to the project directory and install dependencies. Copy the `.env.example` file to `.env` and add your OpenAI API key. Build the project and verify everything works by running tests.

```bash
git clone https://github.com/YOUR_USERNAME/kortx-mcp.git
cd kortx-mcp
npm install
cp .env.example .env
# Add your OpenAI API key to .env
npm run build
npm test
```

## Development Workflow

### Making Changes

When you're ready to make changes, create a new branch from the main branch. Make your modifications, write or update tests to cover your changes, and run the test suite to ensure everything passes. Run the linter and code formatter to maintain consistency. Commit your changes using Conventional Commits format.

```bash
git checkout -b feature/your-feature-name
# Make your changes
npm test
npm run lint
npm run format
git commit -m "feat: add your feature"
```

### Commit Message Format

We use Conventional Commits to maintain a clean and meaningful git history. Use `feat:` for new features, `fix:` for bug fixes, `docs:` for documentation changes, `style:` for code style changes, `refactor:` for code refactoring, `test:` for adding or updating tests, and `chore:` for maintenance tasks.

Examples of good commit messages include "feat: add new tool for code review", "fix: resolve memory leak in context gatherer", and "docs: update integration guide for Cursor".

## Pull Request Process

Before submitting a pull request, update documentation if your changes affect user-facing features. Add tests for any new functionality and ensure all tests pass. Update the CHANGELOG.md file with your changes. Push your branch to your fork and create a pull request with a clear title and description. Reference any related issues and include screenshots or examples if applicable.

### Code Review

During code review, be respectful and constructive in your feedback. Address reviewer comments promptly and keep discussions focused on the code. Update your pull request based on the feedback you receive.

## Code Standards

### TypeScript

Write code using strict TypeScript. Define types for all functions and avoid using the `any` type. Use descriptive variable names that make the code self-documenting.

### Testing

Write tests for new features and maintain over 80% code coverage. Include unit, integration, and end-to-end tests where appropriate. Use descriptive test names that clearly state what is being tested.

### Documentation

Update the README when making user-facing changes. Document new tools in the `/docs/api/` directory. Add inline comments for complex logic to help future maintainers understand your code. Keep all documentation up-to-date.

## Project Structure

The project is organized with source code in `src/`, test files in `tests/`, documentation in `docs/`, usage examples in `examples/`, and GitHub templates in `.github/`.

```
kortx-mcp/
├── src/              # Source code
├── tests/            # Test files
├── docs/             # Documentation
├── examples/         # Usage examples
└── .github/          # GitHub templates
```

## Testing

### Running Tests

Run all tests with `npm test`, use watch mode during development with `npm test -- --watch`, check coverage with `npm test -- --coverage`, or run specific test files with `npm test -- tests/unit/config.test.ts`.

### Writing Tests

Structure your tests following the Arrange-Act-Assert pattern. Use Vitest's testing framework and write clear, descriptive test cases.

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = doSomething(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

## Adding New Tools

When adding a new MCP tool, create a new file in `src/tools/` and define the tool schema with Zod. Implement the tool logic, register it in `src/server.ts`, and add comprehensive tests in `tests/`. Document the tool in `docs/api/` and provide usage examples in `examples/`.

## Security

Never commit API keys or secrets to the repository. Report security issues privately by following the process outlined in SECURITY.md. Follow security best practices in all code contributions and help keep dependencies updated.

## Questions?

If you have questions or need help, join discussions on GitHub at https://github.com/effatico/kortx-mcp/discussions, email the maintainers at info@effati.se, or open an issue at https://github.com/effatico/kortx-mcp/issues.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Kortx!
