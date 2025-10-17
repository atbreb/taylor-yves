package schema_manager

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// reservedKeywords contains PostgreSQL reserved words that cannot be used as identifiers
// This is a subset of the most common reserved words
var reservedKeywords = map[string]bool{
	"all": true, "analyse": true, "analyze": true, "and": true, "any": true,
	"array": true, "as": true, "asc": true, "asymmetric": true, "both": true,
	"case": true, "cast": true, "check": true, "collate": true, "column": true,
	"constraint": true, "create": true, "current_catalog": true, "current_date": true,
	"current_role": true, "current_time": true, "current_timestamp": true,
	"current_user": true, "default": true, "deferrable": true, "desc": true,
	"distinct": true, "do": true, "else": true, "end": true, "except": true,
	"false": true, "fetch": true, "for": true, "foreign": true, "from": true,
	"grant": true, "group": true, "having": true, "in": true, "initially": true,
	"inner": true, "intersect": true, "into": true, "is": true, "join": true,
	"lateral": true, "leading": true, "left": true, "like": true, "limit": true,
	"localtime": true, "localtimestamp": true, "natural": true, "not": true,
	"null": true, "offset": true, "on": true, "only": true, "or": true,
	"order": true, "outer": true, "overlaps": true, "placing": true, "primary": true,
	"references": true, "returning": true, "right": true, "select": true,
	"session_user": true, "similar": true, "some": true, "symmetric": true,
	"table": true, "then": true, "to": true, "trailing": true, "true": true,
	"union": true, "unique": true, "user": true, "using": true, "variadic": true,
	"when": true, "where": true, "window": true, "with": true,
}

// Regex patterns for validation
var (
	// Allows letters, numbers, and underscores
	validIdentifierPattern = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)
	// Matches multiple underscores in a row
	multipleUnderscoresPattern = regexp.MustCompile(`_{2,}`)
	// Matches non-alphanumeric characters (except underscore)
	nonAlphanumericPattern = regexp.MustCompile(`[^a-zA-Z0-9_]+`)
)

// SanitizeIdentifier takes a user-provided name and converts it to a safe PostgreSQL identifier
// This is the MOST CRITICAL security function - it prevents SQL injection
func SanitizeIdentifier(input string) (string, error) {
	if input == "" {
		return "", fmt.Errorf("identifier cannot be empty")
	}

	// Remove leading and trailing whitespace
	input = strings.TrimSpace(input)

	// Convert to lowercase for consistency
	input = strings.ToLower(input)

	// Replace spaces and hyphens with underscores
	input = strings.ReplaceAll(input, " ", "_")
	input = strings.ReplaceAll(input, "-", "_")

	// Remove any characters that aren't letters, numbers, or underscores
	input = nonAlphanumericPattern.ReplaceAllString(input, "")

	// Collapse multiple underscores into a single underscore
	input = multipleUnderscoresPattern.ReplaceAllString(input, "_")

	// Trim underscores from start and end
	input = strings.Trim(input, "_")

	// Ensure it doesn't start with a number
	if len(input) > 0 && unicode.IsDigit(rune(input[0])) {
		input = "col_" + input
	}

	// Final validation check
	if !validIdentifierPattern.MatchString(input) {
		return "", fmt.Errorf("identifier '%s' contains invalid characters after sanitization", input)
	}

	// Check if it's a reserved keyword
	if reservedKeywords[input] {
		// Append underscore to make it safe
		input = input + "_"
	}

	// Ensure reasonable length (PostgreSQL has a 63-character limit for identifiers)
	if len(input) > 63 {
		input = input[:63]
		// Ensure we didn't cut in the middle of something important
		input = strings.TrimRight(input, "_")
	}

	if input == "" {
		return "", fmt.Errorf("identifier sanitization resulted in empty string")
	}

	return input, nil
}

// SanitizeTableName creates a safe table name with the "user_table_" prefix
func SanitizeTableName(userInput string) (string, error) {
	sanitized, err := SanitizeIdentifier(userInput)
	if err != nil {
		return "", fmt.Errorf("failed to sanitize table name: %w", err)
	}

	// Add prefix to separate user tables from system tables
	tableName := "user_table_" + sanitized

	// Ensure total length is within PostgreSQL limits
	if len(tableName) > 63 {
		// Truncate the user portion, keeping the prefix
		maxUserLength := 63 - len("user_table_")
		if maxUserLength < 1 {
			return "", fmt.Errorf("table name too long even after sanitization")
		}
		sanitized = sanitized[:maxUserLength]
		tableName = "user_table_" + sanitized
	}

	return tableName, nil
}

// ValidateIdentifierSafety performs additional security checks
func ValidateIdentifierSafety(identifier string) error {
	// Check for common SQL injection patterns (defense in depth)
	dangerousPatterns := []string{
		"--", "/*", "*/", ";", "'", "\"", "\\",
		"drop", "delete", "truncate", "alter", "exec", "execute",
	}

	lowerIdent := strings.ToLower(identifier)
	for _, pattern := range dangerousPatterns {
		if strings.Contains(lowerIdent, pattern) {
			return fmt.Errorf("identifier contains potentially dangerous pattern: %s", pattern)
		}
	}

	return nil
}

// IsUserTable checks if a table name follows our user table naming convention
func IsUserTable(tableName string) bool {
	return strings.HasPrefix(tableName, "user_table_")
}

// ExtractUserTableName removes the "user_table_" prefix if present
func ExtractUserTableName(tableName string) string {
	return strings.TrimPrefix(tableName, "user_table_")
}
