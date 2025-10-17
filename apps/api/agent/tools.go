package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"agentic-template/api/db"
	"github.com/tmc/langchaingo/tools"
)

// DatabaseQueryTool is a tool that allows the agent to query the database
type DatabaseQueryTool struct {
	db          *db.DB
	description string
}

// NewDatabaseQueryTool creates a new database query tool
func NewDatabaseQueryTool(database *db.DB) *DatabaseQueryTool {
	return &DatabaseQueryTool{
		db: database,
		description: "Query the database to retrieve information. Input should be a natural language question about the data.",
	}
}

// Name returns the name of the tool
func (t *DatabaseQueryTool) Name() string {
	return "database_query"
}

// Description returns the description of the tool
func (t *DatabaseQueryTool) Description() string {
	return t.description
}

// Call executes the database query based on natural language input
func (t *DatabaseQueryTool) Call(ctx context.Context, input string) (string, error) {
	// For demo purposes, we'll handle some basic query patterns
	// In production, you might want to use an LLM to convert natural language to SQL
	
	query := t.parseNaturalLanguageToSQL(input)
	if query == "" {
		return "", fmt.Errorf("could not understand the query: %s", input)
	}

	// Execute the query
	rows, err := t.db.Pool.Query(ctx, query)
	if err != nil {
		return "", fmt.Errorf("database query failed: %w", err)
	}
	defer rows.Close()

	// Collect results
	var results []map[string]interface{}
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			return "", fmt.Errorf("failed to get row values: %w", err)
		}

		row := make(map[string]interface{})
		for i, col := range rows.FieldDescriptions() {
			row[string(col.Name)] = values[i]
		}
		results = append(results, row)
	}

	// Convert results to JSON for easy reading
	jsonResult, err := json.MarshalIndent(results, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to format results: %w", err)
	}

	if len(results) == 0 {
		return "No results found", nil
	}

	return fmt.Sprintf("Query results (%d rows):\n%s", len(results), string(jsonResult)), nil
}

// parseNaturalLanguageToSQL converts natural language to SQL
// This is a simplified version - in production, use an LLM for this
func (t *DatabaseQueryTool) parseNaturalLanguageToSQL(input string) string {
	input = strings.ToLower(input)

	// Basic pattern matching for common queries
	switch {
	case strings.Contains(input, "count") && strings.Contains(input, "users"):
		return "SELECT COUNT(*) as count FROM users"
	case strings.Contains(input, "list") && strings.Contains(input, "users"):
		return "SELECT * FROM users LIMIT 10"
	case strings.Contains(input, "recent") && strings.Contains(input, "orders"):
		return "SELECT * FROM orders ORDER BY created_at DESC LIMIT 10"
	case strings.Contains(input, "total") && strings.Contains(input, "revenue"):
		return "SELECT SUM(amount) as total_revenue FROM orders"
	default:
		// For demo, return a safe default query
		return "SELECT 'Please be more specific with your query' as message"
	}
}

// CalculatorTool is a simple calculator tool for the agent
type CalculatorTool struct{}

// NewCalculatorTool creates a new calculator tool
func NewCalculatorTool() *CalculatorTool {
	return &CalculatorTool{}
}

// Name returns the name of the tool
func (t *CalculatorTool) Name() string {
	return "calculator"
}

// Description returns the description of the tool
func (t *CalculatorTool) Description() string {
	return "Useful for performing mathematical calculations. Input should be a mathematical expression."
}

// Call performs the calculation
func (t *CalculatorTool) Call(ctx context.Context, input string) (string, error) {
	// For demo purposes, we'll just handle basic operations
	// In production, use a proper expression evaluator
	
	// This is a placeholder - implement proper math evaluation
	return fmt.Sprintf("Calculated result for '%s': [calculation would be performed here]", input), nil
}

// WebSearchTool simulates a web search tool
type WebSearchTool struct{}

// NewWebSearchTool creates a new web search tool
func NewWebSearchTool() *WebSearchTool {
	return &WebSearchTool{}
}

// Name returns the name of the tool
func (t *WebSearchTool) Name() string {
	return "web_search"
}

// Description returns the description of the tool
func (t *WebSearchTool) Description() string {
	return "Search the web for current information. Input should be a search query."
}

// Call performs the web search
func (t *WebSearchTool) Call(ctx context.Context, input string) (string, error) {
	// This is a placeholder - in production, integrate with a search API
	return fmt.Sprintf("Web search results for '%s': [search results would appear here]", input), nil
}

// CreateToolSet creates a standard set of tools for the agent
func CreateToolSet(database *db.DB) []tools.Tool {
	var toolSet []tools.Tool

	// Add database tool if database is available
	if database != nil && database.Pool != nil {
		toolSet = append(toolSet, NewDatabaseQueryTool(database))
	}

	// Add other tools
	toolSet = append(toolSet, NewCalculatorTool())
	toolSet = append(toolSet, NewWebSearchTool())

	return toolSet
}