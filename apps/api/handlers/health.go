package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Service   string    `json:"service"`
	Version   string    `json:"version"`
}

// HealthCheck handles the health check endpoint
func HealthCheck(c *gin.Context) {
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().UTC(),
		Service:   "agentic-template-api",
		Version:   "1.0.0",
	}

	c.JSON(http.StatusOK, response)
}

// ReadinessCheck handles the readiness check endpoint
func ReadinessCheck(c *gin.Context) {
	// Add database connectivity check or other readiness checks here
	response := HealthResponse{
		Status:    "ready",
		Timestamp: time.Now().UTC(),
		Service:   "agentic-template-api",
		Version:   "1.0.0",
	}

	c.JSON(http.StatusOK, response)
}