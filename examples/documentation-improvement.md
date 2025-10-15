# Documentation Improvement Workflow

This example demonstrates using MCP Consultant to improve documentation, READMEs, API docs, and user-facing content.

## Scenario

You're preparing your project for open source release and need to polish all documentation to professional quality.

## Workflow

### Step 1: Improve README Introduction

You have a basic README that needs enhancement:

**Original:**

```markdown
# My Project

This is a tool for managing tasks. It has a CLI and web interface.

## Install

npm install -g my-project

## Use

Run `my-project` to start.
```

**Query:**

```
@consultant improve this README introduction:
[paste original]

Context: Open source task management tool with CLI and web UI.
Target audience: developers and power users.
```

**Expected Response:**

````markdown
# My Project

A powerful, open-source task management system designed for developers who live in the terminal but occasionally need a visual interface.

My Project combines the speed of a command-line interface with the convenience of a modern web dashboard, giving you flexibility in how you organize and track your work.

## Features

- **Lightning-fast CLI** - Add, update, and query tasks without leaving your terminal
- **Modern Web Dashboard** - Visualize progress, manage projects, and collaborate with teams
- **Sync Everywhere** - Your tasks follow you across devices
- **Developer-friendly** - Git-style commands, scriptable interface, extensive API
- **Privacy-first** - Self-hosted option, encrypted storage, no tracking

## Quick Start

Install globally with npm:

```bash
npm install -g my-project
```
````

Run your first command:

```bash
my-project add "Write better documentation" --priority high
```

[View full documentation →](./docs)

```

### Step 2: Clarify Error Messages

You have confusing error messages in your application:

**Original Error:**
```

Error: Invalid input

```

**Query:**
```

@consultant improve this error message: "Error: Invalid input"

Context: Appears when user provides a date in wrong format to the CLI.
Expected format: YYYY-MM-DD
User might provide: MM/DD/YYYY or other variants

```

**Expected Response:**

```

Error: Invalid date format

Expected format: YYYY-MM-DD (e.g., 2025-03-15)
You provided: MM/DD/YYYY

Try: my-project add "Task name" --due 2025-03-15

````

**Explanation:**
- Specific about what's invalid (date format)
- Shows expected format with example
- Displays what user actually provided
- Gives actionable correction with example

### Step 3: Improve API Documentation

Your API docs are technically correct but hard to understand:

**Original:**
```markdown
### POST /api/tasks

Creates task.

Parameters:
- title (string)
- description (string)
- due (date)

Returns: Task object
````

**Query:**

```
@consultant improve this API documentation:
[paste original]

Context: REST API for task management.
Users are building integrations and need clear, actionable docs.
```

**Expected Response:**

````markdown
### Create a New Task

`POST /api/tasks`

Creates a new task in your workspace and returns the complete task object with assigned ID.

#### Request Body

| Field         | Type    | Required | Description                                   |
| ------------- | ------- | -------- | --------------------------------------------- |
| `title`       | string  | Yes      | Task title (max 200 characters)               |
| `description` | string  | No       | Detailed task description (supports Markdown) |
| `due`         | string  | No       | Due date in ISO 8601 format (YYYY-MM-DD)      |
| `priority`    | integer | No       | Priority level: 1 (low), 2 (medium), 3 (high) |
| `tags`        | array   | No       | Array of tag strings for categorization       |

#### Example Request

```bash
curl -X POST https://api.example.com/tasks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review pull request #123",
    "description": "Check security implications",
    "due": "2025-03-20",
    "priority": 3,
    "tags": ["code-review", "security"]
  }'
```
````

#### Success Response

**Code:** `201 Created`

```json
{
  "id": "task_abc123",
  "title": "Review pull request #123",
  "description": "Check security implications",
  "due": "2025-03-20",
  "priority": 3,
  "tags": ["code-review", "security"],
  "status": "pending",
  "createdAt": "2025-03-15T10:30:00Z",
  "updatedAt": "2025-03-15T10:30:00Z"
}
```

#### Error Responses

**Code:** `400 Bad Request`

- Missing required field
- Invalid date format
- Title exceeds 200 characters

```json
{
  "error": "Invalid date format",
  "message": "Field 'due' must be in YYYY-MM-DD format",
  "field": "due"
}
```

**Code:** `401 Unauthorized`

- Missing or invalid API key

**Code:** `429 Too Many Requests`

- Rate limit exceeded (100 requests/minute)

````

### Step 4: Enhance Code Comments

Your codebase has minimal comments:

**Original:**
```javascript
// Parse date
function parseDate(input) {
  const parts = input.split('-');
  return new Date(parts[0], parts[1] - 1, parts[2]);
}
````

**Query:**

```
@consultant improve this code comment and docstring:
[paste code]

Context: Date parsing utility used throughout the application.
Other developers will maintain this code.
```

**Expected Response:**

```javascript
/**
 * Parses a date string in YYYY-MM-DD format into a JavaScript Date object.
 *
 * This utility handles the common ISO 8601 date format used throughout
 * the application. Month values are automatically adjusted from 1-based
 * input to JavaScript's 0-based month indexing.
 *
 * @param {string} input - Date string in YYYY-MM-DD format (e.g., "2025-03-15")
 * @returns {Date} JavaScript Date object set to midnight local time
 *
 * @throws {TypeError} If input is not a string
 * @throws {RangeError} If date components are invalid
 *
 * @example
 * const date = parseDate("2025-03-15");
 * console.log(date.toISOString()); // "2025-03-15T00:00:00.000Z"
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date|MDN Date Documentation}
 *
 * @internal Note: Does not validate date ranges. Use validateDate() first.
 */
function parseDate(input) {
  const [year, month, day] = input.split('-').map(Number);
  return new Date(year, month - 1, day);
}
```

## Complete Documentation Improvement Session

### 1. README Enhancement

**Before:**

```markdown
# Task Manager

A task manager. Install with npm.
```

**Process:**

1. Ask consultant to improve introduction
2. Request feature highlights
3. Enhance installation instructions
4. Add visual examples
5. Improve navigation

**After:**
Professional, engaging README with clear value proposition

### 2. Contributing Guide

**Before:**

```markdown
# Contributing

Send PRs. Follow the code style.
```

**Query:**

```
@consultant improve this contributing guide:
[paste minimal guide]

Context: Want to attract open source contributors.
Need clear guidelines but welcoming tone.
```

**After:**
Comprehensive, friendly guide with setup steps, coding standards, PR process

### 3. API Documentation

**Process:**

1. Identify all endpoints lacking examples
2. For each endpoint, ask consultant to improve
3. Add request/response examples
4. Include error cases
5. Add authentication details

**Result:**
Complete, actionable API docs with curl examples

### 4. Error Messages

**Strategy:**

1. List all error messages in the app
2. For each error, provide context to consultant
3. Get improved, actionable error messages
4. Add helpful hints and links
5. Update codebase

**Improvement:**
From generic "Error: Failed" to specific, helpful messages

### 5. User Guide

**Before:**
Bullet points of features

**Process:**

1. Identify user journeys
2. For each journey, create step-by-step guide
3. Ask consultant to improve clarity and flow
4. Add screenshots/examples
5. Include troubleshooting

**After:**
Comprehensive user guide with real-world examples

## Documentation Patterns

### Pattern 1: The "Clarity Check"

Make technical content accessible:

```
@consultant improve clarity:
[paste technical explanation]

Target audience: developers new to this technology
```

### Pattern 2: The "Example Enhancement"

Make examples more helpful:

```
@consultant improve this code example:
[paste basic example]

Context: Need to show real-world usage with error handling
```

### Pattern 3: The "Error Message"

Create actionable errors:

```
@consultant improve this error: "Operation failed"

Context: [describe when it occurs and what user should do]
```

### Pattern 4: The "Navigation"

Improve document structure:

```
@consultant improve the structure of this guide:
[paste table of contents]

Goal: Make it easier to find specific information
```

### Pattern 5: The "Accessibility"

Make content more inclusive:

```
@consultant make this more accessible:
[paste content]

Consider: non-native English speakers, screen readers, various skill levels
```

## Tips for Documentation Improvement

### Provide Context

**Good:**

```
@consultant improve this error message: "DB connection failed"

Context: Appears on app startup when PostgreSQL is unreachable.
User might have wrong credentials, DB not running, or network issue.
Should guide user to check .env file and DB status.
```

**Less Effective:**

```
@consultant improve: "DB connection failed"
```

### Specify Your Audience

Always mention:

- Technical level (beginner, intermediate, expert)
- Role (developer, user, administrator)
- Goals (integrate, troubleshoot, learn)
- Context (production, development, learning)

### Iterate on Improvements

Don't stop at first version:

1. Get initial improvement
2. Request more examples
3. Ask for simpler explanation
4. Check accessibility
5. Validate with real users

### Use for Different Doc Types

- **READMEs**: Introduction, features, quick start
- **API Docs**: Endpoints, parameters, examples
- **User Guides**: Step-by-step instructions
- **Code Comments**: Function documentation
- **Error Messages**: Clear, actionable errors
- **Release Notes**: Clear change descriptions

## Common Documentation Tasks

### Writing READMEs

1. Improve project description
2. Clarify value proposition
3. Add feature highlights
4. Enhance installation steps
5. Create usage examples
6. Add troubleshooting section

### API Documentation

1. Add request/response examples
2. Document all parameters
3. Include error responses
4. Show authentication
5. Provide curl examples
6. Explain rate limits

### User Guides

1. Structure content logically
2. Add step-by-step instructions
3. Include screenshots
4. Provide troubleshooting tips
5. Link to related docs
6. Add FAQ section

### Code Documentation

1. Write clear docstrings
2. Explain complex algorithms
3. Document edge cases
4. Add usage examples
5. Link to related code
6. Note TODOs and limitations

## Best Practices

1. **Be Specific**: Provide full context about the content and audience
2. **Iterate**: First draft is rarely perfect
3. **Test Clarity**: Ask "would I understand this if I was new?"
4. **Add Examples**: Show, don't just tell
5. **Be Consistent**: Use consultant to maintain voice and style
6. **Accessibility Matters**: Consider all users
7. **Update Regularly**: Use consultant when updating docs

## Measuring Documentation Quality

Track improvements:

- User questions decreased
- Issues with "unclear docs" label reduced
- Onboarding time shortened
- API integration success rate improved
- Support ticket reduction

## Common Pitfalls to Avoid

1. **Too Technical**: Consultant helps simplify
2. **Too Vague**: Ask for specific examples
3. **Missing Context**: Provide background information
4. **No Examples**: Request realistic code samples
5. **Inconsistent Tone**: Use consultant to maintain style
6. **Outdated**: Keep docs in sync with code

## Integrating With Your Workflow

### Documentation Review Process

1. Write initial draft
2. Ask consultant to improve
3. Add examples and details
4. Review accessibility
5. Test with target audience
6. Iterate based on feedback

### Pre-Release Checklist

- [ ] README introduction improved
- [ ] API docs have examples
- [ ] Error messages are clear
- [ ] User guide is complete
- [ ] Code comments are helpful
- [ ] Contributing guide is welcoming

### Continuous Improvement

Regular documentation audits:

- Review one doc section weekly
- Ask consultant for improvements
- Update based on user feedback
- Keep examples up to date
- Maintain consistent style

## Related Examples

- [Strategic Planning](./strategic-planning.md) - Planning with consultant
- [Code Review](./code-review.md) - Review workflow
- [Debugging Session](./debugging-session.md) - Problem solving
