#!/bin/bash
# Build Docker image for MCP Consultant

set -e

echo "Building MCP Consultant Docker image..."

# Build the image
docker build -t kortx-mcp:latest .

# Tag with git commit hash
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")
docker tag kortx-mcp:latest kortx-mcp:$GIT_HASH

echo "✅ Build complete!"
echo "Images tagged:"
echo "  - kortx-mcp:latest"
echo "  - kortx-mcp:$GIT_HASH"

# Show image size
echo ""
echo "Image size:"
docker images kortx-mcp:latest --format "{{.Size}}"
