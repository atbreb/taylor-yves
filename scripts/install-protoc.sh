#!/bin/bash

# Script to install Protocol Buffer compiler and plugins

echo "Installing Protocol Buffer tools..."

# Check if protoc is installed
if ! command -v protoc &> /dev/null; then
    echo "protoc not found, please install it:"
    echo ""
    echo "On macOS with Homebrew:"
    echo "  brew install protobuf"
    echo ""
    echo "On Linux:"
    echo "  apt-get install -y protobuf-compiler  # Debian/Ubuntu"
    echo "  dnf install protobuf-compiler         # Fedora"
    echo ""
    exit 1
fi

echo "protoc found: $(protoc --version)"

# Install Go plugins if Go is available
if command -v go &> /dev/null; then
    echo "Installing Go protobuf plugins..."
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
    echo "Go plugins installed"
else
    echo "Go not found, skipping Go plugin installation"
fi

echo "Installation complete!"
echo ""
echo "To generate protobuf files, run:"
echo "  pnpm run proto:gen"