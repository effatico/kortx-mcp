# Multi-stage build for production-ready MCP Consultant server
# Build stage
FROM node:22.12-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./

# Skip husky install during Docker build
ENV HUSKY=0

# Install ALL dependencies (including devDependencies) for building
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Security: Run npm audit to check for vulnerabilities
RUN npm audit --audit-level=moderate || true

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Install production dependencies only (skip scripts to avoid husky)
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Security: Audit production dependencies
RUN npm audit --production --audit-level=high

# Production stage
FROM node:22.12-alpine

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies and built files from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/build ./build
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Set non-root user
USER nodejs

# Expose port (if using HTTP transport in future)
EXPOSE 3000

# Health check - disabled for stdio transport
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:3000/health', (r) => { \
#     process.exit(r.statusCode === 200 ? 0 : 1) \
#   })"

# Default to stdio transport for MCP
CMD ["node", "build/index.js"]
