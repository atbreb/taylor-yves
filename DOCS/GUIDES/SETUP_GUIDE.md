# Taylor-Yves Setup Guide

This guide will walk you through setting up the Taylor-Yves project with the new Dynamic Schema Management system.

## Quick Start Checklist

- [ ] Install Go 1.21+
- [ ] Install Protocol Buffers compiler
- [ ] Install Go protobuf tools
- [ ] Set up Neon PostgreSQL database
- [ ] Configure environment variables
- [ ] Generate protobuf files
- [ ] Run migrations
- [ ] Start development servers

## Detailed Setup Instructions

### 1. Install Go

#### macOS

```bash
brew install go
```

#### Linux

```bash
# Download from https://go.dev/dl/
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
```

#### Windows

Download and install from: https://go.dev/dl/

#### Verify Installation

```bash
go version
# Should output: go version go1.21.x ...
```

### 2. Install Protocol Buffers Compiler

#### macOS

```bash
brew install protobuf
```

#### Linux

```bash
sudo apt-get install -y protobuf-compiler
```

#### Windows

Download from: https://github.com/protocolbuffers/protobuf/releases

#### Verify Installation

```bash
protoc --version
# Should output: libprotoc 3.x.x or higher
```

### 3. Install Go Protobuf Tools

```bash
# Install protoc-gen-go (generates Go structs)
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest

# Install protoc-gen-go-grpc (generates gRPC service code)
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

#### Add Go bin to PATH

Add to your `~/.bashrc`, `~/.zshrc`, or equivalent:

```bash
export PATH="$PATH:$(go env GOPATH)/bin"
```

Then reload:

```bash
source ~/.zshrc  # or source ~/.bashrc
```

#### Verify Installation

```bash
which protoc-gen-go
# Should output: /Users/yourusername/go/bin/protoc-gen-go

which protoc-gen-go-grpc
# Should output: /Users/yourusername/go/bin/protoc-gen-go-grpc
```

### 4. Set Up Neon PostgreSQL Database

#### Create a Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project

#### Get Connection Strings

Neon provides two connection strings:

1. **Pooled Connection** (for application runtime)
   - Uses connection pooling
   - Format: `postgresql://user:pass@host-pooler.region.neon.tech/db?sslmode=require`

2. **Direct Connection** (for migrations)
   - Direct database access
   - Format: `postgresql://user:pass@host.region.neon.tech/db?sslmode=require`

#### Alternative: Local PostgreSQL

If you prefer local development:

```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Linux
sudo apt-get install postgresql-14
sudo systemctl start postgresql

# Create database
createdb taylor_yves
```

Connection string:
```
postgresql://localhost/taylor_yves?sslmode=disable
```

### 5. Configure Environment Variables

#### Option 1: Using .env File

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL_POOLED=postgresql://user:password@host-pooler.region.neon.tech/taylor_yves?sslmode=require
DATABASE_URL_DIRECT=postgresql://user:password@host.region.neon.tech/taylor_yves?sslmode=require

# Encryption Key (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your_64_character_hex_string_here

# Server Ports
HTTP_PORT=:8080
GRPC_PORT=:50051

# Optional: AI API Keys (can also be set via UI at /settings/environment)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
META_API_KEY=...
```

#### Option 2: Using Environment Management UI

1. Start the app without API keys
2. Navigate to `http://localhost:3000/settings/environment`
3. Add your API keys through the secure web interface

#### Generate Encryption Key

```bash
openssl rand -hex 32
```

### 6. Install Project Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Install Go dependencies
cd apps/api
go mod tidy
cd ../..
```

### 7. Generate Protobuf Files

```bash
# From project root
pnpm proto:gen
```

This command:
1. Generates Go code in `apps/api/pb/`
2. Generates TypeScript code in `apps/web/src/lib/proto/`

You should see output like:

```
> agentic-template@0.0.0 proto:gen
> npm run proto:gen:go && npm run proto:gen:ts

> agentic-template@0.0.0 proto:gen:go
> protoc --go_out=./apps/api --go_opt=paths=source_relative...

> agentic-template@0.0.0 proto:gen:ts
> protoc --plugin=protoc-gen-ts=...
```

### 8. Build the Go API

```bash
cd apps/api
go build -o ../../bin/api .
cd ../..
```

Or run directly:

```bash
cd apps/api
go run main.go
```

### 9. Start Development Servers

#### Option 1: Run Everything Together

```bash
# From project root
pnpm dev
```

This starts:
- Next.js frontend: `http://localhost:3000`
- Go API (HTTP): `http://localhost:8080`
- Go API (gRPC): `localhost:50051`

#### Option 2: Run Separately

Terminal 1 (Go API):
```bash
cd apps/api
go run main.go
```

Terminal 2 (Next.js):
```bash
cd apps/web
pnpm dev
```

### 10. Verify Setup

#### Check API Health

```bash
curl http://localhost:8080/health
# Should return: {"status":"healthy"}
```

#### Check Database Migrations

Look for this in the API server logs:

```
Starting database migrations...
Applying migration 001: 001_create_metadata_schema
Successfully applied 1 migration(s)
```

#### Check Frontend

Open `http://localhost:3000` in your browser. You should see the dashboard.

## Testing the Schema Management System

### 1. Install grpcurl (for testing gRPC endpoints)

```bash
# macOS
brew install grpcurl

# Linux
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# Windows
choco install grpcurl
```

### 2. Test Data Types Endpoint

```bash
grpcurl -plaintext \
  -d '{}' \
  localhost:50051 \
  proto.SchemaService/GetDataTypes
```

Expected response:

```json
{
  "success": true,
  "dataTypes": [
    {
      "type": "text",
      "displayName": "Text (Short)",
      "description": "Short text up to 255 characters",
      "postgresType": "VARCHAR(255)"
    },
    ...
  ]
}
```

### 3. Create a Test Table

```bash
grpcurl -plaintext \
  -d '{
    "name": "Test Products",
    "description": "A test table for products",
    "columns": [
      {
        "name": "Product Name",
        "data_type": "text",
        "is_nullable": false
      },
      {
        "name": "Price",
        "data_type": "decimal",
        "is_nullable": false,
        "default_value": "0.00"
      },
      {
        "name": "In Stock",
        "data_type": "boolean",
        "is_nullable": false,
        "default_value": "true"
      }
    ]
  }' \
  localhost:50051 \
  proto.SchemaService/CreateTable
```

Expected response:

```json
{
  "success": true,
  "message": "Table 'Test Products' created successfully",
  "table": {
    "id": 1,
    "name": "Test Products",
    "tableName": "user_table_test_products",
    ...
  }
}
```

### 4. Verify in Database

```bash
# Connect to your database
psql $DATABASE_URL_DIRECT

# Check metadata
\dt
SELECT * FROM configurable_tables;
SELECT * FROM configurable_columns;

# Check if actual table was created
\d user_table_test_products
SELECT * FROM user_table_test_products;

# Check audit log
SELECT * FROM schema_change_log ORDER BY created_at DESC;
```

## Troubleshooting

### Issue: `protoc-gen-go: program not found`

**Solution:**

1. Install the tools:
   ```bash
   go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
   go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
   ```

2. Add to PATH:
   ```bash
   export PATH="$PATH:$(go env GOPATH)/bin"
   ```

3. Verify:
   ```bash
   which protoc-gen-go
   ```

### Issue: Database connection fails

**Check:**

1. Connection string is correct
2. Database exists
3. Network access (Neon requires internet)
4. SSL mode is set correctly

**Test connection:**

```bash
psql "$DATABASE_URL_DIRECT"
```

### Issue: Migrations don't run

**Check server logs:**

```
Starting database migrations...
```

If missing:
1. Ensure `DATABASE_URL_POOLED` is set
2. Check database permissions
3. Verify migrations files exist in `apps/api/db/migrations/`

**Force re-run:**

```sql
-- Connect to database
DELETE FROM schema_migrations WHERE version = 1;
-- Restart API server
```

### Issue: Port already in use

**Change ports in `.env`:**

```env
HTTP_PORT=:8081
GRPC_PORT=:50052
```

**Or kill existing process:**

```bash
# Find process
lsof -i :8080
lsof -i :50051

# Kill process
kill -9 <PID>
```

### Issue: Go modules not found

**Solution:**

```bash
cd apps/api
go mod tidy
go mod download
```

### Issue: pnpm not found

**Install pnpm:**

```bash
npm install -g pnpm
```

## Next Steps

Now that your environment is set up, you can:

1. **Explore the API**: See [DYNAMIC_SCHEMA_README.md](./DYNAMIC_SCHEMA_README.md)
2. **Build the UI**: Create the Table Builder interface (in progress)
3. **Test schema creation**: Use grpcurl to create tables
4. **Integrate with calculations**: Connect to the calculation engine

## Development Workflow

### Making Changes to Protobuf

1. Edit `packages/proto/service.proto`
2. Run `pnpm proto:gen`
3. Implement handlers in `apps/api/grpc_server/`
4. Restart API server

### Database Schema Changes

1. Create new migration in `apps/api/db/migrations/`
2. Name it `00X_description.sql` (increment number)
3. Restart API server (migrations run automatically)

### Testing Changes

```bash
# Run Go tests
cd apps/api
go test ./...

# Run Next.js tests (if added)
cd apps/web
pnpm test
```

## Useful Commands

```bash
# Check Go version
go version

# Check protoc version
protoc --version

# List Go installed tools
ls $(go env GOPATH)/bin

# Check running processes
ps aux | grep "go run"
ps aux | grep "next-server"

# View API logs
cd apps/api && go run main.go

# View database tables
psql $DATABASE_URL_DIRECT -c "\dt"

# Clear all migrations (DANGER!)
psql $DATABASE_URL_DIRECT -c "TRUNCATE schema_migrations CASCADE;"
```

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Go gRPC Tutorial](https://grpc.io/docs/languages/go/)
- [Protocol Buffers Guide](https://protobuf.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Mantine UI Components](https://mantine.dev)

## Support

If you encounter issues:

1. Check the logs (API and browser console)
2. Review this guide
3. Check [DYNAMIC_SCHEMA_README.md](./DYNAMIC_SCHEMA_README.md)
4. Review the error messages in `schema_change_log` table

---

**Happy Coding! 🚀**
