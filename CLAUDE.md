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

## Notes for Future Development

- The gRPC protobuf files need to be generated using `protoc` command
- Go needs to be installed locally for backend development
- Database migrations should use the `DATABASE_URL_DIRECT` connection
- API keys can be managed through the web UI at `/settings/api-keys`
- Theme customization can be done in `apps/web/src/theme/theme.ts`
- All UI components use Mantine - refer to https://mantine.dev for documentation