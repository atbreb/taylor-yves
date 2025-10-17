package schema_manager

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SchemaManager handles dynamic schema creation and management
type SchemaManager struct {
	pool *pgxpool.Pool
}

// NewSchemaManager creates a new SchemaManager instance
func NewSchemaManager(pool *pgxpool.Pool) *SchemaManager {
	return &SchemaManager{
		pool: pool,
	}
}

// CreateTable creates a new user-defined table based on metadata
func (sm *SchemaManager) CreateTable(ctx context.Context, req CreateTableRequest, createdBy string) (*TableDefinition, error) {
	// 1. Validate the request
	if err := sm.validateCreateTableRequest(req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// 2. Sanitize table name
	sanitizedTableName, err := SanitizeTableName(req.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to sanitize table name: %w", err)
	}

	// 3. Check if table already exists in metadata
	exists, err := sm.tableExists(ctx, sanitizedTableName)
	if err != nil {
		return nil, fmt.Errorf("failed to check table existence: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("table with name '%s' already exists", req.Name)
	}

	// 4. Start a transaction
	tx, err := sm.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 5. Insert into configurable_tables
	var tableID int
	insertTableQuery := `
		INSERT INTO configurable_tables (name, table_name, description)
		VALUES ($1, $2, $3)
		RETURNING id
	`
	err = tx.QueryRow(ctx, insertTableQuery, req.Name, sanitizedTableName, req.Description).Scan(&tableID)
	if err != nil {
		return nil, fmt.Errorf("failed to insert table metadata: %w", err)
	}

	// 6. Process and insert columns
	columns := make([]ColumnDefinition, 0, len(req.Columns))
	for i, col := range req.Columns {
		// Sanitize column name
		sanitizedColName, err := SanitizeIdentifier(col.Name)
		if err != nil {
			return nil, fmt.Errorf("failed to sanitize column name '%s': %w", col.Name, err)
		}

		// Map data type
		pgType, err := MapToPostgresType(col.DataType)
		if err != nil {
			return nil, fmt.Errorf("failed to map data type for column '%s': %w", col.Name, err)
		}

		// Insert column metadata
		insertColQuery := `
			INSERT INTO configurable_columns
			(table_id, name, column_name, data_type, postgres_type, is_nullable, is_unique, default_value, foreign_key_to_table_id, display_order)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING id
		`
		var colID int
		err = tx.QueryRow(ctx, insertColQuery,
			tableID,
			col.Name,
			sanitizedColName,
			col.DataType,
			pgType,
			col.IsNullable,
			col.IsUnique,
			col.DefaultValue,
			col.ForeignKeyToTableID,
			i, // display_order
		).Scan(&colID)

		if err != nil {
			return nil, fmt.Errorf("failed to insert column metadata for '%s': %w", col.Name, err)
		}

		columns = append(columns, ColumnDefinition{
			ID:                  colID,
			Name:                col.Name,
			ColumnName:          sanitizedColName,
			DataType:            col.DataType,
			PostgresType:        pgType,
			IsNullable:          col.IsNullable,
			IsUnique:            col.IsUnique,
			DefaultValue:        col.DefaultValue,
			ForeignKeyToTableID: col.ForeignKeyToTableID,
			DisplayOrder:        i,
		})
	}

	// 7. Build and execute CREATE TABLE SQL
	createTableSQL, err := sm.buildCreateTableSQL(sanitizedTableName, columns)
	if err != nil {
		return nil, fmt.Errorf("failed to build CREATE TABLE SQL: %w", err)
	}

	_, err = tx.Exec(ctx, createTableSQL)
	if err != nil {
		// Log the failed SQL for debugging
		sm.logSchemaChange(ctx, tx, tableID, "CREATE_TABLE", req, &createTableSQL, "FAILED", err.Error(), createdBy)
		return nil, fmt.Errorf("failed to execute CREATE TABLE: %w", err)
	}

	// 8. Log the successful schema change
	if err := sm.logSchemaChange(ctx, tx, tableID, "CREATE_TABLE", req, &createTableSQL, "SUCCESS", "", createdBy); err != nil {
		// Don't fail the transaction, just log the error
		fmt.Printf("Warning: failed to log schema change: %v\n", err)
	}

	// 9. Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// 10. Return the created table definition
	tableDef := &TableDefinition{
		ID:          tableID,
		Name:        req.Name,
		TableName:   sanitizedTableName,
		Description: req.Description,
		Columns:     columns,
	}

	return tableDef, nil
}

// buildCreateTableSQL constructs a safe CREATE TABLE statement
func (sm *SchemaManager) buildCreateTableSQL(tableName string, columns []ColumnDefinition) (string, error) {
	var sb strings.Builder

	// Start the CREATE TABLE statement
	sb.WriteString(fmt.Sprintf("CREATE TABLE %s (\n", tableName))

	// Always add an auto-incrementing primary key
	sb.WriteString("  id SERIAL PRIMARY KEY,\n")

	// Add each column
	for i, col := range columns {
		// Validate one more time
		if err := ValidateIdentifierSafety(col.ColumnName); err != nil {
			return "", fmt.Errorf("column name '%s' failed safety check: %w", col.ColumnName, err)
		}

		// Column name and type
		sb.WriteString(fmt.Sprintf("  %s %s", col.ColumnName, col.PostgresType))

		// NULL constraint
		if !col.IsNullable {
			sb.WriteString(" NOT NULL")
		}

		// UNIQUE constraint
		if col.IsUnique {
			sb.WriteString(" UNIQUE")
		}

		// DEFAULT value
		if col.DefaultValue != nil {
			defaultSQL, err := GetDefaultValueSQL(col.DataType, col.DefaultValue)
			if err != nil {
				return "", fmt.Errorf("invalid default value for column '%s': %w", col.Name, err)
			}
			sb.WriteString(fmt.Sprintf(" DEFAULT %s", defaultSQL))
		}

		// Foreign key constraint (handled separately below)
		if col.ForeignKeyToTableID != nil {
			// We'll add REFERENCES after we query the foreign table name
			// For now, just note it
		}

		// Add comma if not the last column
		if i < len(columns)-1 {
			sb.WriteString(",\n")
		}
	}

	// Add foreign key constraints
	foreignKeys := []string{}
	for _, col := range columns {
		if col.ForeignKeyToTableID != nil {
			// Get the foreign table name
			var foreignTableName string
			query := "SELECT table_name FROM configurable_tables WHERE id = $1"
			err := sm.pool.QueryRow(context.Background(), query, *col.ForeignKeyToTableID).Scan(&foreignTableName)
			if err != nil {
				return "", fmt.Errorf("failed to get foreign table name for column '%s': %w", col.Name, err)
			}

			fkConstraint := fmt.Sprintf(
				"  CONSTRAINT fk_%s_%s FOREIGN KEY (%s) REFERENCES %s(id) ON DELETE SET NULL",
				tableName, col.ColumnName, col.ColumnName, foreignTableName,
			)
			foreignKeys = append(foreignKeys, fkConstraint)
		}
	}

	if len(foreignKeys) > 0 {
		sb.WriteString(",\n")
		sb.WriteString(strings.Join(foreignKeys, ",\n"))
	}

	// Add audit columns
	sb.WriteString(",\n")
	sb.WriteString("  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n")
	sb.WriteString("  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n")

	// Close the CREATE TABLE statement
	sb.WriteString(");")

	// Add trigger for updated_at
	sb.WriteString(fmt.Sprintf(`

CREATE TRIGGER update_%s_updated_at
    BEFORE UPDATE ON %s
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`, tableName, tableName))

	return sb.String(), nil
}

// GetTable retrieves a table definition by ID
func (sm *SchemaManager) GetTable(ctx context.Context, tableID int) (*TableDefinition, error) {
	// Query the table metadata
	var tableDef TableDefinition
	query := `
		SELECT id, name, table_name, description, created_at, updated_at
		FROM configurable_tables
		WHERE id = $1
	`
	err := sm.pool.QueryRow(ctx, query, tableID).Scan(
		&tableDef.ID,
		&tableDef.Name,
		&tableDef.TableName,
		&tableDef.Description,
		&tableDef.CreatedAt,
		&tableDef.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("table not found")
		}
		return nil, fmt.Errorf("failed to query table: %w", err)
	}

	// Query the columns
	columnsQuery := `
		SELECT id, name, column_name, data_type, postgres_type, is_nullable, is_unique,
		       default_value, foreign_key_to_table_id, display_order
		FROM configurable_columns
		WHERE table_id = $1
		ORDER BY display_order
	`
	rows, err := sm.pool.Query(ctx, columnsQuery, tableID)
	if err != nil {
		return nil, fmt.Errorf("failed to query columns: %w", err)
	}
	defer rows.Close()

	columns := []ColumnDefinition{}
	for rows.Next() {
		var col ColumnDefinition
		err := rows.Scan(
			&col.ID,
			&col.Name,
			&col.ColumnName,
			&col.DataType,
			&col.PostgresType,
			&col.IsNullable,
			&col.IsUnique,
			&col.DefaultValue,
			&col.ForeignKeyToTableID,
			&col.DisplayOrder,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan column: %w", err)
		}
		columns = append(columns, col)
	}

	tableDef.Columns = columns
	return &tableDef, nil
}

// ListTables returns all user-defined tables
func (sm *SchemaManager) ListTables(ctx context.Context) ([]TableDefinition, error) {
	query := `
		SELECT id, name, table_name, description, created_at, updated_at
		FROM configurable_tables
		ORDER BY created_at DESC
	`
	rows, err := sm.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query tables: %w", err)
	}
	defer rows.Close()

	tables := []TableDefinition{}
	for rows.Next() {
		var table TableDefinition
		err := rows.Scan(
			&table.ID,
			&table.Name,
			&table.TableName,
			&table.Description,
			&table.CreatedAt,
			&table.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan table: %w", err)
		}
		tables = append(tables, table)
	}

	return tables, nil
}

// tableExists checks if a table with the given name already exists
func (sm *SchemaManager) tableExists(ctx context.Context, tableName string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM configurable_tables WHERE table_name = $1)`
	err := sm.pool.QueryRow(ctx, query, tableName).Scan(&exists)
	return exists, err
}

// logSchemaChange records a schema change in the audit log
func (sm *SchemaManager) logSchemaChange(ctx context.Context, tx pgx.Tx, tableID int, changeType string, details interface{}, sql *string, status, errorMsg, createdBy string) error {
	detailsJSON, err := json.Marshal(details)
	if err != nil {
		return fmt.Errorf("failed to marshal details: %w", err)
	}

	query := `
		INSERT INTO schema_change_log (table_id, change_type, change_details, executed_sql, status, error_message, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	var errMsgPtr *string
	if errorMsg != "" {
		errMsgPtr = &errorMsg
	}

	_, err = tx.Exec(ctx, query, tableID, changeType, string(detailsJSON), sql, status, errMsgPtr, createdBy)
	return err
}

// validateCreateTableRequest validates the table creation request
func (sm *SchemaManager) validateCreateTableRequest(req CreateTableRequest) error {
	if req.Name == "" {
		return fmt.Errorf("table name is required")
	}

	if len(req.Columns) == 0 {
		return fmt.Errorf("at least one column is required")
	}

	// Check for duplicate column names
	columnNames := make(map[string]bool)
	for _, col := range req.Columns {
		if col.Name == "" {
			return fmt.Errorf("column name is required")
		}

		// Validate data type
		if err := ValidateDataType(col.DataType); err != nil {
			return fmt.Errorf("invalid data type for column '%s': %w", col.Name, err)
		}

		// Check for duplicates
		lowerName := strings.ToLower(col.Name)
		if columnNames[lowerName] {
			return fmt.Errorf("duplicate column name: %s", col.Name)
		}
		columnNames[lowerName] = true

		// Validate foreign keys
		if col.DataType == DataTypeRelation {
			if col.ForeignKeyToTableID == nil {
				return fmt.Errorf("column '%s' is a relation but foreign_key_to_table_id is not set", col.Name)
			}
		}
	}

	return nil
}
