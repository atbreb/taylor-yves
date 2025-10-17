package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"agentic-template/api/config"
	"agentic-template/api/db"
	"agentic-template/api/grpc_server"
	"agentic-template/api/handlers"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database connection (using pooled connection for runtime)
	database, err := db.NewConnection(cfg.DatabaseURLPooled)
	if err != nil {
		log.Printf("Warning: Failed to connect to database: %v", err)
		// Continue without database for now
		database = &db.DB{}
	} else {
		defer database.Close()
	}

	// Setup Gin router
	router := gin.Default()
	
	// Health check endpoint
	router.GET("/health", handlers.HealthCheck)
	
	// Create HTTP server
	httpServer := &http.Server{
		Addr:    cfg.HTTPPort,
		Handler: router,
	}

	// Create gRPC server
	grpcServer := grpc.NewServer()
	grpc_server.RegisterServices(grpcServer, database)

	// Start gRPC server in a goroutine
	go func() {
		listener, err := net.Listen("tcp", cfg.GRPCPort)
		if err != nil {
			log.Fatalf("Failed to listen on gRPC port %s: %v", cfg.GRPCPort, err)
		}
		log.Printf("gRPC server starting on port %s", cfg.GRPCPort)
		if err := grpcServer.Serve(listener); err != nil {
			log.Fatalf("Failed to serve gRPC: %v", err)
		}
	}()

	// Start HTTP server in a goroutine
	go func() {
		log.Printf("HTTP server starting on port %s", cfg.HTTPPort)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start HTTP server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down servers...")

	// Give outstanding requests a deadline for completion
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Shutdown HTTP server
	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("HTTP server forced to shutdown: %v", err)
	}

	// Shutdown gRPC server
	grpcServer.GracefulStop()

	log.Println("Servers shutdown complete")
}