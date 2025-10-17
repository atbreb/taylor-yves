package agent

import (
	"context"
	"fmt"
	"strings"

	"github.com/tmc/langchaingo/agents"
	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/anthropic"
	"github.com/tmc/langchaingo/llms/googleai"
	"github.com/tmc/langchaingo/llms/openai"
	"github.com/tmc/langchaingo/memory"
	"github.com/tmc/langchaingo/schema"
	"github.com/tmc/langchaingo/tools"
)

// Agent represents an AI agent with tools and memory
type Agent struct {
	llm      llms.Model
	memory   schema.Memory
	tools    []tools.Tool
	executor *agents.Executor
	provider string
}

// Config holds agent configuration
type Config struct {
	Provider     string
	APIKey       string
	Model        string
	Temperature  float64
	MaxTokens    int
	StreamingFunc func(ctx context.Context, chunk []byte) error
}

// NewAgent creates a new AI agent with the specified configuration
func NewAgent(cfg Config) (*Agent, error) {
	// Create LLM based on provider
	var llm llms.Model
	var err error

	switch strings.ToLower(cfg.Provider) {
	case "openai":
		llm, err = openai.New(
			openai.WithToken(cfg.APIKey),
			openai.WithModel(getModelName(cfg.Provider, cfg.Model)),
		)
	case "anthropic":
		llm, err = anthropic.New(
			anthropic.WithToken(cfg.APIKey),
			anthropic.WithModel(getModelName(cfg.Provider, cfg.Model)),
		)
	case "google":
		llm, err = googleai.New(
			context.Background(),
			googleai.WithAPIKey(cfg.APIKey),
			googleai.WithDefaultModel(getModelName(cfg.Provider, cfg.Model)),
		)
	default:
		return nil, fmt.Errorf("unsupported provider: %s", cfg.Provider)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create LLM: %w", err)
	}

	// Create conversation memory
	mem := memory.NewConversationBuffer()

	// Create agent
	agent := &Agent{
		llm:      llm,
		memory:   mem,
		tools:    []tools.Tool{},
		provider: cfg.Provider,
	}

	return agent, nil
}

// getModelName returns the appropriate model name for each provider
func getModelName(provider, model string) string {
	if model != "" {
		return model
	}

	// Default models for each provider
	switch strings.ToLower(provider) {
	case "openai":
		return "gpt-4-turbo-preview"
	case "anthropic":
		return "claude-3-opus-20240229"
	case "google":
		return "gemini-pro"
	default:
		return ""
	}
}

// AddTool adds a tool to the agent
func (a *Agent) AddTool(tool tools.Tool) {
	a.tools = append(a.tools, tool)
}

// Initialize creates the agent executor
func (a *Agent) Initialize() error {
	if len(a.tools) == 0 {
		return fmt.Errorf("no tools added to agent")
	}

	// Create the agent executor based on provider
	var executor *agents.Executor
	var err error

	switch a.provider {
	case "openai":
		// Use OpenAI Functions agent for OpenAI models
		agentInstance := agents.NewOpenAIFunctionsAgent(
			a.llm,
			a.tools,
			agents.WithMaxIterations(10),
		)
		executor = agents.NewExecutor(
			agentInstance,
			a.tools,
			agents.WithMemory(a.memory),
		)
	default:
		// Use conversational agent for other providers
		agentInstance := agents.NewConversationalAgent(
			a.llm,
			a.tools,
		)
		executor = agents.NewExecutor(
			agentInstance,
			a.tools,
			agents.WithMemory(a.memory),
		)
	}

	if err != nil {
		return fmt.Errorf("failed to create agent executor: %w", err)
	}

	a.executor = executor
	return nil
}

// Run executes the agent with the given input
func (a *Agent) Run(ctx context.Context, input string) (string, error) {
	if a.executor == nil {
		return "", fmt.Errorf("agent not initialized")
	}

	result, err := chains.Run(ctx, a.executor, input)
	if err != nil {
		return "", fmt.Errorf("agent execution failed: %w", err)
	}

	return result, nil
}

// RunWithCallback executes the agent with streaming callback
func (a *Agent) RunWithCallback(
	ctx context.Context,
	input string,
	callback func(string) error,
) error {
	if a.executor == nil {
		return fmt.Errorf("agent not initialized")
	}

	// Create a custom chain with callback
	chain := chains.NewChain(a.executor)
	
	// Run the chain with streaming
	_, err := chain.Call(ctx, map[string]any{
		"input": input,
	}, chains.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
		return callback(string(chunk))
	}))

	return err
}

// GetMemory returns the agent's conversation memory
func (a *Agent) GetMemory() schema.Memory {
	return a.memory
}

// ClearMemory clears the agent's conversation memory
func (a *Agent) ClearMemory() {
	a.memory.Clear()
}

// GetTools returns the agent's tools
func (a *Agent) GetTools() []tools.Tool {
	return a.tools
}