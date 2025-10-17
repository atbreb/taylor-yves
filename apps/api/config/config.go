package config

import (
	"os"

	"github.com/joho/godotenv"
)

// Config holds all configuration values for the application
type Config struct {
	HTTPPort           string
	GRPCPort           string
	DatabaseURLPooled  string // Pooled connection for runtime queries
	DatabaseURLDirect  string // Direct connection for migrations
	Environment        string
	OpenAIAPIKey       string
	LogLevel           string
	EnableCORS         bool
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	config := &Config{
		HTTPPort:          getEnv("HTTP_PORT", ":8080"),
		GRPCPort:          getEnv("GO_API_PORT", ":50051"),
		DatabaseURLPooled: getEnv("DATABASE_URL_POOLED", ""),
		DatabaseURLDirect: getEnv("DATABASE_URL_DIRECT", ""),
		Environment:       getEnv("ENVIRONMENT", "development"),
		OpenAIAPIKey:      getEnv("OPENAI_API_KEY", ""),
		LogLevel:          getEnv("LOG_LEVEL", "info"),
		EnableCORS:        getEnv("ENABLE_CORS", "false") == "true",
	}

	return config, nil
}

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}