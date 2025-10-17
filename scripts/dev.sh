#!/bin/bash

# Development startup script

echo "Starting Agentic Template Development Environment..."

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please update .env with your API keys and database credentials"
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Start development servers
echo "Starting development servers..."
pnpm dev