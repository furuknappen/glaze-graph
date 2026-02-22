# Docker & Caddy Patterns for Glaze Graph

## Multi-Stage Docker Build

### General Pattern
```dockerfile
# Stage 1: Build
FROM base-image AS builder
WORKDIR /build
COPY source .
RUN build-commands
# Creates artifacts in /build/dist or similar

# Stage 2: Runtime
FROM runtime-image
WORKDIR /app
COPY --from=builder /build/dist /app/www
EXPOSE port
CMD start-command
```

**Benefits:**
- Builder stage (including compilers, dev dependencies) not in final image
- Final image only contains runtime dependencies
- Smaller image size (~30MB vs 1GB+)

### Glaze Graph Dockerfile
```dockerfile
# Stage 1: Build React app
FROM node:24-lts-alpine AS builder
WORKDIR /app

# Copy package files and install
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/index.html frontend/vite.config.ts frontend/tsconfig.json ./
RUN npm run build
# Output: /app/dist/

# Stage 2: Serve with Caddy
FROM caddy:2.10.2
WORKDIR /app

# Copy Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Copy built React app
COPY --from=builder /app/dist /app/www

# Mount point for data (data.json, images)
VOLUME ["/app/data"]

# Expose port
EXPOSE 80

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
```

**Key Points:**
- Stage 1: Only Node.js, npm, needed for building
- Stage 2: Only Caddy and built artifacts
- VOLUME declaration: documents where TrueNAS mounts data
- Alpine image: minimal base (3MB vs 900MB for Node full image)

## Dockerfile Best Practices

### Layer Caching
```dockerfile
# ✅ Good: Dependencies change rarely
COPY package*.json ./
RUN npm ci
COPY src ./
RUN npm run build

# ❌ Bad: Rebuilds everything if src changes
COPY . ./
RUN npm ci && npm run build
```

**Pattern:**
- Order layers: static → rarely changing → frequently changing
- Each RUN creates a layer; Docker caches layers
- More granular layers = better caching in CI/CD

### Alpine vs Full Images
```dockerfile
# ✅ Small: ~40MB
FROM node:24-lts-alpine
RUN apk add --no-cache python3 make g++  # If needed

# ❌ Large: ~900MB
FROM node:24-lts
```

**When to use Alpine:**
- Default: use Alpine
- When: complex native dependencies (canvas, sharp) - use full image
- Glaze Graph: Alpine is sufficient

### .dockerignore
```
node_modules
npm-debug.log
dist
.git
.github
.env
.env.local
.DS_Store
coverage
```

**Why:**
- Reduces build context sent to Docker daemon
- Prevents copying unnecessary files
- Faster builds

## Caddy Configuration

### Basic Structure
```caddy
# Listen on port 80
:80 {
    # Global settings
    log {
        level info
    }
    
    # Route handling
    route /api/* {
        # API endpoints
    }
    
    # Static file serving
    root /app/www
    file_server
}
```

### Glaze Graph Caddyfile
```caddy
:80 {
    # Serve Vite React build
    root /app/www
    file_server
    
    # Serve mounted data folder
    handle /data/* {
        root /app/data
        file_server
    }
    
    # SPA fallback: rewrite 404s to index.html
    handle_errors {
        rewrite 404.html
        file_server
    }
}
```

**Route Order:**
1. `/data/*` matches first (specific route)
2. Default file_server (matches everything)
3. Error handler (catches 404s)

### Common Caddy Directives

#### file_server
```caddy
file_server {
    root /app/www
    index index.html
    browse  # Enable directory listing (disable for prod)
}
```

#### reverse_proxy
```caddy
reverse_proxy /api/* http://backend:8000 {
    uri /api/* /
}
```

#### rewrite
```caddy
rewrite 404.html  # Rewrite path to 404.html
```

#### header
```caddy
header {
    Content-Type application/json
    Cache-Control "public, max-age=3600"
}
```

#### redir
```caddy
redir /old-url /new-url permanent
```

## Docker Compose for Local Development

### Basic Pattern
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "80:80"
    volumes:
      - ./data:/app/data:ro
    environment:
      LOG_LEVEL: debug
```

### Glaze Graph docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    # Build from Dockerfile
    build:
      context: .
      dockerfile: frontend/Dockerfile
    
    # Container name and restart policy
    container_name: glaze-graph
    restart: unless-stopped
    
    # Port mapping: host:container
    ports:
      - "80:80"
    
    # Volume mounts: host:container:mode
    volumes:
      - ./data:/app/data:ro          # Read-only data volume
      - ./frontend/dist:/app/www:ro  # Built app (read-only)
    
    # Environment variables
    environment:
      LOG_LEVEL: debug
    
    # Health check (optional)
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Volume Modes:**
- `:ro` - read-only (safer, prevents accidental writes)
- `:rw` - read-write (default)

### Starting Services
```bash
# Build and start
docker compose up

# Run in background
docker compose up -d

# Stop services
docker compose down

# Rebuild image
docker compose up --build
```

## Volume Mounting Strategies

### Single Mount (Recommended for Glaze Graph)
```bash
docker run -v /mnt/tank/glaze-graph:/app/data:ro ...
```

**Pros:**
- Simple configuration
- Single point of backup
- Scalable for future growth

**Cons:**
- Data and images tightly coupled (not an issue here)

### Multiple Mounts (More Flexible)
```bash
docker run \
  -v /mnt/tank/glaze-graph-config:/app/config:ro \
  -v /mnt/tank/glaze-graph-images:/app/images:ro \
  ...
```

**Pros:**
- Separate data and media (flexible)
- Can mount from different NAS locations
- Better scaling for large image libraries

**Cons:**
- More complex configuration
- Multiple backup points

### Bind Mount vs Named Volume
```bash
# Bind mount (local directory)
-v /path/on/host:/path/in/container

# Named volume (Docker managed)
-v my-data:/path/in/container
```

**For Glaze Graph:**
- Use bind mount (TrueNAS manages the directory)
- Not Docker-managed volumes

## Image Optimization

### Building for Production
```dockerfile
# Build with optimizations
RUN npm run build

# Check size
RUN du -sh dist/

# Minimize build context
COPY --chown=nobody:nobody --from=builder /app/dist /app/www
```

### Reducing Image Size

**Frontend (Vite):**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',           // Minify JavaScript
    sourcemap: false,           // No debug files
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
```

**Images:**
```bash
# Pre-compress JPG files on TrueNAS
jpegoptim --all-progressive --max=85 *.jpg
```

### Multi-Platform Builds
```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 .
```

**Useful for:**
- Running on x86_64 and ARM64 servers
- TrueNAS might run on either architecture

## Caddy with HTTPS (Optional)

### Auto HTTPS
```caddy
example.com {
    reverse_proxy localhost:8000
    # Caddy automatically gets Let's Encrypt certificate
}
```

### Self-Signed Certificate
```caddy
:443 {
    tls internal
    root /app/www
    file_server
}
```

### For Glaze Graph (No HTTPS needed yet)
```caddy
:80 {
    # HTTP only for local network
    root /app/www
    file_server
}
```

## Health Checks

### Docker Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD curl -f http://localhost/ || exit 1
```

### In docker-compose.yml
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### TrueNAS Monitoring
```bash
# Check container status
docker ps

# Check logs
docker logs glaze-graph

# Manual health check
curl http://container-ip/
```

## Debugging Docker Issues

### View Container Logs
```bash
docker logs glaze-graph
docker logs -f glaze-graph  # Follow logs
docker logs --tail 100 glaze-graph  # Last 100 lines
```

### Execute Commands in Container
```bash
docker exec -it glaze-graph sh
docker exec glaze-graph curl http://localhost/data/data.json
```

### Inspect Container
```bash
docker inspect glaze-graph
docker stats glaze-graph  # CPU, memory usage
```

### Check Volume Mounts
```bash
docker inspect glaze-graph | grep -A 10 Mounts
```

## GitHub Actions Docker Build

### Build and Push Workflow
```yaml
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    context: .
    file: ./frontend/Dockerfile
    push: true
    tags: |
      ghcr.io/furuknappen/glaze-graph:latest
      ghcr.io/furuknappen/glaze-graph:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Key Features:**
- GitHub Actions Cache (`type=gha`): Speeds up builds
- Multiple tags: `latest` for easy pulling, SHA for traceability
- `push: true`: Only if authenticated and on main

### Build Matrix (Multiple Platforms)
```yaml
strategy:
  matrix:
    platform: [linux/amd64, linux/arm64]

- uses: docker/build-push-action@v6
  with:
    platforms: ${{ matrix.platform }}
```

## Security Best Practices

### Don't Run as Root
```dockerfile
RUN addgroup -g 1001 caddy && \
    adduser -u 1001 -D -G caddy caddy
USER caddy
```

### Don't Store Secrets in Images
```bash
# ❌ Bad
RUN echo "API_KEY=secret123" > .env

# ✅ Good
docker run -e API_KEY="secret123" ...
```

### Use Read-Only Volumes
```bash
-v /mnt/tank/glaze-graph:/app/data:ro
```

### Minimal Base Images
```dockerfile
FROM caddy:2.10.2  # Already minimal
FROM node:24-lts-alpine  # Alpine version
```

## Useful Caddy Plugins

**For Glaze Graph (not needed yet):**
- `caddy-jwt`: Add authentication
- `cache-handler`: Cache responses
- `http.handlers.cors`: CORS headers

**Install:**
```dockerfile
RUN caddy add-package github.com/caddy-dns/cloudflare@latest
```
