package schema_manager

import "time"

// DataType represents the user-friendly data type options
type DataType string

const (
	DataTypeText       DataType = "text"        // Short text (VARCHAR(255))
	DataTypeTextLong   DataType = "text_long"   // Long text (TEXT)
	DataTypeNumber     DataType = "number"      // Integer
	DataTypeDecimal    DataType = "decimal"     // Decimal numbers with precision
	DataTypeBoolean    DataType = "boolean"     // True/False
	DataTypeDate       DataType = "date"        // Date with time and timezone
	DataTypeJSON       DataType = "json"        // JSON data (stored as JSONB)
	DataTypeRelation   DataType = "relation"    // Foreign key to another table
)

// ColumnDefinition represents a column in a user-defined table
type ColumnDefinition struct {
	ID                    int       `json:"id,omitempty"`
	Name                  string    `json:"name"`                      // User-friendly name
	ColumnName            string    `json:"column_name"`               // Sanitized machine name
	DataType              DataType  `json:"data_type"`                 // User-friendly type
	PostgresType          string    `json:"postgres_type,omitempty"`   // Actual PostgreSQL type
	IsNullable            bool      `json:"is_nullable"`
	IsUnique              bool      `json:"is_unique"`
	DefaultValue          *string   `json:"default_value,omitempty"`
	ForeignKeyToTableID   *int      `json:"foreign_key_to_table_id,omitempty"`
	ForeignKeyToTableName *string   `json:"foreign_key_to_table_name,omitempty"`
	DisplayOrder          int       `json:"display_order"`
}

// TableDefinition represents a user-defined table
type TableDefinition struct {
	ID          int                 `json:"id,omitempty"`
	Name        string              `json:"name"`        // User-friendly name
	TableName   string              `json:"table_name"`  // Sanitized machine name
	Description *string             `json:"description,omitempty"`
	Columns     []ColumnDefinition  `json:"columns"`
	CreatedAt   time.Time           `json:"created_at,omitempty"`
	UpdatedAt   time.Time           `json:"updated_at,omitempty"`
}

// SchemaChangeLog represents an audit entry for schema changes
type SchemaChangeLog struct {
	ID            int       `json:"id"`
	TableID       *int      `json:"table_id,omitempty"`
	ChangeType    string    `json:"change_type"`    // CREATE_TABLE, ALTER_TABLE, etc.
	ChangeDetails string    `json:"change_details"` // JSON string
	ExecutedSQL   *string   `json:"executed_sql,omitempty"`
	Status        string    `json:"status"` // SUCCESS, FAILED
	ErrorMessage  *string   `json:"error_message,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	CreatedBy     *string   `json:"created_by,omitempty"`
}

// CreateTableRequest is the request payload for creating a new table
type CreateTableRequest struct {
	Name        string              `json:"name" binding:"required"`
	Description *string             `json:"description,omitempty"`
	Columns     []ColumnDefinition  `json:"columns" binding:"required,min=1"`
}

// UpdateTableRequest is the request payload for updating an existing table
type UpdateTableRequest struct {
	Name        *string             `json:"name,omitempty"`
	Description *string             `json:"description,omitempty"`
	Columns     []ColumnDefinition  `json:"columns,omitempty"`
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationResult holds the result of validation
type ValidationResult struct {
	Valid  bool              `json:"valid"`
	Errors []ValidationError `json:"errors,omitempty"`
}
