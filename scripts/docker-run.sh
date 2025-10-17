#!/bin/bash
# Run MCP Consultant in Docker container

set -e

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY environment variable is not set"
  echo "Usage: OPENAI_API_KEY=your-key ./scripts/docker-run.sh"
  exit 1
fi

echo "Starting MCP Consultant container..."

# Run with stdio transport (interactive)
docker run -i --rm \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e OPENAI_MODEL=${OPENAI_MODEL:-gpt-5} \
  -e NODE_ENV=production \
  kortx-mcp:latest

echo "Container stopped."
