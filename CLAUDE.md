# Claude Code Context

This document provides context for Claude Code when working with this project.

## Project Overview

This is an AI-powered full-stack template application built with:
- **Frontend**: Next.js 14 with TypeScript, Mantine UI, Tailwind CSS, and Turbopack
- **Backend**: Go with gRPC, LangChainGo, and PostgreSQL
- **Infrastructure**: Turborepo monorepo, Docker, Protocol Buffers

## Key Features

1. **Multi-Provider AI Support**: Supports OpenAI, Anthropic, Google AI, and Meta/Llama
2. **Real-time Streaming**: gRPC-based streaming for token-by-token AI responses
3. **API Key Management**: Secure configuration page at `/settings/api-keys`
4. **Stateful AI Agent**: LangChainGo implementation with tools and memory
5. **Database Integration**: Neon serverless PostgreSQL with pgx driver
6. **Dark/Light Theme**: Built-in theme toggle with Mantine UI components

## Project Structure

```
AgenticTemplate/
├── apps/
│   ├── api/          # Go backend with gRPC server
│   │   ├── agent/    # LangChainGo AI agent implementation
│   │   ├── config/   # Configuration management
│   │   ├── db/       # Database connection and queries
│   │   └── grpc_server/ # gRPC service implementations
│   └── web/          # Next.js frontend
│       ├── src/
│       │   ├── app/  # App router pages and actions
│       │   ├── components/ # React components (Mantine UI)
│       │   ├── theme/ # Mantine theme configuration
│       │   └── lib/  # Utilities and gRPC client
│       └── Dockerfile
├── packages/
│   └── proto/        # Protocol Buffer definitions
├── scripts/          # Development and build scripts
├── DOCS/            # Documentation and research
└── docker-compose.yml
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build all applications
pnpm build

# Generate protobuf files
pnpm proto:gen

# Run with Docker
docker-compose up
```

## Environment Variables

Key environment variables needed:
- `DATABASE_URL_POOLED` - Neon pooled connection string
- `DATABASE_URL_DIRECT` - Neon direct connection string
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GOOGLE_API_KEY` - Google AI API key
- `META_API_KEY` - Meta/Llama API key

## Important Architectural Decisions

1. **Proxy-less gRPC**: Server Actions execute gRPC calls server-side
2. **Dual Database URLs**: Separate pooled and direct connections for Neon
3. **Stateful Agent Loop**: Custom orchestration simulates LangGraph behavior
4. **Multi-Provider Support**: Agent can switch between different LLM providers
5. **Mantine UI Framework**: Component library with built-in dark/light theme support

## Current Status

All core features have been implemented:
- ✅ Turborepo monorepo structure
- ✅ Go backend with gRPC
- ✅ Next.js frontend with Server Actions
- ✅ LangChainGo AI agent
- ✅ API key configuration page
- ✅ Docker support
- ✅ Mantine UI with dark/light theme support
- ✅ Comprehensive documentation

## Custom Slash Commands

This project has custom slash commands to enhance development workflow.

### `/learning-mode` - Educational Documentation Generator

Generates educational documentation as you work, creating materials in `DOCS/LEARNING/`.

**When to use**: Before starting work on a feature or fix when you want to create learning materials.

**What it does**:
- Creates educational materials that explain core concepts using analogies and storytelling
- Documents architectural decisions and trade-offs
- Shows how components connect within the larger system
- Includes practical examples with annotated code
- Adds reflection questions to deepen understanding

**Output**: Markdown files in `DOCS/LEARNING/` with naming convention `YYYY-MM-DD-{topic-slug}.md`

**Benefits**:
- Build intuitive understanding of complex technical concepts
- Create a knowledge base of implementation patterns
- Onboard new developers with context-rich explanations
- Document the "why" behind code decisions, not just the "what"

---

### `/eod` - End of Day Cleanup & Quality Check

Performs comprehensive code review, refactoring, and test writing for the work session.

**When to use**: After completing a chunk of work that's ready for cleanup and testing.

**What it does**:
1. **Code Review & Refactoring**
   - Reviews all modified files from git diff
   - Refactors for performance, efficiency, and code quality
   - Identifies and fixes obvious errors or missteps
   - Removes debug code, improves naming, applies DRY principle

2. **Unit Testing**
   - Writes comprehensive unit tests for new functionality
   - Tests both success and error paths
   - Mocks external dependencies
   - Ensures tests pass and provides coverage metrics

3. **Final Checks**
   - Runs build and type checking
   - Runs linting and formatting
   - Reviews git status for unintended changes

**Output**: Detailed summary report showing refactoring changes, tests written, issues fixed, and build status.

**Benefits**:
- Lock in functionality with tests to prevent future breakage
- Improve code quality through systematic refactoring
- Catch errors before they reach production
- Leave codebase in better shape than you found it

## Code Quality & File Management Guidelines

### File Naming & Versioning

**NEVER create iterations of files** like `file-v2.ts`, `file-new.ts`, `file-simple.ts`, etc.

When refactoring or rewriting a file:

1. **Archive the original** (if needed for reference):
   ```bash
   # Move to archive directory with timestamp
   mkdir -p .archive/YYYY-MM-DD
   mv path/to/file.ts .archive/YYYY-MM-DD/file.ts
   ```

2. **Create new file with standard name**:
   - Write the new implementation
   - Use the EXACT same filename as the original
   - Maintain consistent file structure

3. **Document the change**:
   - Add entry to commit message explaining the rewrite
   - Update relevant documentation
   - Note any breaking changes

**Example workflow**:
```bash
# Archiving complex test file before replacement
mkdir -p .archive/2025-10-17
mv apps/web/src/app/settings/environment/__tests__/actions.test.ts \
   .archive/2025-10-17/actions.test.complex.ts

# Create new simplified version with original name
# (write new file as actions.test.ts)
```

### Why This Matters

- **Clean codebase**: No clutter from `-v2`, `-new`, `-simple` suffixes
- **Consistent imports**: File paths never change, imports stay valid
- **Clear history**: Git history shows the evolution, not filename variations
- **Professional standard**: Production codebases don't have versioned filenames

### Testing Standards

All tests must pass before committing:
- **100% pass rate required** - No failing tests allowed in commits
- Tests should be reliable and deterministic
- Mock external dependencies (filesystem, network, databases)
- If mocking becomes too complex, simplify the test scope
- Focus on testing business logic, not implementation details

### Commit Quality

- Run full test suite before committing: `pnpm test`
- Ensure build succeeds: `pnpm build`
- Check for TypeScript errors: `pnpm type-check`
- Use descriptive commit messages with context

## Notes for Future Development

- The gRPC protobuf files need to be generated using `protoc` command
- Go needs to be installed locally for backend development
- Database migrations should use the `DATABASE_URL_DIRECT` connection
- API keys can be managed through the web UI at `/settings/api-keys`
- Theme customization can be done in `apps/web/src/theme/theme.ts`
- All UI components use Mantine - refer to https://mantine.dev for documentation