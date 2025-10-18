# Dynamic Schema Management System

## Overview

This document describes the **Dynamic Schema Management** system implemented in Taylor-Yves. This system allows users to create and manage database tables dynamically through the UI, transforming the application into a true low-code platform.

## Architecture

### Backend Components

#### 1. Metadata Schema (`apps/api/db/migrations/001_create_metadata_schema.sql`)

Three core metadata tables store the definitions of user-created tables:

- **`configurable_tables`**: Stores table definitions
  - `id`: Primary key
  - `name`: User-friendly table name (e.g., "Pricing Groups")
  - `table_name`: Sanitized machine name (e.g., "user_table_pricing_groups")
  - `description`: Optional description
  - `created_at`, `updated_at`: Timestamps

- **`configurable_columns`**: Stores column definitions
  - `table_id`: Foreign key to `configurable_tables`
  - `name`: User-friendly column name
  - `column_name`: Sanitized machine name
  - `data_type`: User-friendly type (text, number, decimal, etc.)
  - `postgres_type`: Actual PostgreSQL type
  - `is_nullable`, `is_unique`: Constraints
  - `default_value`: Default value as string
  - `foreign_key_to_table_id`: For relationships
  - `display_order`: Order for UI display

- **`schema_change_log`**: Audit trail of all schema changes
  - Tracks every CREATE TABLE, ALTER TABLE, etc.
  - Records success/failure and error messages
  - Stores the actual SQL executed

#### 2. Schema Manager (`apps/api/schema_manager/`)

The SchemaManager is the core service that safely translates metadata into actual database schema changes.

**Key Files:**
- `manager.go`: Main SchemaManager with CreateTable, GetTable, ListTables methods
- `sanitizer.go`: Critical security layer that prevents SQL injection
- `type_mapper.go`: Maps user-friendly types to PostgreSQL types
- `types.go`: Data structures and types

**Security Features:**
- ✅ All identifiers are sanitized using regex patterns
- ✅ Reserved PostgreSQL keywords are automatically escaped
- ✅ SQL is constructed programmatically, never via string interpolation
- ✅ Foreign key validation
- ✅ Data type validation
- ✅ Comprehensive audit logging

#### 3. Data Type Mapping

| User-Friendly Type | PostgreSQL Type | Use Case |
|--------------------|-----------------|----------|
| `text` | `VARCHAR(255)` | Short text (names, codes) |
| `text_long` | `TEXT` | Long text (descriptions) |
| `number` | `INTEGER` | Whole numbers |
| `decimal` | `DECIMAL(18,8)` | Precise numbers (prices, factors) |
| `boolean` | `BOOLEAN` | True/False flags |
| `date` | `TIMESTAMPTZ` | Dates with timezone |
| `json` | `JSONB` | Flexible structured data |
| `relation` | `INTEGER` + `FOREIGN KEY` | Link to another table |

#### 4. gRPC Service (`apps/api/grpc_server/schema_service.go`)

Exposes schema management via gRPC:

**RPCs:**
- `CreateTable`: Create a new user-defined table
- `GetTable`: Retrieve table definition by ID
- `ListTables`: Get all user-defined tables
- `GetDataTypes`: Get available data types with descriptions
- `DeleteTable`: Delete a user-defined table (TODO)

#### 5. Database Migrations (`apps/api/db/migrations/`)

Automatic migration runner:
- Runs on application startup
- Tracks applied migrations in `schema_migrations` table
- Executes migrations in order
- Transactional (rollback on failure)

## Frontend Components (To Be Implemented)

### Planned UI Flow

1. **Table Builder Page** (`/settings/schema/tables/new`)
   - Form to name the table
   - Dynamic column builder with drag-and-drop reordering
   - Data type selector with descriptions
   - Constraint toggles (nullable, unique)
   - Foreign key relationship builder

2. **Column Definition Component**
   - Input for column name
   - Dropdown for data type (with descriptions)
   - Checkboxes for nullable/unique
   - Conditional inputs based on type (e.g., default value)
   - Special UI for relationships (select target table)

3. **Table List Page** (`/settings/schema/tables`)
   - Lists all user-created tables
   - Shows column count, relationships
   - Edit/delete actions

4. **Server Actions** (`apps/web/src/app/actions/schema.ts`)
   - `createTable()`: Calls gRPC CreateTable
   - `listTables()`: Calls gRPC ListTables
   - `getDataTypes()`: Calls gRPC GetDataTypes

## Security Considerations

### SQL Injection Prevention

The system uses **defense in depth**:

1. **Input Sanitization**: All identifiers pass through `SanitizeIdentifier()`
   - Removes non-alphanumeric characters (except underscore)
   - Prevents reserved keywords
   - Enforces PostgreSQL 63-character limit
   - Validates against dangerous patterns

2. **Parameterized Queries**: All data values use parameterized queries
   - Never string interpolation for values
   - Default values are properly escaped

3. **Validation Layer**: Multiple validation checks
   - Data type validation
   - Foreign key existence checks
   - Duplicate column name checks

4. **Audit Logging**: Every schema change is logged
   - Who made the change
   - What SQL was executed
   - Success or failure with error details

### User Table Isolation

All user-created tables are prefixed with `user_table_` to:
- Clearly separate them from system tables
- Prevent accidental conflicts
- Enable easier identification in queries

## Setup Instructions

### Prerequisites

1. **Go 1.21+**: For backend development
2. **PostgreSQL**: Neon or local PostgreSQL 14+
3. **Node.js 18+**: For frontend development
4. **Protocol Buffers Compiler**: For generating gRPC code

### Installation

#### 1. Install Go Dependencies

```bash
cd apps/api
go mod tidy
```

#### 2. Install Go Protobuf Tools

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

Make sure `$GOPATH/bin` is in your PATH:

```bash
export PATH="$PATH:$(go env GOPATH)/bin"
```

#### 3. Generate Protobuf Files

```bash
# From project root
pnpm proto:gen
```

This will generate:
- `apps/api/pb/*.pb.go` (Go gRPC client/server code)
- `apps/web/src/lib/proto/*.ts` (TypeScript client code)

#### 4. Set Up Database

Create a `.env` file in the project root:

```env
DATABASE_URL_POOLED=postgresql://user:password@host/database?sslmode=require
DATABASE_URL_DIRECT=postgresql://user:password@host/database?sslmode=require
```

The migrations will run automatically when you start the API server.

#### 5. Start Development Servers

```bash
# From project root
pnpm dev
```

This starts:
- Next.js frontend on `http://localhost:3000`
- Go API with gRPC on `localhost:50051`
- Go HTTP API on `localhost:8080`

## Testing the Schema Manager

### Using grpcurl (Command Line)

#### 1. Install grpcurl

```bash
brew install grpcurl  # macOS
# OR
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest
```

#### 2. Get Available Data Types

```bash
grpcurl -plaintext \
  -d '{}' \
  localhost:50051 \
  proto.SchemaService/GetDataTypes
```

#### 3. Create a Test Table

```bash
grpcurl -plaintext \
  -d '{
    "name": "Finish Types",
    "description": "Different finish options with markup multipliers",
    "columns": [
      {
        "name": "Code",
        "data_type": "text",
        "is_nullable": false,
        "is_unique": true
      },
      {
        "name": "Name",
        "data_type": "text",
        "is_nullable": false
      },
      {
        "name": "Markup Multiplier",
        "data_type": "decimal",
        "is_nullable": false,
        "default_value": "1.0"
      }
    ]
  }' \
  localhost:50051 \
  proto.SchemaService/CreateTable
```

#### 4. List All Tables

```bash
grpcurl -plaintext \
  -d '{}' \
  localhost:50051 \
  proto.SchemaService/ListTables
```

#### 5. Get Specific Table

```bash
grpcurl -plaintext \
  -d '{"table_id": 1}' \
  localhost:50051 \
  proto.SchemaService/GetTable
```

### Using PostgreSQL (Direct Database Check)

```sql
-- Check metadata
SELECT * FROM configurable_tables;
SELECT * FROM configurable_columns;

-- Check if actual table was created
SELECT * FROM user_table_finish_types;

-- Check audit log
SELECT * FROM schema_change_log;
```

## Future Enhancements

### Phase 1: Core Features (Completed)
- ✅ Metadata schema
- ✅ Schema manager with sanitization
- ✅ gRPC service
- ✅ Data type mapping
- ✅ Audit logging

### Phase 2: UI Development (In Progress)
- ⏳ Table builder page
- ⏳ Column definition component
- ⏳ Server Actions for gRPC calls
- ⏳ Data type selector with descriptions

### Phase 3: Advanced Features (Planned)
- ❌ Table editing (ALTER TABLE operations)
- ❌ Column reordering
- ❌ Index management
- ❌ Data migration tools (for type changes)
- ❌ Table deletion with dependency checking
- ❌ Relationship visualization
- ❌ Schema export/import

### Phase 4: Integration (Planned)
- ❌ Calculation engine integration
- ❌ Automatic variable registration for new tables
- ❌ `lookup_value` operation enhancement
- ❌ Formula builder table selector

## Troubleshooting

### Migrations Not Running

Check the logs when starting the API server:

```
Starting database migrations...
Applying migration 001: 001_create_metadata_schema
Successfully applied 1 migration(s)
```

If migrations fail:
1. Check database connection
2. Ensure PostgreSQL version is 14+
3. Check `schema_migrations` table for applied migrations
4. Review migration SQL syntax

### Protobuf Generation Fails

If `pnpm proto:gen` fails:
1. Ensure Go is installed: `go version`
2. Check protoc-gen-go is installed: `which protoc-gen-go`
3. Verify PATH includes Go bin: `echo $PATH | grep go/bin`
4. Re-install generators: See step 2 in Installation

### Table Creation Fails

Check the `schema_change_log` table for errors:

```sql
SELECT * FROM schema_change_log
WHERE status = 'FAILED'
ORDER BY created_at DESC;
```

Common issues:
- Invalid column names (use only letters, numbers, underscores)
- Reserved keywords (automatically handled by sanitizer)
- Foreign key references non-existent table

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │ Table Builder UI │────────▶│ Server Actions   │          │
│  │   - Form         │        │  - createTable() │          │
│  │   - Columns      │        │  - listTables()  │          │
│  │   - Types        │        │                  │          │
│  └──────────────────┘        └─────────┬────────┘          │
│                                        │                     │
└────────────────────────────────────────┼─────────────────────┘
                                         │
                                         │ gRPC
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Go + gRPC)                     │
│                                                              │
│  ┌────────────────────┐         ┌────────────────────┐     │
│  │ SchemaService      │────────▶│  SchemaManager     │     │
│  │ (gRPC Handler)     │         │  - CreateTable()   │     │
│  └────────────────────┘         │  - GetTable()      │     │
│                                  │  - ListTables()    │     │
│                                  └─────────┬──────────┘     │
│                                           │                 │
│                   ┌───────────────────────┴──────────┐     │
│                   ▼                                  ▼     │
│  ┌────────────────────────┐         ┌──────────────────┐  │
│  │ Sanitizer & Validator  │         │  Type Mapper     │  │
│  │ - SQL Injection Guard  │         │  - User→Postgres │  │
│  └────────────────────────┘         └──────────────────┘  │
│                   │                                        │
└───────────────────┼────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Neon)                         │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────────────┐ │
│  │ Metadata Tables  │         │ User-Created Tables      │ │
│  │ - configurable_* │         │ - user_table_*           │ │
│  │ - schema_change  │         │ - (dynamically created)  │ │
│  └──────────────────┘         └──────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Contributing

When adding features to the schema management system:

1. **Always prioritize security**: Never bypass the sanitizer
2. **Log everything**: Use `schema_change_log` for audit trail
3. **Validate extensively**: Check inputs at multiple layers
4. **Test with malicious inputs**: Try SQL injection patterns
5. **Document data types**: Keep type mappings up to date

## License

This project is part of the Taylor-Yves application.
