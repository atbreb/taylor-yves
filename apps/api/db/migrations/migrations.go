package migrations

import (
	"context"
	"embed"
	"fmt"
	"log"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed *.sql
var migrationsFS embed.FS

// Migration represents a single database migration
type Migration struct {
	Version int
	Name    string
	SQL     string
}

// RunMigrations executes all pending migrations
func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	log.Println("Starting database migrations...")

	// Create migrations tracking table if it doesn't exist
	if err := createMigrationsTable(ctx, pool); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get list of applied migrations
	appliedMigrations, err := getAppliedMigrations(ctx, pool)
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	// Load migration files
	migrations, err := loadMigrations()
	if err != nil {
		return fmt.Errorf("failed to load migrations: %w", err)
	}

	// Sort migrations by version
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})

	// Execute pending migrations
	executed := 0
	for _, migration := range migrations {
		if appliedMigrations[migration.Version] {
			log.Printf("Migration %03d already applied: %s", migration.Version, migration.Name)
			continue
		}

		log.Printf("Applying migration %03d: %s", migration.Version, migration.Name)
		if err := applyMigration(ctx, pool, migration); err != nil {
			return fmt.Errorf("failed to apply migration %03d: %w", migration.Version, err)
		}
		executed++
	}

	if executed == 0 {
		log.Println("No new migrations to apply")
	} else {
		log.Printf("Successfully applied %d migration(s)", executed)
	}

	return nil
}

// createMigrationsTable creates the table to track applied migrations
func createMigrationsTable(ctx context.Context, pool *pgxpool.Pool) error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`
	_, err := pool.Exec(ctx, query)
	return err
}

// getAppliedMigrations returns a map of applied migration versions
func getAppliedMigrations(ctx context.Context, pool *pgxpool.Pool) (map[int]bool, error) {
	query := `SELECT version FROM schema_migrations ORDER BY version`
	rows, err := pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[int]bool)
	for rows.Next() {
		var version int
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		applied[version] = true
	}

	return applied, rows.Err()
}

// loadMigrations reads all migration files from the embedded filesystem
func loadMigrations() ([]Migration, error) {
	entries, err := migrationsFS.ReadDir(".")
	if err != nil {
		return nil, err
	}

	var migrations []Migration
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		// Skip the migrations.go file if it somehow gets included
		if entry.Name() == "migrations.go" {
			continue
		}

		// Parse version from filename (e.g., "001_create_tables.sql" -> 1)
		var version int
		var rest string
		_, err := fmt.Sscanf(entry.Name(), "%d_%s", &version, &rest)
		if err != nil {
			log.Printf("Warning: skipping file with invalid name format: %s", entry.Name())
			continue
		}

		// Read the SQL content
		content, err := migrationsFS.ReadFile(entry.Name())
		if err != nil {
			return nil, fmt.Errorf("failed to read %s: %w", entry.Name(), err)
		}

		// Extract name from filename
		name := strings.TrimSuffix(entry.Name(), filepath.Ext(entry.Name()))

		migrations = append(migrations, Migration{
			Version: version,
			Name:    name,
			SQL:     string(content),
		})
	}

	return migrations, nil
}

// applyMigration executes a single migration within a transaction
func applyMigration(ctx context.Context, pool *pgxpool.Pool, migration Migration) error {
	// Start a transaction
	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Execute the migration SQL
	if _, err := tx.Exec(ctx, migration.SQL); err != nil {
		return fmt.Errorf("failed to execute migration SQL: %w", err)
	}

	// Record the migration as applied
	recordQuery := `
		INSERT INTO schema_migrations (version, name)
		VALUES ($1, $2)
	`
	if _, err := tx.Exec(ctx, recordQuery, migration.Version, migration.Name); err != nil {
		return fmt.Errorf("failed to record migration: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetCurrentVersion returns the latest applied migration version
func GetCurrentVersion(ctx context.Context, pool *pgxpool.Pool) (int, error) {
	query := `SELECT COALESCE(MAX(version), 0) FROM schema_migrations`
	var version int
	err := pool.QueryRow(ctx, query).Scan(&version)
	return version, err
}
