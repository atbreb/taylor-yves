# Build stage
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make protobuf protobuf-dev

# Set working directory
WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Install protoc plugins
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Copy source code
COPY . .

# Copy proto files from packages
COPY ../../packages/proto /proto

# Generate protobuf files
RUN protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    /proto/service.proto || true

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM gcr.io/distroless/static-debian11

# Copy the binary from builder
COPY --from=builder /build/main /main

# Copy any necessary config files
COPY --from=builder /build/.env.example /.env.example

# Expose ports
EXPOSE 8080 50051

# Run the binary
ENTRYPOINT ["/main"]