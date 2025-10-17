package grpc_server

import (
	"context"
	"log"

	"agentic-template/api/db"
	"agentic-template/api/pb"

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
	// Register the Schema Management Service
	schemaService := NewSchemaServiceServer(database)
	pb.RegisterSchemaServiceServer(grpcServer, schemaService)

	log.Println("gRPC services registered (SchemaService active)")
}

// Example health check method for gRPC
func (s *Server) HealthCheck(ctx context.Context, req interface{}) (interface{}, error) {
	if err := s.db.Health(ctx); err != nil {
		return nil, status.Errorf(codes.Unavailable, "database health check failed: %v", err)
	}

	return map[string]string{"status": "healthy"}, nil
}