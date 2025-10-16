#!/bin/bash
# Test LLM Consultants MCP server with Claude Code
# This script builds the project and adds it to Claude Code for local testing

set -e

echo "🔨 Building LLM Consultants..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""

# Get the absolute path to the build directory
PROJECT_DIR=$(pwd)
BUILD_PATH="$PROJECT_DIR/build/index.js"

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ OPENAI_API_KEY environment variable is not set."
  echo "   Set it with: export OPENAI_API_KEY='your-api-key-here'"
  echo "   and rerun this script."
  exit 1
fi

echo "🔧 Adding MCP server to Claude Code..."
echo "   Server name: llm-consultant-test"
echo "   Path: $BUILD_PATH"
echo ""

# Remove existing test configuration if present
claude mcp remove llm-consultant-test 2>/dev/null || true

# Add the MCP server to Claude Code
claude mcp add --transport stdio llm-consultant-test \
  --env OPENAI_API_KEY="$OPENAI_API_KEY" \
  --env OPENAI_MODEL="${OPENAI_MODEL:-gpt-5-mini}" \
  --env OPENAI_REASONING_EFFORT="${OPENAI_REASONING_EFFORT:-minimal}" \
  --env LOG_LEVEL="${LOG_LEVEL:-debug}" \
  --env ENABLE_SERENA="${ENABLE_SERENA:-true}" \
  --env ENABLE_MEMORY="${ENABLE_MEMORY:-true}" \
  --env ENABLE_CCLSP="${ENABLE_CCLSP:-true}" \
  -- node "$BUILD_PATH"

echo ""
echo "✅ MCP server added to Claude Code as 'llm-consultant-test'"
echo ""
echo "📋 Available tools:"
echo "   • think-about-plan - Strategic planning feedback"
echo "   • suggest-alternative - Alternative solutions and approaches"
echo "   • improve-copy - Text and documentation improvement"
echo "   • solve-problem - Debugging and problem-solving assistance"
echo ""
echo "🧪 Example usage in Claude Code:"
echo ""
echo '   "Use the consultant to think about this plan:'
echo '    I want to migrate our REST API to GraphQL."'
echo ""
echo '   "Use the consultant to suggest alternatives to Redis'
echo '    for session storage in a distributed system."'
echo ""
echo '   "Use the consultant to improve this error message:'
echo '    Error 500: Internal server error."'
echo ""
echo '   "Use the consultant to solve this problem:'
echo '    Users are experiencing intermittent timeouts."'
echo ""
echo "📊 View available tools:"
echo "   claude mcp inspect llm-consultant-test"
echo ""
echo "📝 View logs:"
echo "   tail -f \"$PROJECT_DIR/llm-consultants.log\""
echo ""
echo "🔍 Check configuration:"
echo "   claude mcp get llm-consultant-test"
echo ""
echo "🗑️  Remove after testing:"
echo "   claude mcp remove llm-consultant-test"
echo ""
echo "💡 Tips:"
echo "   • Rebuild with: npm run build"
echo "   • Rerun this script to pick up changes"
echo "   • Set LOG_LEVEL=debug for detailed logs"
echo "   • Check logs if tools don't work as expected"
echo ""
