package db

import (
	"context"
	"fmt"
	"os"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

// Manager handles the database connection and provides hot-reload functionality
type Manager struct {
	mu       sync.RWMutex
	database *DB
	pooledURL string
	directURL string
}

// Global database manager instance
var globalManager *Manager
var once sync.Once

// GetManager returns the singleton database manager
func GetManager() *Manager {
	once.Do(func() {
		globalManager = &Manager{}
	})
	return globalManager
}

// Initialize sets up the initial database connection
func (m *Manager) Initialize(pooledURL, directURL string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.pooledURL = pooledURL
	m.directURL = directURL

	if pooledURL == "" {
		return fmt.Errorf("database URL is required")
	}

	db, err := NewConnection(pooledURL)
	if err != nil {
		return err
	}

	m.database = db
	return nil
}

// Reload reloads the database connection by reading the latest env vars
func (m *Manager) Reload() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Reload environment variables from .env file
	if err := godotenv.Load(); err != nil {
		return fmt.Errorf("failed to reload .env file: %w", err)
	}

	pooledURL := os.Getenv("DATABASE_URL_POOLED")
	if pooledURL == "" {
		return fmt.Errorf("DATABASE_URL_POOLED not found in environment")
	}

	// Close existing connection if any
	if m.database != nil && m.database.Pool != nil {
		m.database.Close()
	}

	// Create new connection
	db, err := NewConnection(pooledURL)
	if err != nil {
		return fmt.Errorf("failed to create new database connection: %w", err)
	}

	m.database = db
	m.pooledURL = pooledURL
	m.directURL = os.Getenv("DATABASE_URL_DIRECT")

	return nil
}

// GetDB returns the current database connection
func (m *Manager) GetDB() *DB {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.database
}

// GetPool returns the current database pool
func (m *Manager) GetPool() *pgxpool.Pool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if m.database == nil {
		return nil
	}
	return m.database.Pool
}

// GetDatabaseInfo returns information about the current database connection
func (m *Manager) GetDatabaseInfo(ctx context.Context) (string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.database == nil || m.database.Pool == nil {
		return "", fmt.Errorf("database not connected")
	}

	// Query database version
	var version string
	err := m.database.Pool.QueryRow(ctx, "SELECT version()").Scan(&version)
	if err != nil {
		return "", fmt.Errorf("failed to query database version: %w", err)
	}

	return version, nil
}

// Health checks the health of the current database connection
func (m *Manager) Health(ctx context.Context) error {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.database == nil {
		return fmt.Errorf("database not initialized")
	}

	return m.database.Health(ctx)
}

// Close closes the database connection
func (m *Manager) Close() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.database != nil {
		m.database.Close()
	}
}
