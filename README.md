# Agentic Template

A production-ready, full-stack template for building AI-powered applications with real-time streaming capabilities.

## 🚀 Features

- **Polyglot Monorepo**: TypeScript/Next.js frontend + Go backend managed with Turborepo
- **AI Multi-Provider Support**: OpenAI, Anthropic, Google AI, and Meta/Llama integration
- **Real-time Streaming**: gRPC-based streaming for token-by-token AI responses
- **Stateful AI Agent**: LangChainGo implementation with tools and memory
- **Database Integration**: Neon serverless PostgreSQL with pgx driver
- **Modern UI**: Mantine component library with dark/light theme support
- **API Key Management**: Secure configuration page for managing provider API keys
- **Docker Ready**: Containerized services with Docker Compose

## 📁 Project Structure

```
agentic-template/
├── apps/
│   ├── api/          # Go backend with gRPC server
│   └── web/          # Next.js frontend with Turbopack
├── packages/
│   └── proto/        # Protocol Buffer definitions
├── scripts/          # Development and build scripts
└── DOCS/            # Documentation and research
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Mantine UI** for component library
- **Tailwind CSS** for utility styling
- **gRPC-Web** for backend communication
- **Server Actions** for secure API calls

### Backend
- **Go 1.22** for high performance
- **gRPC** for efficient communication
- **LangChainGo** for AI orchestration
- **pgx** for PostgreSQL connection
- **Protocol Buffers** for API contracts

### Infrastructure
- **Turborepo** for monorepo management
- **Docker** for containerization
- **Neon** for serverless PostgreSQL
- **pnpm** for package management

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8.15+
- Go 1.22+ (optional for local development)
- Docker & Docker Compose (optional)
- Protocol Buffer compiler (protoc)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/agentic-template.git
cd agentic-template
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up minimal bootstrap configuration:
```bash
cp .env.example .env
# Generate a secure encryption key
openssl rand -hex 32
# Add the key to .env (this is the only required variable)
```

4. Start the application:
```bash
pnpm dev
```

5. Configure your environment through the UI:
   - Navigate to `http://localhost:3000/settings/environment`
   - Add your database credentials, API keys, and other variables
   - All values are encrypted and stored securely

### Development

#### Option 1: Local Development
```bash
# Start all services in development mode
pnpm dev

# Or start individual services
pnpm dev --filter=web   # Start Next.js frontend
pnpm dev --filter=api   # Start Go backend (requires Go)
```

#### Option 2: Docker Development
```bash
# Start all services with Docker Compose
docker-compose up

# Or build and run in detached mode
docker-compose up -d --build
```

### Building for Production

```bash
# Build all applications
pnpm build

# Build specific app
pnpm build --filter=web
pnpm build --filter=api
```

## 🔧 Configuration

All configuration is managed through the web UI - no manual file editing required!

### Environment Variables Management

Navigate to `/settings/environment` to manage all your variables:

- **Organize by Groups**: Database, AI Providers, NetSuite, custom groups
- **Secure Storage**: All sensitive values are encrypted with AES-256-GCM
- **Import/Export**: Share configurations (structure only, secrets excluded)
- **Test Connections**: Validate database and API configurations

### Quick API Setup

For quick AI provider setup, use `/settings/api-keys`:
- OpenAI
- Anthropic  
- Google AI
- Meta/Llama

### Database Configuration

Add Neon PostgreSQL credentials in the Database group:
- `DATABASE_URL_POOLED`: For runtime queries (with `-pooler` suffix)
- `DATABASE_URL_DIRECT`: For migrations (direct connection)

### Custom Integrations

Create custom groups for any service:
1. Click "Add Group" in the sidebar
2. Name your group (e.g., "NetSuite", "Salesforce")
3. Add variables with descriptions
4. Mark sensitive values as "Secret" for encryption

## 📚 API Documentation

### gRPC Service Definition

The main service is defined in `packages/proto/service.proto`:

```protobuf
service AgentService {
  rpc StreamAgentResponse(AgentRequest) returns (stream AgentResponse);
}
```

### Available Endpoints

- **Chat Interface**: `/chat` - Interactive AI chat with streaming responses
- **API Configuration**: `/settings/api-keys` - Manage AI provider API keys
- **Dashboard**: `/dashboard` - Main application dashboard
- **Health Check**: `GET /health` - API health status

## 🧰 Available Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all applications
- `pnpm lint` - Run linting
- `pnpm test` - Run tests
- `pnpm proto:gen` - Generate protobuf stubs
- `pnpm clean` - Clean build artifacts

## 🐳 Docker Support

### Build Images
```bash
# Build API image
docker build -t agentic-api ./apps/api

# Build Web image  
docker build -t agentic-web ./apps/web
```

### Run with Docker Compose
```bash
# Start all services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f api
docker-compose logs -f web
```

## 🤖 AI Agent Features

The template includes a stateful AI agent with:

- **Multiple LLM Providers**: Switch between OpenAI, Anthropic, Google, and Meta
- **Custom Tools**: 
  - Database query tool
  - Calculator tool
  - Web search tool (placeholder)
- **Conversation Memory**: Maintains context across interactions
- **Streaming Responses**: Real-time token-by-token output
- **Tool Call Visualization**: See which tools the agent uses

## 📝 Architecture Decisions

1. **Proxy-less gRPC**: Server Actions execute gRPC calls server-side, eliminating the need for a proxy
2. **Dual Database URLs**: Separate pooled and direct connections for Neon compatibility
3. **Polyglot Monorepo**: Turborepo manages both TypeScript and Go workspaces
4. **Stateful Agent Loop**: Custom orchestration simulates LangGraph behavior

## 🚀 Deployment

### Vercel (Frontend)
```bash
# Deploy Next.js app to Vercel
vercel --cwd apps/web
```

### Google Cloud Run (Backend)
```bash
# Deploy Go API to Cloud Run
gcloud run deploy agentic-api \
  --source apps/api \
  --region us-central1 \
  --allow-unauthenticated
```

### Docker Swarm / Kubernetes
Use the provided Docker images with your orchestration platform of choice.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built following best practices from the research document
- Inspired by modern AI application architectures
- Uses open-source libraries and frameworks

## 📞 Support

For questions or issues, please open a GitHub issue or contact the maintainers.

---

**Built with ❤️ using the Agentic Template**