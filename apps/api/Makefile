# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
BINARY_NAME=api
BINARY_UNIX=$(BINARY_NAME)_unix

# Build the application
.PHONY: build
build:
	$(GOBUILD) -o $(BINARY_NAME) -v ./...

# Build for Linux
.PHONY: build-linux
build-linux:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) -o $(BINARY_UNIX) -v ./...

# Run the application
.PHONY: run
run:
	$(GOBUILD) -o $(BINARY_NAME) -v ./...
	./$(BINARY_NAME)

# Run with live reload (requires air: go install github.com/cosmtrek/air@latest)
.PHONY: dev
dev:
	air

# Clean build artifacts
.PHONY: clean
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)
	rm -f $(BINARY_UNIX)

# Run tests
.PHONY: test
test:
	$(GOTEST) -v ./...

# Run tests with coverage
.PHONY: test-coverage
test-coverage:
	$(GOTEST) -v -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out

# Download dependencies
.PHONY: deps
deps:
	$(GOMOD) download
	$(GOMOD) verify

# Tidy up dependencies
.PHONY: tidy
tidy:
	$(GOMOD) tidy

# Update dependencies
.PHONY: update
update:
	$(GOGET) -u ./...
	$(GOMOD) tidy

# Generate protobuf files (requires protoc and protoc-gen-go)
.PHONY: proto-gen
proto-gen:
	@echo "Generating protobuf files..."
	@if [ -d "proto" ]; then \
		protoc --go_out=. --go_opt=paths=source_relative \
			--go-grpc_out=. --go-grpc_opt=paths=source_relative \
			proto/*.proto; \
	else \
		echo "No proto directory found. Create proto/*.proto files first."; \
	fi

# Lint the code (requires golangci-lint)
.PHONY: lint
lint:
	golangci-lint run

# Format the code
.PHONY: fmt
fmt:
	$(GOCMD) fmt ./...

# Security audit (requires gosec)
.PHONY: security
security:
	gosec ./...

# Run all checks
.PHONY: check
check: fmt lint test

# Docker build
.PHONY: docker-build
docker-build:
	docker build -t $(BINARY_NAME) .

# Show help
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  build         - Build the application"
	@echo "  build-linux   - Build for Linux"
	@echo "  run           - Build and run the application"
	@echo "  dev           - Run with live reload (requires air)"
	@echo "  clean         - Clean build artifacts"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage"
	@echo "  deps          - Download dependencies"
	@echo "  tidy          - Tidy up dependencies"
	@echo "  update        - Update dependencies"
	@echo "  proto-gen     - Generate protobuf files"
	@echo "  lint          - Lint the code"
	@echo "  fmt           - Format the code"
	@echo "  security      - Run security audit"
	@echo "  check         - Run fmt, lint, and test"
	@echo "  docker-build  - Build Docker image"
	@echo "  help          - Show this help message"