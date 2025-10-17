package grpc_server

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"agentic-template/api/agent"
	"agentic-template/api/config"
	"agentic-template/api/db"
	pb "agentic-template/api/pb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// AgentServiceServer implements the gRPC AgentService
type AgentServiceServer struct {
	pb.UnimplementedAgentServiceServer
	db     *db.DB
	config *config.Config
}

// NewAgentServiceServer creates a new agent service server
func NewAgentServiceServer(database *db.DB, cfg *config.Config) *AgentServiceServer {
	return &AgentServiceServer{
		db:     database,
		config: cfg,
	}
}

// StreamAgentResponse implements the streaming RPC for agent responses
func (s *AgentServiceServer) StreamAgentResponse(
	req *pb.AgentRequest,
	stream pb.AgentService_StreamAgentResponseServer,
) error {
	ctx := stream.Context()
	
	// Validate request
	if req.Query == "" {
		return status.Error(codes.InvalidArgument, "query cannot be empty")
	}

	// Determine which provider to use (can be specified in metadata or use default)
	provider := "openai" // Default provider
	if metaProvider, ok := req.Metadata["provider"]; ok {
		provider = metaProvider
	}

	// Get API key for the provider
	apiKey := s.getAPIKey(provider)
	if apiKey == "" {
		return status.Errorf(codes.FailedPrecondition, "API key not configured for provider: %s", provider)
	}

	// Create agent configuration
	agentConfig := agent.Config{
		Provider:    provider,
		APIKey:      apiKey,
		Model:       "", // Will use default for provider
		Temperature: 0.7,
		MaxTokens:   2000,
	}

	// Create the agent
	ai, err := agent.NewAgent(agentConfig)
	if err != nil {
		log.Printf("Failed to create agent: %v", err)
		return status.Errorf(codes.Internal, "failed to create agent: %v", err)
	}

	// Add tools to the agent
	tools := agent.CreateToolSet(s.db)
	for _, tool := range tools {
		ai.AddTool(tool)
	}

	// Initialize the agent
	if err := ai.Initialize(); err != nil {
		log.Printf("Failed to initialize agent: %v", err)
		return status.Errorf(codes.Internal, "failed to initialize agent: %v", err)
	}

	// Send initial thinking message
	if err := s.sendThought(stream, "Processing your request..."); err != nil {
		return err
	}

	// Create channels for streaming
	responseChan := make(chan string, 100)
	errorChan := make(chan error, 1)
	toolCallChan := make(chan *pb.ToolCall, 10)

	// Run the agent in a goroutine with streaming
	go func() {
		defer close(responseChan)
		defer close(toolCallChan)

		// Simulate the stateful agentic loop
		maxIterations := 5
		for i := 0; i < maxIterations; i++ {
			// Check if we should continue
			select {
			case <-ctx.Done():
				errorChan <- ctx.Err()
				return
			default:
			}

			// Run one iteration of the agent
			iterationInput := req.Query
			if i > 0 {
				iterationInput = "Continue with the previous task"
			}

			// Execute with streaming callback
			err := ai.RunWithCallback(ctx, iterationInput, func(chunk string) error {
				// Send each chunk to the response channel
				select {
				case responseChan <- chunk:
					return nil
				case <-ctx.Done():
					return ctx.Err()
				}
			})

			if err != nil {
				// Check if this is a tool call
				if strings.Contains(err.Error(), "tool:") {
					// Parse tool call and send it
					toolCall := s.parseToolCall(err.Error())
					if toolCall != nil {
						select {
						case toolCallChan <- toolCall:
						case <-ctx.Done():
							errorChan <- ctx.Err()
							return
						}
					}
				} else if strings.Contains(err.Error(), "complete") {
					// Agent has completed
					break
				} else {
					// Actual error
					errorChan <- err
					return
				}
			} else {
				// No error means the agent has completed
				break
			}
		}
	}()

	// Stream responses back to client
	for {
		select {
		case chunk, ok := <-responseChan:
			if !ok {
				// Channel closed, we're done
				if err := s.sendDone(stream); err != nil {
					return err
				}
				return nil
			}
			
			// Send chunk to client
			if err := s.sendChunk(stream, chunk); err != nil {
				return err
			}

		case toolCall := <-toolCallChan:
			// Send tool call information
			if err := s.sendToolCall(stream, toolCall); err != nil {
				return err
			}

		case err := <-errorChan:
			// Send error to client
			if err := s.sendError(stream, err.Error()); err != nil {
				return err
			}
			return nil

		case <-ctx.Done():
			// Context cancelled
			return ctx.Err()
		}
	}
}

// Helper functions for sending different types of responses

func (s *AgentServiceServer) sendChunk(stream pb.AgentService_StreamAgentResponseServer, chunk string) error {
	return stream.Send(&pb.AgentResponse{
		Event:     &pb.AgentResponse_Chunk{Chunk: chunk},
		Timestamp: time.Now().Unix(),
	})
}

func (s *AgentServiceServer) sendToolCall(stream pb.AgentService_StreamAgentResponseServer, toolCall *pb.ToolCall) error {
	return stream.Send(&pb.AgentResponse{
		Event:     &pb.AgentResponse_ToolCall{ToolCall: toolCall},
		Timestamp: time.Now().Unix(),
	})
}

func (s *AgentServiceServer) sendThought(stream pb.AgentService_StreamAgentResponseServer, thought string) error {
	return stream.Send(&pb.AgentResponse{
		Event:     &pb.AgentResponse_Thought{Thought: thought},
		Timestamp: time.Now().Unix(),
	})
}

func (s *AgentServiceServer) sendError(stream pb.AgentService_StreamAgentResponseServer, errorMsg string) error {
	return stream.Send(&pb.AgentResponse{
		Event:     &pb.AgentResponse_Error{Error: errorMsg},
		Timestamp: time.Now().Unix(),
	})
}

func (s *AgentServiceServer) sendDone(stream pb.AgentService_StreamAgentResponseServer) error {
	return stream.Send(&pb.AgentResponse{
		Event:     &pb.AgentResponse_Done{Done: true},
		Timestamp: time.Now().Unix(),
	})
}

// getAPIKey retrieves the API key for the specified provider
func (s *AgentServiceServer) getAPIKey(provider string) string {
	switch strings.ToLower(provider) {
	case "openai":
		return s.config.OpenAIAPIKey
	case "anthropic":
		// Add to config if needed
		return ""
	case "google":
		// Add to config if needed
		return ""
	default:
		return ""
	}
}

// parseToolCall attempts to parse tool call information from an error message
func (s *AgentServiceServer) parseToolCall(errMsg string) *pb.ToolCall {
	// This is a simplified parser - enhance based on actual tool call format
	if strings.Contains(errMsg, "tool:") {
		parts := strings.Split(errMsg, ":")
		if len(parts) >= 2 {
			return &pb.ToolCall{
				ToolName:   strings.TrimSpace(parts[1]),
				ToolInput:  "Tool input would be here",
				ToolOutput: "Tool output would be here",
				Status:     "executing",
			}
		}
	}
	return nil
}