package schema_manager

import (
	"fmt"
)

// PostgresTypeMapping defines the mapping from user-friendly types to PostgreSQL types
var PostgresTypeMapping = map[DataType]string{
	DataTypeText:     "VARCHAR(255)",
	DataTypeTextLong: "TEXT",
	DataTypeNumber:   "INTEGER",
	DataTypeDecimal:  "DECIMAL(18,8)",
	DataTypeBoolean:  "BOOLEAN",
	DataTypeDate:     "TIMESTAMPTZ",
	DataTypeJSON:     "JSONB",
	// DataTypeRelation is handled specially (becomes INTEGER with FK constraint)
}

// MapToPostgresType converts a user-friendly data type to a PostgreSQL type
func MapToPostgresType(dataType DataType) (string, error) {
	// Special handling for relations
	if dataType == DataTypeRelation {
		return "INTEGER", nil
	}

	pgType, exists := PostgresTypeMapping[dataType]
	if !exists {
		return "", fmt.Errorf("unknown data type: %s", dataType)
	}

	return pgType, nil
}

// ValidateDataType checks if a data type is valid
func ValidateDataType(dataType DataType) error {
	validTypes := map[DataType]bool{
		DataTypeText:     true,
		DataTypeTextLong: true,
		DataTypeNumber:   true,
		DataTypeDecimal:  true,
		DataTypeBoolean:  true,
		DataTypeDate:     true,
		DataTypeJSON:     true,
		DataTypeRelation: true,
	}

	if !validTypes[dataType] {
		return fmt.Errorf("invalid data type: %s", dataType)
	}

	return nil
}

// GetDefaultValueSQL formats a default value for SQL
// This ensures proper escaping and type conversion
func GetDefaultValueSQL(dataType DataType, defaultValue *string) (string, error) {
	if defaultValue == nil {
		return "", nil
	}

	value := *defaultValue

	switch dataType {
	case DataTypeText, DataTypeTextLong:
		// Text values need to be quoted
		// We use PostgreSQL's quote_literal-like behavior
		// For simplicity, we'll just ensure single quotes are escaped
		return fmt.Sprintf("'%s'", escapeString(value)), nil

	case DataTypeNumber:
		// Numbers should be validated but don't need quotes
		return value, nil

	case DataTypeDecimal:
		// Decimals should be validated but don't need quotes
		return value, nil

	case DataTypeBoolean:
		// Convert to PostgreSQL boolean
		switch value {
		case "true", "TRUE", "t", "1", "yes", "YES":
			return "TRUE", nil
		case "false", "FALSE", "f", "0", "no", "NO":
			return "FALSE", nil
		default:
			return "", fmt.Errorf("invalid boolean value: %s", value)
		}

	case DataTypeDate:
		// For dates, we'll accept ISO format strings
		return fmt.Sprintf("'%s'::TIMESTAMPTZ", escapeString(value)), nil

	case DataTypeJSON:
		// JSON needs to be a valid JSON string
		return fmt.Sprintf("'%s'::JSONB", escapeString(value)), nil

	case DataTypeRelation:
		// Relations shouldn't have default values
		return "", fmt.Errorf("relation columns cannot have default values")

	default:
		return "", fmt.Errorf("unsupported data type for default value: %s", dataType)
	}
}

// escapeString escapes single quotes in a string for SQL
func escapeString(s string) string {
	// In PostgreSQL, single quotes are escaped by doubling them
	return escapeStringSingleQuotes(s)
}

// escapeStringSingleQuotes doubles single quotes for SQL escaping
func escapeStringSingleQuotes(s string) string {
	result := ""
	for _, char := range s {
		if char == '\'' {
			result += "''"
		} else {
			result += string(char)
		}
	}
	return result
}

// GetDataTypeDisplayName returns a human-readable name for a data type
func GetDataTypeDisplayName(dataType DataType) string {
	names := map[DataType]string{
		DataTypeText:     "Text (Short)",
		DataTypeTextLong: "Text (Long)",
		DataTypeNumber:   "Number (Integer)",
		DataTypeDecimal:  "Number (Decimal)",
		DataTypeBoolean:  "True/False",
		DataTypeDate:     "Date & Time",
		DataTypeJSON:     "JSON Data",
		DataTypeRelation: "Relationship",
	}

	if name, exists := names[dataType]; exists {
		return name
	}

	return string(dataType)
}

// GetDataTypeDescription returns a description of what each data type is for
func GetDataTypeDescription(dataType DataType) string {
	descriptions := map[DataType]string{
		DataTypeText:     "Short text up to 255 characters (names, codes, descriptions)",
		DataTypeTextLong: "Long text with no length limit (notes, detailed descriptions)",
		DataTypeNumber:   "Whole numbers without decimals (quantities, IDs, counts)",
		DataTypeDecimal:  "Numbers with up to 8 decimal places (prices, percentages, measurements)",
		DataTypeBoolean:  "Yes/No, True/False, On/Off values",
		DataTypeDate:     "Dates and times with timezone support",
		DataTypeJSON:     "Flexible structured data in JSON format",
		DataTypeRelation: "Link to another table (foreign key relationship)",
	}

	if desc, exists := descriptions[dataType]; exists {
		return desc
	}

	return "No description available"
}

// AllDataTypes returns a list of all available data types
func AllDataTypes() []DataType {
	return []DataType{
		DataTypeText,
		DataTypeTextLong,
		DataTypeNumber,
		DataTypeDecimal,
		DataTypeBoolean,
		DataTypeDate,
		DataTypeJSON,
		DataTypeRelation,
	}
}

// DataTypeInfo contains display information for a data type
type DataTypeInfo struct {
	Type        DataType `json:"type"`
	DisplayName string   `json:"display_name"`
	Description string   `json:"description"`
	PostgresType string  `json:"postgres_type"`
}

// GetAllDataTypeInfo returns information about all data types
func GetAllDataTypeInfo() []DataTypeInfo {
	types := AllDataTypes()
	result := make([]DataTypeInfo, 0, len(types))

	for _, dt := range types {
		pgType, _ := MapToPostgresType(dt)
		result = append(result, DataTypeInfo{
			Type:         dt,
			DisplayName:  GetDataTypeDisplayName(dt),
			Description:  GetDataTypeDescription(dt),
			PostgresType: pgType,
		})
	}

	return result
}
