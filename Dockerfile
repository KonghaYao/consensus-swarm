# Multi-stage Dockerfile for Consensus Application
# Build stage: Use Node with pnpm to build frontend and backend
# Runtime stage: Use Bun to run the application

# ============================================
# Stage 1: Build with Node + pnpm
# ============================================
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.24.0

# Set working directory
WORKDIR /app

# Copy package.json files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY server ./server
COPY frontend ./frontend

# Build frontend only (server doesn't need compilation, bun runs TS directly)
RUN pnpm build:frontend

# ============================================
# Stage 2: Runtime with Bun
# ============================================
FROM oven/bun:1-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files (for metadata)
COPY package.json pnpm-lock.yaml ./
COPY server/package.json ./server/

# Copy server source code and dependencies from builder
COPY --from=builder /app/server ./server

# Copy root dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy built frontend from builder to be served by backend
COPY --from=builder /app/frontend/dist ./server/dist/frontend

# Create directory for SQLite database
RUN mkdir -p /app/.langgraph_api

# Expose port
EXPOSE 8123

# Set environment variables
ENV NODE_ENV=production
ENV SQLITE_DATABASE_URL=/app/.langgraph_api/langgraph.db

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run the server with bun
CMD ["bun", "run", "server/src/index.ts"]
