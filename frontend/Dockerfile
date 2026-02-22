# Stage 1: Build React app
FROM node:alpine AS builder
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and config
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/index.html frontend/vite.config.ts frontend/tsconfig.json frontend/tsconfig.node.json ./

# Build React app
RUN npm run build

# Stage 2: Serve with Caddy
FROM caddy:2.10.2
WORKDIR /app

# Copy Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Copy built React app from builder stage
COPY --from=builder /app/dist /app/www

# Mount point for data (data.json, images)
VOLUME ["/app/data"]

# Expose port
EXPOSE 80

# Start Caddy server
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
