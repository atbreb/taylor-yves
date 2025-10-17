package grpc_server

import (
	"context"
	"log"

	"agentic-template/api/db"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Server holds the gRPC server dependencies
type Server struct {
	db *db.DB
}

// NewServer creates a new gRPC server instance
func NewServer(database *db.DB) *Server {
	return &Server{
		db: database,
	}
}

// RegisterServices registers all gRPC services with the server
func RegisterServices(grpcServer *grpc.Server, database *db.DB) {
	server := NewServer(database)
	
	// Register the Agent Service
	// Note: This will be registered from agent_service.go
	// pb.RegisterAgentServiceServer(grpcServer, agentService)
	
	log.Println("gRPC services registered")
}

// Example health check method for gRPC
func (s *Server) HealthCheck(ctx context.Context, req interface{}) (interface{}, error) {
	if err := s.db.HealthCheck(); err != nil {
		return nil, status.Errorf(codes.Unavailable, "database health check failed: %v", err)
	}
	
	return map[string]string{"status": "healthy"}, nil
}