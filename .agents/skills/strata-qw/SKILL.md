```markdown
# strata-qw Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill introduces the core development patterns and conventions used in the `strata-qw` TypeScript codebase. It covers file organization, code style, import/export patterns, and testing practices. By following these guidelines, contributors can ensure consistency and maintainability across the project.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.ts`, `dataFetcher.ts`

### Imports
- Use **relative import paths** for modules within the project.
  - Example:
    ```typescript
    import { fetchData } from './dataFetcher';
    ```

### Exports
- Use **named exports** rather than default exports.
  - Example:
    ```typescript
    // dataFetcher.ts
    export function fetchData() { ... }
    ```

### Commit Messages
- Commit messages are freeform, often without strict prefixes.
- Average commit message length is about 61 characters.

## Workflows

### Adding a New Module
**Trigger:** When you need to add a new feature or utility.
**Command:** `/add-module`

1. Create a new file using camelCase naming (e.g., `newFeature.ts`).
2. Write your TypeScript code, using named exports.
3. Use relative imports to include dependencies.
4. Add corresponding tests in a file named `newFeature.test.ts`.
5. Commit your changes with a clear, concise message.

### Running Tests
**Trigger:** To verify code correctness after changes.
**Command:** `/run-tests`

1. Identify test files matching the `*.test.*` pattern.
2. Use the project's test runner (framework unknown; check project docs or package.json).
3. Run all tests and review results.
4. Fix any failing tests before merging.

### Refactoring Code
**Trigger:** When improving or restructuring existing code.
**Command:** `/refactor`

1. Update code using camelCase file naming and relative imports.
2. Ensure all exports remain named.
3. Update or add tests as needed to cover changes.
4. Commit with a descriptive message about the refactor.

## Testing Patterns

- Test files are named with the pattern `*.test.*` (e.g., `userProfile.test.ts`).
- The testing framework is not specified; check the project documentation or configuration files for details.
- Place tests alongside or near the modules they cover.

**Example:**
```typescript
// userProfile.test.ts
import { getUserProfile } from './userProfile';

describe('getUserProfile', () => {
  it('should return user data', () => {
    // test implementation
  });
});
```

## Commands
| Command       | Purpose                                   |
|---------------|-------------------------------------------|
| /add-module   | Scaffold and add a new module             |
| /run-tests    | Run all tests in the codebase             |
| /refactor     | Refactor code following project patterns   |
```
