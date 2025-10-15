#!/bin/bash
# Build Docker image for MCP Consultant

set -e

echo "Building MCP Consultant Docker image..."

# Build the image
docker build -t llm-consultants:latest .

# Tag with git commit hash
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")
docker tag llm-consultants:latest llm-consultants:$GIT_HASH

echo "✅ Build complete!"
echo "Images tagged:"
echo "  - llm-consultants:latest"
echo "  - llm-consultants:$GIT_HASH"

# Show image size
echo ""
echo "Image size:"
docker images llm-consultants:latest --format "{{.Size}}"
