#!/bin/bash
# Build Docker image for MCP Consultant

set -e

echo "Building MCP Consultant Docker image..."

# Build the image
docker build -t mcp-consultant:latest .

# Tag with git commit hash
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")
docker tag mcp-consultant:latest mcp-consultant:$GIT_HASH

echo "✅ Build complete!"
echo "Images tagged:"
echo "  - mcp-consultant:latest"
echo "  - mcp-consultant:$GIT_HASH"

# Show image size
echo ""
echo "Image size:"
docker images mcp-consultant:latest --format "{{.Size}}"
