# End of Day (EOD) - Code Cleanup & Quality Check

You are now performing **End of Day** cleanup activities. This is a comprehensive code quality and testing session to lock in the work that's been completed.

## Your Mission

Perform a thorough review and improvement of the code we've worked on today, following these steps in order:

---

## Phase 1: Code Review & Refactoring (Priority: High)

### 1.1 Identify What Was Changed
- Review the git status and diff to see all modified files
- List out the files that were changed during this work session
- Focus your cleanup efforts on these files

### 1.2 Refactoring Checklist

For each modified file, check for:

**Performance & Efficiency**
- [ ] Remove any duplicate code
- [ ] Optimize loops and iterations
- [ ] Look for unnecessary re-renders (React) or redundant database queries (Go)
- [ ] Check for inefficient algorithms that could be improved
- [ ] Ensure proper use of memoization/caching where appropriate

**Code Quality**
- [ ] Consistent naming conventions
- [ ] Proper error handling (no swallowed errors)
- [ ] Remove console.logs, debug statements, or commented-out code
- [ ] Ensure proper TypeScript types (no `any` unless absolutely necessary)
- [ ] DRY principle - extract repeated logic into reusable functions
- [ ] Follow single responsibility principle

**Go-Specific**
- [ ] Proper error wrapping with context
- [ ] No goroutine leaks (proper cleanup with contexts/channels)
- [ ] Efficient use of defer statements
- [ ] Proper use of pointers vs values

**React/Next.js-Specific**
- [ ] Proper use of Server Components vs Client Components
- [ ] No prop drilling - consider context or composition
- [ ] Proper cleanup in useEffect hooks
- [ ] Accessibility attributes where needed

### 1.3 Error Detection

Look for common mistakes:
- Off-by-one errors in loops
- Missing null/undefined checks
- Race conditions in async code
- Incorrect error handling
- Missing edge cases
- Type mismatches or unsafe type assertions
- Resource leaks (unclosed connections, file handles, etc.)

---

## Phase 2: Unit Testing (Priority: High)

### 2.1 Test Coverage Assessment

For each modified file, determine:
- Does this file have tests already?
- What new functionality was added that needs tests?
- What edge cases need to be covered?

### 2.2 Test Writing Guidelines

**Go Backend Tests**
- Use table-driven tests for multiple scenarios
- Test both success and error paths
- Mock external dependencies (database, API calls)
- Use `testify` assertions for clarity
- File naming: `*_test.go` alongside the source file

```go
func TestFunctionName(t *testing.T) {
    tests := []struct {
        name    string
        input   InputType
        want    OutputType
        wantErr bool
    }{
        {"success case", validInput, expectedOutput, false},
        {"error case", invalidInput, nil, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := FunctionName(tt.input)
            if tt.wantErr {
                assert.Error(t, err)
                return
            }
            assert.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

**React/Next.js Frontend Tests**
- Use Jest and React Testing Library
- Test component rendering and user interactions
- Test Server Actions independently
- Mock gRPC calls and external dependencies
- File naming: `*.test.ts` or `*.test.tsx`

```typescript
describe('ComponentName', () => {
  it('renders correctly with props', () => {
    render(<ComponentName prop={value} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const mockFn = jest.fn();
    render(<ComponentName onClick={mockFn} />);
    await userEvent.click(screen.getByRole('button'));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### 2.3 Test Execution

After writing tests:
1. Run the test suite to ensure all tests pass
2. Check test coverage (aim for >80% on new code)
3. Fix any failing tests
4. Ensure tests run quickly (mock slow operations)

---

## Phase 3: Documentation Updates (Priority: Medium)

### 3.1 Code Comments
- Add JSDoc/GoDoc comments to exported functions
- Document complex logic with inline comments
- Explain "why" not "what" (code shows what, comments explain why)

### 3.2 Update Related Documentation
- If behavior changed, update relevant DOCS/ files
- Update README if setup steps changed
- Update CLAUDE.md if architectural decisions were made

---

## Phase 4: Final Checks (Priority: Medium)

### 4.1 Build & Type Check
```bash
# Run these commands to ensure everything compiles
pnpm build          # Build all packages
pnpm type-check     # TypeScript type checking (if available)
```

### 4.2 Linting & Formatting
```bash
# Ensure code follows project standards
pnpm lint           # Run linters
pnpm format         # Auto-format code
```

### 4.3 Git Status
- Review what's changed with `git status` and `git diff`
- Ensure no unintended files are modified
- Check that no secrets or sensitive data are included

---

## Execution Order

Follow this sequence:

1. **Review** - Analyze what was changed (`git diff`, `git status`)
2. **Refactor** - Improve code quality and efficiency
3. **Test** - Write comprehensive unit tests
4. **Verify** - Run tests, build, and linting
5. **Document** - Update comments and docs if needed
6. **Report** - Summarize what was done

---

## Output Format

After completing the EOD process, provide a summary:

```markdown
## EOD Summary

### Files Reviewed & Refactored
- `path/to/file1.go` - [Brief description of improvements]
- `path/to/file2.tsx` - [Brief description of improvements]

### Refactoring Changes Made
1. [Specific improvement with file reference]
2. [Specific improvement with file reference]

### Tests Written
- ✅ `path/to/file1_test.go` - [Coverage description]
- ✅ `path/to/file2.test.tsx` - [Coverage description]

### Test Results
- All tests passing: [Yes/No]
- Test coverage: [X%]

### Issues Found & Fixed
1. [Issue description] - Fixed in [file:line]
2. [Issue description] - Fixed in [file:line]

### Build Status
- ✅ TypeScript compilation: [Success/Failure]
- ✅ Go build: [Success/Failure]
- ✅ Linting: [Success/Failure]

### Recommendations for Tomorrow
- [Any follow-up work needed]
- [Technical debt identified]
- [Future improvements to consider]
```

---

## Important Notes

- **Be thorough but pragmatic** - Focus on high-impact improvements
- **Don't break existing functionality** - Run tests after each refactoring
- **Prioritize test coverage** - Tests are the most important deliverable
- **Ask for clarification** - If unsure about refactoring approach, ask the user
- **Keep the user informed** - Show progress as you work through each phase

---

**Remember**: The goal is to leave the codebase in better shape than we found it, with confidence that our changes won't break in the future.
