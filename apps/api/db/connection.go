package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps the database connection pool
type DB struct {
	Pool *pgxpool.Pool
}

// NewConnection creates a new database connection pool
// Uses the pooled connection string for runtime queries
func NewConnection(databaseURL string) (*DB, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("database URL is required")
	}

	// Parse the connection string and create a config
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	// Configure connection pool settings
	config.MaxConns = 20
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = time.Minute * 30
	config.HealthCheckPeriod = time.Minute
	config.ConnConfig.ConnectTimeout = time.Second * 5

	// Create the connection pool
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test the connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{Pool: pool}, nil
}

// NewDirectConnection creates a direct database connection for migrations
// Uses the direct connection string (no pooler)
func NewDirectConnection(databaseURL string) (*DB, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("direct database URL is required")
	}

	// Parse the connection string
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse direct database URL: %w", err)
	}

	// Use minimal pool settings for migration connection
	config.MaxConns = 2
	config.MinConns = 1

	// Create the connection pool
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create direct connection: %w", err)
	}

	// Test the connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database (direct): %w", err)
	}

	return &DB{Pool: pool}, nil
}

// Close closes the database connection pool
func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

// Health checks the health of the database connection
func (db *DB) Health(ctx context.Context) error {
	if db.Pool == nil {
		return fmt.Errorf("database pool is nil")
	}

	// Acquire a connection from the pool
	conn, err := db.Pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("failed to acquire connection: %w", err)
	}
	defer conn.Release()

	// Execute a simple query
	var result int
	err = conn.QueryRow(ctx, "SELECT 1").Scan(&result)
	if err != nil {
		return fmt.Errorf("health check query failed: %w", err)
	}

	if result != 1 {
		return fmt.Errorf("unexpected health check result: %d", result)
	}

	return nil
}

// Stats returns the current pool statistics
func (db *DB) Stats() *pgxpool.Stat {
	if db.Pool == nil {
		return nil
	}
	return db.Pool.Stat()
}