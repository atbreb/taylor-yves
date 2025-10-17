# Backend Development Guidelines

This document provides guidelines for Claude Code when working on the Go backend application.

## Core Principles

### 1. Modularity and File Size
- **Keep files under 500 lines of code** (hard limit)
- Break down large files into smaller, focused modules
- One responsibility per file
- Extract common logic into utility packages

### 2. Command-Query Responsibility Segregation (CSR)

Separate read and write operations for better maintainability and scalability.

#### Commands (Write Operations)
Commands modify state but don't return data.

```go
// commands/create_agent.go
package commands

type CreateAgentCommand struct {
    Name        string
    Description string
}

type CreateAgentHandler struct {
    repo AgentRepository
}

func (h *CreateAgentHandler) Handle(cmd CreateAgentCommand) error {
    agent := &Agent{
        Name:        cmd.Name,
        Description: cmd.Description,
    }
    return h.repo.Save(agent)
}
```

#### Queries (Read Operations)
Queries return data but don't modify state.

```go
// queries/get_agent.go
package queries

type GetAgentQuery struct {
    ID string
}

type GetAgentHandler struct {
    repo AgentRepository
}

func (h *GetAgentHandler) Handle(query GetAgentQuery) (*Agent, error) {
    return h.repo.FindByID(query.ID)
}
```

### 3. Project Structure

```
apps/api/
├── agent/                 # AI agent implementation
│   ├── commands/         # Write operations
│   ├── queries/          # Read operations
│   ├── tools/            # Agent tools
│   └── memory/           # Agent memory
├── config/               # Configuration
│   └── config.go         # (<500 lines)
├── db/                   # Database layer
│   ├── migrations/       # SQL migrations
│   ├── queries/          # SQL queries
│   └── repository.go     # Data access (<500 lines)
├── grpc_server/          # gRPC services
│   ├── handlers/         # Request handlers
│   └── server.go         # Server setup (<500 lines)
├── internal/             # Private packages
│   ├── auth/            # Authentication
│   ├── logger/          # Logging
│   └── middleware/      # Middleware
├── pkg/                  # Public packages
│   └── utils/           # Utilities
└── main.go              # Entry point (<200 lines)
```

### 4. File Organization Guidelines

#### When to Split Files

Split when:
- **File exceeds 500 lines** (mandatory)
- **File exceeds 300 lines** (recommended)
- Multiple unrelated functions exist
- Testing becomes difficult
- Code review is challenging

#### Good File Structure Examples

```go
// ✅ Good: Focused, single responsibility
// apps/api/agent/tools/calculator.go (120 lines)
package tools

type Calculator struct{}

func (c *Calculator) Add(a, b float64) float64 { }
func (c *Calculator) Subtract(a, b float64) float64 { }

// ✅ Good: Separate concerns
// apps/api/grpc_server/handlers/agent_handler.go (200 lines)
// apps/api/grpc_server/handlers/health_handler.go (50 lines)

// ❌ Bad: Everything in one file
// apps/api/grpc_server/server.go (800 lines)
```

### 5. CSR Pattern Implementation

#### Directory Structure for CSR

```
apps/api/
├── domain/              # Business entities
│   ├── agent.go        # Agent entity
│   └── conversation.go # Conversation entity
├── commands/           # Write operations
│   ├── create_agent.go
│   ├── update_agent.go
│   └── delete_agent.go
├── queries/            # Read operations
│   ├── get_agent.go
│   ├── list_agents.go
│   └── search_agents.go
├── handlers/           # Command/Query handlers
│   ├── command_handler.go
│   └── query_handler.go
└── repositories/       # Data access
    ├── agent_repository.go
    └── conversation_repository.go
```

#### Command Pattern Example

```go
// commands/create_conversation.go (<100 lines)
package commands

import "context"

type CreateConversationCommand struct {
    UserID      string
    InitialText string
}

type CreateConversationHandler struct {
    repo ConversationRepository
    bus  EventBus
}

func NewCreateConversationHandler(repo ConversationRepository, bus EventBus) *CreateConversationHandler {
    return &CreateConversationHandler{
        repo: repo,
        bus:  bus,
    }
}

func (h *CreateConversationHandler) Handle(ctx context.Context, cmd CreateConversationCommand) (string, error) {
    conversation := &Conversation{
        ID:     generateID(),
        UserID: cmd.UserID,
        Status: "active",
    }

    if err := h.repo.Save(ctx, conversation); err != nil {
        return "", err
    }

    // Publish event
    h.bus.Publish(ConversationCreatedEvent{
        ConversationID: conversation.ID,
        UserID:         cmd.UserID,
    })

    return conversation.ID, nil
}
```

#### Query Pattern Example

```go
// queries/list_conversations.go (<100 lines)
package queries

import "context"

type ListConversationsQuery struct {
    UserID string
    Limit  int
    Offset int
}

type ConversationDTO struct {
    ID        string
    UserID    string
    CreatedAt time.Time
    Status    string
}

type ListConversationsHandler struct {
    repo ConversationRepository
}

func NewListConversationsHandler(repo ConversationRepository) *ListConversationsHandler {
    return &ListConversationsHandler{repo: repo}
}

func (h *ListConversationsHandler) Handle(ctx context.Context, query ListConversationsQuery) ([]ConversationDTO, error) {
    conversations, err := h.repo.FindByUserID(ctx, query.UserID, query.Limit, query.Offset)
    if err != nil {
        return nil, err
    }

    // Map to DTOs
    dtos := make([]ConversationDTO, len(conversations))
    for i, conv := range conversations {
        dtos[i] = ConversationDTO{
            ID:        conv.ID,
            UserID:    conv.UserID,
            CreatedAt: conv.CreatedAt,
            Status:    conv.Status,
        }
    }

    return dtos, nil
}
```

### 6. Go Best Practices

#### Code Organization
```go
// 1. Package declaration
package handlers

// 2. Imports (grouped: stdlib, external, internal)
import (
    "context"
    "fmt"

    "google.golang.org/grpc"

    "github.com/user/project/internal/auth"
)

// 3. Constants
const (
    MaxRetries = 3
    Timeout    = 30
)

// 4. Types
type Handler struct {
    repo Repository
}

// 5. Constructor
func NewHandler(repo Repository) *Handler {
    return &Handler{repo: repo}
}

// 6. Methods
func (h *Handler) Process(ctx context.Context) error {
    // Implementation
    return nil
}

// 7. Helper functions (unexported)
func validateInput(input string) error {
    // Implementation
    return nil
}
```

#### Error Handling
```go
// ✅ Good: Wrap errors with context
func (h *Handler) GetAgent(id string) (*Agent, error) {
    agent, err := h.repo.Find(id)
    if err != nil {
        return nil, fmt.Errorf("failed to get agent %s: %w", id, err)
    }
    return agent, nil
}

// ✅ Good: Define custom errors
var (
    ErrAgentNotFound = errors.New("agent not found")
    ErrInvalidInput  = errors.New("invalid input")
)

// ✅ Good: Use errors.Is and errors.As
if errors.Is(err, ErrAgentNotFound) {
    // Handle not found
}
```

#### Interface Design
```go
// ✅ Good: Small, focused interfaces
type AgentRepository interface {
    Find(ctx context.Context, id string) (*Agent, error)
    Save(ctx context.Context, agent *Agent) error
}

// ✅ Good: Accept interfaces, return structs
func ProcessAgent(repo AgentRepository) *Result {
    // Implementation
    return &Result{}
}

// ❌ Bad: Large, unfocused interface
type Repository interface {
    FindAgent(id string) (*Agent, error)
    SaveAgent(agent *Agent) error
    FindConversation(id string) (*Conversation, error)
    SaveConversation(conv *Conversation) error
    // ... 20 more methods
}
```

### 7. Dependency Injection

Use constructor injection for better testability:

```go
// domain/agent.go
type Agent struct {
    ID   string
    Name string
}

// repositories/agent_repository.go
type AgentRepository interface {
    Find(ctx context.Context, id string) (*Agent, error)
    Save(ctx context.Context, agent *Agent) error
}

type PostgresAgentRepository struct {
    db *sql.DB
}

func NewPostgresAgentRepository(db *sql.DB) *PostgresAgentRepository {
    return &PostgresAgentRepository{db: db}
}

// commands/create_agent.go
type CreateAgentHandler struct {
    repo AgentRepository
}

func NewCreateAgentHandler(repo AgentRepository) *CreateAgentHandler {
    return &CreateAgentHandler{repo: repo}
}

// main.go - Wire dependencies
func main() {
    db := setupDatabase()
    agentRepo := repositories.NewPostgresAgentRepository(db)
    createHandler := commands.NewCreateAgentHandler(agentRepo)
}
```

### 8. Testing Guidelines

#### Unit Tests
```go
// commands/create_agent_test.go
func TestCreateAgentHandler_Success(t *testing.T) {
    // Arrange
    mockRepo := &MockAgentRepository{}
    handler := NewCreateAgentHandler(mockRepo)
    cmd := CreateAgentCommand{Name: "Test Agent"}

    // Act
    id, err := handler.Handle(context.Background(), cmd)

    // Assert
    assert.NoError(t, err)
    assert.NotEmpty(t, id)
}
```

#### Table-Driven Tests
```go
func TestCalculator_Add(t *testing.T) {
    tests := []struct {
        name string
        a, b float64
        want float64
    }{
        {"positive numbers", 2, 3, 5},
        {"negative numbers", -2, -3, -5},
        {"mixed", -2, 5, 3},
    }

    calc := &Calculator{}
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := calc.Add(tt.a, tt.b)
            if got != tt.want {
                t.Errorf("Add(%v, %v) = %v, want %v", tt.a, tt.b, got, tt.want)
            }
        })
    }
}
```

### 9. Logging

Use structured logging:

```go
import "log/slog"

func (h *Handler) Process(ctx context.Context, req *Request) error {
    slog.Info("processing request",
        slog.String("request_id", req.ID),
        slog.String("user_id", req.UserID),
    )

    if err := h.validate(req); err != nil {
        slog.Error("validation failed",
            slog.String("request_id", req.ID),
            slog.Any("error", err),
        )
        return err
    }

    return nil
}
```

### 10. gRPC Best Practices

#### Service Definition
```protobuf
// Keep proto files focused (<200 lines)
service AgentService {
  rpc CreateAgent(CreateAgentRequest) returns (CreateAgentResponse);
  rpc GetAgent(GetAgentRequest) returns (GetAgentResponse);
  rpc StreamResponse(StreamRequest) returns (stream StreamResponse);
}
```

#### Handler Implementation
```go
// grpc_server/handlers/agent_handler.go (<300 lines)
type AgentHandler struct {
    pb.UnimplementedAgentServiceServer
    createHandler *commands.CreateAgentHandler
    getHandler    *queries.GetAgentHandler
}

func NewAgentHandler(
    createHandler *commands.CreateAgentHandler,
    getHandler *queries.GetAgentHandler,
) *AgentHandler {
    return &AgentHandler{
        createHandler: createHandler,
        getHandler:    getHandler,
    }
}

func (h *AgentHandler) CreateAgent(ctx context.Context, req *pb.CreateAgentRequest) (*pb.CreateAgentResponse, error) {
    cmd := commands.CreateAgentCommand{
        Name:        req.GetName(),
        Description: req.GetDescription(),
    }

    id, err := h.createHandler.Handle(ctx, cmd)
    if err != nil {
        return nil, status.Errorf(codes.Internal, "failed to create agent: %v", err)
    }

    return &pb.CreateAgentResponse{Id: id}, nil
}
```

### 11. Configuration Management

```go
// config/config.go (<200 lines)
package config

import (
    "os"
    "strconv"
)

type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    AI       AIConfig
}

type ServerConfig struct {
    Port int
    Host string
}

type DatabaseConfig struct {
    PooledURL string
    DirectURL string
}

type AIConfig struct {
    OpenAIKey    string
    AnthropicKey string
}

func Load() (*Config, error) {
    return &Config{
        Server: ServerConfig{
            Port: getEnvInt("SERVER_PORT", 8080),
            Host: getEnv("SERVER_HOST", "0.0.0.0"),
        },
        Database: DatabaseConfig{
            PooledURL: getEnv("DATABASE_URL_POOLED", ""),
            DirectURL: getEnv("DATABASE_URL_DIRECT", ""),
        },
        AI: AIConfig{
            OpenAIKey:    getEnv("OPENAI_API_KEY", ""),
            AnthropicKey: getEnv("ANTHROPIC_API_KEY", ""),
        },
    }, nil
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        if intValue, err := strconv.Atoi(value); err == nil {
            return intValue
        }
    }
    return defaultValue
}
```

### 12. Database Patterns

#### Repository Pattern
```go
// repositories/agent_repository.go (<300 lines)
package repositories

type AgentRepository struct {
    db *sql.DB
}

func NewAgentRepository(db *sql.DB) *AgentRepository {
    return &AgentRepository{db: db}
}

func (r *AgentRepository) Find(ctx context.Context, id string) (*domain.Agent, error) {
    query := `SELECT id, name, description, created_at FROM agents WHERE id = $1`

    var agent domain.Agent
    err := r.db.QueryRowContext(ctx, query, id).Scan(
        &agent.ID,
        &agent.Name,
        &agent.Description,
        &agent.CreatedAt,
    )

    if err == sql.ErrNoRows {
        return nil, domain.ErrAgentNotFound
    }

    if err != nil {
        return nil, fmt.Errorf("failed to query agent: %w", err)
    }

    return &agent, nil
}

func (r *AgentRepository) Save(ctx context.Context, agent *domain.Agent) error {
    query := `
        INSERT INTO agents (id, name, description, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET name = $2, description = $3
    `

    _, err := r.db.ExecContext(ctx, query,
        agent.ID,
        agent.Name,
        agent.Description,
        agent.CreatedAt,
    )

    if err != nil {
        return fmt.Errorf("failed to save agent: %w", err)
    }

    return nil
}
```

### 13. Performance Considerations

- Use connection pooling for databases
- Implement context timeouts
- Use buffered channels appropriately
- Profile before optimizing
- Cache frequently accessed data

```go
func (h *Handler) ProcessWithTimeout(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    return h.process(ctx)
}
```

## File Size Checklist

Before committing:
- [ ] No file exceeds 500 lines
- [ ] Related functionality is grouped
- [ ] Commands and queries are separated
- [ ] Interfaces are small and focused
- [ ] Tests are co-located with code

## Summary

- **Modularity**: Keep files under 500 lines
- **CSR Pattern**: Separate commands (writes) from queries (reads)
- **Dependency Injection**: Use constructor injection
- **Error Handling**: Wrap errors with context
- **Testing**: Write table-driven tests
- **Interfaces**: Keep them small and focused
- **Logging**: Use structured logging
- **Performance**: Profile before optimizing

Following these guidelines ensures a scalable, maintainable, and high-performance Go backend.
