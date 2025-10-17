-- Migration 001: Create Metadata Schema for Dynamic Table Management
-- This enables users to define custom tables through the UI
-- Created: 2025-10-16

-- ============================================================
-- PART 1: Metadata Tables (Core Schema)
-- ============================================================

-- Table to store definitions of user-created tables
CREATE TABLE IF NOT EXISTS configurable_tables (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- User-friendly name, e.g., "Pricing Groups"
    table_name TEXT NOT NULL UNIQUE, -- Sanitized machine name, e.g., "user_table_pricing_groups"
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by table_name
CREATE INDEX IF NOT EXISTS idx_configurable_tables_table_name ON configurable_tables(table_name);

-- Table to store column definitions for user-created tables
CREATE TABLE IF NOT EXISTS configurable_columns (
    id SERIAL PRIMARY KEY,
    table_id INTEGER NOT NULL REFERENCES configurable_tables(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- User-friendly name, e.g., "Base Price per Sq Ft"
    column_name TEXT NOT NULL, -- Sanitized machine name, e.g., "base_price_per_sq_ft"
    data_type TEXT NOT NULL, -- User-friendly type: 'text', 'text_long', 'number', 'decimal', 'boolean', 'date', 'json'
    postgres_type TEXT NOT NULL, -- Actual PostgreSQL type: 'VARCHAR(255)', 'TEXT', 'INTEGER', 'DECIMAL(18,8)', etc.
    is_nullable BOOLEAN NOT NULL DEFAULT true,
    is_unique BOOLEAN NOT NULL DEFAULT false,
    default_value TEXT, -- Stored as string, will be cast to appropriate type

    -- For relationships (Foreign Keys)
    foreign_key_to_table_id INTEGER REFERENCES configurable_tables(id) ON DELETE SET NULL,

    -- Order for display in UI
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure unique column names within a table
    UNIQUE (table_id, column_name)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_configurable_columns_table_id ON configurable_columns(table_id);
CREATE INDEX IF NOT EXISTS idx_configurable_columns_fk ON configurable_columns(foreign_key_to_table_id);

-- ============================================================
-- PART 2: Audit and History
-- ============================================================

-- Track schema changes for audit purposes
CREATE TABLE IF NOT EXISTS schema_change_log (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES configurable_tables(id) ON DELETE SET NULL,
    change_type TEXT NOT NULL, -- 'CREATE_TABLE', 'ALTER_TABLE', 'DROP_TABLE', 'ADD_COLUMN', 'DROP_COLUMN', 'MODIFY_COLUMN'
    change_details JSONB NOT NULL, -- Full details of what changed
    executed_sql TEXT, -- The actual SQL that was executed (for debugging)
    status TEXT NOT NULL, -- 'SUCCESS', 'FAILED'
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT -- Optional: user ID or system identifier
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_schema_change_log_table_id ON schema_change_log(table_id);
CREATE INDEX IF NOT EXISTS idx_schema_change_log_created_at ON schema_change_log(created_at DESC);

-- ============================================================
-- PART 3: Helper Functions
-- ============================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_configurable_tables_updated_at
    BEFORE UPDATE ON configurable_tables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configurable_columns_updated_at
    BEFORE UPDATE ON configurable_columns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PART 4: Sample Data (Optional - for testing)
-- ============================================================

-- This section can be commented out in production
-- Uncomment to create a sample "Finish Types" table for testing

/*
INSERT INTO configurable_tables (name, table_name, description)
VALUES ('Finish Types', 'user_table_finish_types', 'Different finish options with markup multipliers')
ON CONFLICT (name) DO NOTHING;

INSERT INTO configurable_columns (table_id, name, column_name, data_type, postgres_type, is_nullable, is_unique, display_order)
SELECT
    (SELECT id FROM configurable_tables WHERE table_name = 'user_table_finish_types'),
    'Code',
    'code',
    'text',
    'VARCHAR(50)',
    false,
    true,
    1
WHERE NOT EXISTS (
    SELECT 1 FROM configurable_columns
    WHERE table_id = (SELECT id FROM configurable_tables WHERE table_name = 'user_table_finish_types')
    AND column_name = 'code'
);

INSERT INTO configurable_columns (table_id, name, column_name, data_type, postgres_type, is_nullable, default_value, display_order)
SELECT
    (SELECT id FROM configurable_tables WHERE table_name = 'user_table_finish_types'),
    'Name',
    'name',
    'text',
    'VARCHAR(255)',
    false,
    null,
    2
WHERE NOT EXISTS (
    SELECT 1 FROM configurable_columns
    WHERE table_id = (SELECT id FROM configurable_tables WHERE table_name = 'user_table_finish_types')
    AND column_name = 'name'
);

INSERT INTO configurable_columns (table_id, name, column_name, data_type, postgres_type, is_nullable, default_value, display_order)
SELECT
    (SELECT id FROM configurable_tables WHERE table_name = 'user_table_finish_types'),
    'Markup Multiplier',
    'markup_multiplier',
    'decimal',
    'DECIMAL(18,8)',
    false,
    '1.0',
    3
WHERE NOT EXISTS (
    SELECT 1 FROM configurable_columns
    WHERE table_id = (SELECT id FROM configurable_tables WHERE table_name = 'user_table_finish_types')
    AND column_name = 'markup_multiplier'
);
*/
